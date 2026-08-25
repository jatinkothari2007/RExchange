-- ====================================================================
-- RExchange Supabase Migration 04: Database Functions & Triggers
-- ====================================================================

-- 1. ATOMIC EXCHANGE COMPLETION FUNCTION (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.complete_exchange(p_exchange_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exchange RECORD;
    v_receiver RECORD;
    v_giver RECORD;
    v_listing RECORD;
    v_receiver_new_bal INT;
    v_giver_new_bal INT;
    v_money_saved NUMERIC := 500;
    v_waste_kg NUMERIC := 1.0;
    v_hours NUMERIC := 0.0;
    v_multiplier NUMERIC := 1.0;
    v_payout INT;
BEGIN
    -- Fetch exchange row with row lock
    SELECT * INTO v_exchange
    FROM public.exchanges
    WHERE id = p_exchange_id
    FOR UPDATE;

    IF v_exchange IS NULL THEN
        RAISE EXCEPTION 'Exchange contract % not found.', p_exchange_id;
    END IF;

    IF v_exchange.status = 'completed' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Exchange already completed.');
    END IF;

    -- Verify both parties have confirmed physical handoff
    IF NOT (v_exchange.handoff_confirmed_giver AND v_exchange.handoff_confirmed_receiver) THEN
        RAISE EXCEPTION 'Mutual handoff verification incomplete. Both giver and receiver must confirm.';
    END IF;

    -- Fetch receiver and giver records
    SELECT * INTO v_receiver FROM public.users WHERE id = v_exchange.receiver_id FOR UPDATE;
    SELECT * INTO v_giver FROM public.users WHERE id = v_exchange.giver_id FOR UPDATE;

    IF v_receiver.karma_balance < v_exchange.karma_value THEN
        RAISE EXCEPTION 'Insufficient Karma balance: Receiver has % Karma, but % required.',
            v_receiver.karma_balance, v_exchange.karma_value;
    END IF;

    -- Calculate streak bonus multiplier if giver has 3+ week streak
    IF COALESCE(v_giver.current_streak, 1) >= 3 THEN
        v_multiplier := 1.10; -- +10% Karma multiplier bonus
    END IF;

    v_payout := ROUND(v_exchange.karma_value * v_multiplier);

    -- Deduct receiver balance & credit giver balance
    v_receiver_new_bal := v_receiver.karma_balance - v_exchange.karma_value;
    v_giver_new_bal := v_giver.karma_balance + v_payout;

    UPDATE public.users
    SET karma_balance = v_receiver_new_bal,
        updated_at = NOW()
    WHERE id = v_exchange.receiver_id;

    UPDATE public.users
    SET karma_balance = v_giver_new_bal,
        last_give_date = NOW(),
        updated_at = NOW()
    WHERE id = v_exchange.giver_id;

    -- Update exchange contract status
    UPDATE public.exchanges
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = p_exchange_id;

    -- Insert Karma Transactions audit log (Debit receiver)
    INSERT INTO public.karma_transactions (
        user_id, exchange_id, amount, direction, balance_after, description
    ) VALUES (
        v_exchange.receiver_id, p_exchange_id, v_exchange.karma_value, 'debit', v_receiver_new_bal,
        'Karma debited for completed campus resource exchange'
    );

    -- Insert Karma Transactions audit log (Credit giver)
    INSERT INTO public.karma_transactions (
        user_id, exchange_id, amount, direction, balance_after, description
    ) VALUES (
        v_exchange.giver_id, p_exchange_id, v_payout, 'credit', v_giver_new_bal,
        'Karma credited for giving campus resource' || CASE WHEN v_multiplier > 1.0 THEN ' (+10% Streak Bonus!)' ELSE '' END
    );

    -- Category-based impact telemetry lookup
    IF v_exchange.listing_id IS NOT NULL THEN
        SELECT * INTO v_listing FROM public.listings WHERE id = v_exchange.listing_id;
        IF v_listing IS NOT NULL THEN
            IF v_listing.type = 'item' THEN
                v_money_saved := 750;
                v_waste_kg := 1.5;
            ELSIF v_listing.type = 'note' THEN
                v_money_saved := 350;
                v_waste_kg := 0.5;
            ELSIF v_listing.type = 'ticket' THEN
                v_money_saved := 400;
                v_waste_kg := 0.1;
            ELSIF v_listing.type = 'skill' THEN
                v_money_saved := 500;
                v_hours := 1.0;
                v_waste_kg := 0.0;
            END IF;

            -- Mark listing as exchanged
            UPDATE public.listings SET status = 'exchanged' WHERE id = v_exchange.listing_id;
        END IF;
    END IF;

    -- Insert Impact Log entry
    INSERT INTO public.impact_log (
        exchange_id, money_saved_estimate, waste_diverted_kg, hours_contributed
    ) VALUES (
        p_exchange_id, v_money_saved, v_waste_kg, v_hours
    );

    -- Send realtime notifications to both parties
    INSERT INTO public.notifications (user_id, type, payload) VALUES
    (
        v_exchange.giver_id,
        'KARMA_EARNED',
        jsonb_build_object(
            'title', 'Exchange Completed!',
            'message', 'Handoff verified. You earned +' || v_payout || ' Karma points.',
            'exchange_id', p_exchange_id
        )
    ),
    (
        v_exchange.receiver_id,
        'EXCHANGE_COMPLETED',
        jsonb_build_object(
            'title', 'Resource Received!',
            'message', 'Handoff verified. ' || v_exchange.karma_value || ' Karma transferred.',
            'exchange_id', p_exchange_id
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'exchange_id', p_exchange_id,
        'karma_transferred', v_exchange.karma_value,
        'giver_payout', v_payout
    );
END;
$$;


-- 2. COMPUTE URGENCY SCORE FUNCTION & TRIGGER FOR NEEDS BOARD
CREATE OR REPLACE FUNCTION public.trg_compute_urgency_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_hours_remaining NUMERIC;
BEGIN
    v_hours_remaining := GREATEST(EXTRACT(EPOCH FROM (NEW.deadline - NOW())) / 3600.0, 0.1);
    -- Inverse time formula: shorter time remaining = exponentially higher urgency score
    NEW.urgency_score := ROUND((100.0 / v_hours_remaining)::NUMERIC, 2);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_needs_urgency ON public.needs;
CREATE TRIGGER trg_needs_urgency
    BEFORE INSERT OR UPDATE OF deadline ON public.needs
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_compute_urgency_score();


-- 3. REPUTATION DECAY SCHEDULED FUNCTION (FOR PG_CRON)
CREATE OR REPLACE FUNCTION public.decay_reputation()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Slightly decay reputation score for users inactive 30+ days
    UPDATE public.users
    SET reputation_score = GREATEST(3.0, reputation_score - 0.1),
        updated_at = NOW()
    WHERE updated_at < NOW() - INTERVAL '30 days'
      AND reputation_score > 3.0;
END;
$$;


-- 4. EXPIRE LISTINGS SCHEDULED FUNCTION (FOR PG_CRON)
CREATE OR REPLACE FUNCTION public.expire_listings()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.listings
    SET status = 'expired',
        updated_at = NOW()
    WHERE expires_at < NOW()
      AND status = 'available';
END;
$$;
