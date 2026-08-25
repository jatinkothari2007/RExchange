-- ====================================================================
-- RExchange Supabase Complete Production Database Migration
-- Single top-to-bottom executable script for Supabase SQL Editor
-- Includes: Tasks 1 (Schema), 2 (Auth & Domain Validation), 3 (RLS Policies),
--           4 (Database Functions & Triggers), 5 (Storage Buckets & Policies),
--           6 (Realtime Subscriptions), and 7 (Demo Seed Data)
-- ====================================================================

-- Clean Reset (Allows re-running migration safely without foreign key conflicts)
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP TABLE IF EXISTS public.impact_log CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.karma_transactions CASCADE;
DROP TABLE IF EXISTS public.exchanges CASCADE;
DROP TABLE IF EXISTS public.needs CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.college_config CASCADE;

-- ====================================================================
-- TASK 1 — SCHEMA & INDEXES
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. College Config Table (For domain validation)
CREATE TABLE IF NOT EXISTS public.college_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.college_config (key, value)
VALUES ('allowed_domain', 'srmist.edu.in')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Public Users Profile Table (Tied to Auth Users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    year INT NOT NULL CHECK (year >= 1 AND year <= 5),
    hostel_block TEXT NOT NULL,
    reputation_score NUMERIC DEFAULT 5.0 CHECK (reputation_score >= 0.0 AND reputation_score <= 5.0),
    karma_balance INT NOT NULL DEFAULT 20 CHECK (karma_balance >= 0),
    current_streak INT DEFAULT 1,
    last_give_date TIMESTAMPTZ,
    will_recipient_id UUID REFERENCES public.users(id),
    will_activated BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Listings Table
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('item', 'note', 'ticket', 'skill', 'opportunity')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    karma_value INT NOT NULL CHECK (karma_value >= 0),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'exchanged', 'expired')),
    image_urls TEXT[] DEFAULT '{}',
    voice_note_url TEXT,
    pickup_point TEXT NOT NULL,
    willed_from_name TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Urgent Needs Board Table
CREATE TABLE IF NOT EXISTS public.needs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    deadline TIMESTAMPTZ NOT NULL,
    urgency_score NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'fulfilled', 'expired')),
    fulfilled_by_listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    hostel_block TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Exchanges Contract Table
CREATE TABLE IF NOT EXISTS public.exchanges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    need_id UUID REFERENCES public.needs(id) ON DELETE SET NULL,
    bundle_id UUID,
    giver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    karma_value INT NOT NULL CHECK (karma_value >= 0),
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'handoff_confirmed', 'completed', 'cancelled')),
    handoff_confirmed_giver BOOLEAN DEFAULT FALSE,
    handoff_confirmed_receiver BOOLEAN DEFAULT FALSE,
    handoff_code TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 6. Karma Transactions Ledger (Audit Trail)
CREATE TABLE IF NOT EXISTS public.karma_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    exchange_id UUID REFERENCES public.exchanges(id) ON DELETE SET NULL,
    amount INT NOT NULL CHECK (amount > 0),
    direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
    balance_after INT NOT NULL CHECK (balance_after >= 0),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Chat & Karma Proposal Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id UUID NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'karma_proposal')),
    proposed_karma INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Ratings & Feedback Table
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id UUID NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
    rater_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ratee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score >= 1 AND score <= 5),
    tags TEXT[] DEFAULT '{}',
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_exchange_rater UNIQUE (exchange_id, rater_id)
);

-- 9. Campus Impact Telemetry Log Table
CREATE TABLE IF NOT EXISTS public.impact_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id UUID NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
    money_saved_estimate NUMERIC DEFAULT 0,
    waste_diverted_kg NUMERIC DEFAULT 0,
    hours_contributed NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. User Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performant querying
CREATE INDEX IF NOT EXISTS idx_listings_owner ON public.listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_type ON public.listings(type);
CREATE INDEX IF NOT EXISTS idx_exchanges_participants ON public.exchanges(giver_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_exchange ON public.messages(exchange_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_needs_urgency ON public.needs(urgency_score DESC);


-- ====================================================================
-- TASK 2 — AUTH DOMAIN VALIDATION & USER SYNC TRIGGERS
-- ====================================================================

CREATE OR REPLACE FUNCTION public.validate_college_email_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_allowed_domain TEXT;
    v_user_domain TEXT;
BEGIN
    SELECT value INTO v_allowed_domain
    FROM public.college_config
    WHERE key = 'allowed_domain';

    IF v_allowed_domain IS NULL THEN
        v_allowed_domain := 'srmist.edu.in';
    END IF;

    v_user_domain := LOWER(SPLIT_PART(NEW.email, '@', 2));

    IF v_user_domain <> LOWER(v_allowed_domain) THEN
        RAISE EXCEPTION 'Unauthorized signup: Email domain "@%" is not allowed. Registration is restricted to institutional "@%" domain.',
            v_user_domain, v_allowed_domain;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_college_email ON auth.users;
CREATE TRIGGER trg_validate_college_email
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_college_email_domain();


CREATE OR REPLACE FUNCTION public.handle_new_user_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_name TEXT;
    v_department TEXT;
    v_year INT;
    v_hostel TEXT;
BEGIN
    v_name := COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1));
    v_department := COALESCE(NEW.raw_user_meta_data->>'department', 'Computer Science & Engineering');
    v_year := COALESCE((NEW.raw_user_meta_data->>'year')::INT, 2);
    v_hostel := COALESCE(NEW.raw_user_meta_data->>'hostel_block', 'Java Block 3');

    INSERT INTO public.users (
        auth_id,
        name,
        email,
        department,
        year,
        hostel_block,
        karma_balance,
        reputation_score
    )
    VALUES (
        NEW.id,
        v_name,
        NEW.email,
        v_department,
        v_year,
        v_hostel,
        20,
        5.0
    )
    ON CONFLICT (email) DO UPDATE SET auth_id = EXCLUDED.auth_id;

    INSERT INTO public.notifications (user_id, type, payload)
    SELECT
        u.id,
        'WELCOME_AIRDROP',
        jsonb_build_object(
            'title', 'Welcome to RExchange Campus!',
            'message', 'Your institutional account is verified. You received 20 Karma points to begin exchanging.'
        )
    FROM public.users u
    WHERE u.auth_id = NEW.id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_new_user_sync ON auth.users;
CREATE TRIGGER trg_handle_new_user_sync
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_sync();


-- ====================================================================
-- TASK 3 — ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are readable by authenticated users" ON public.users;
CREATE POLICY "Public profiles are readable by authenticated users"
ON public.users FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth_id);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Listings are readable by campus students" ON public.listings;
CREATE POLICY "Listings are readable by campus students"
ON public.listings FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can insert own listings" ON public.listings;
CREATE POLICY "Users can insert own listings"
ON public.listings FOR INSERT
TO authenticated
WITH CHECK (owner_id = public.get_current_user_id());

DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
CREATE POLICY "Users can update own listings"
ON public.listings FOR UPDATE
TO authenticated
USING (owner_id = public.get_current_user_id())
WITH CHECK (owner_id = public.get_current_user_id());

DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;
CREATE POLICY "Users can delete own listings"
ON public.listings FOR DELETE
TO authenticated
USING (owner_id = public.get_current_user_id());

ALTER TABLE public.needs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Needs board readable by campus students" ON public.needs;
CREATE POLICY "Needs board readable by campus students"
ON public.needs FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can insert own urgent needs" ON public.needs;
CREATE POLICY "Users can insert own urgent needs"
ON public.needs FOR INSERT
TO authenticated
WITH CHECK (requester_id = public.get_current_user_id());

DROP POLICY IF EXISTS "Users can update own urgent needs" ON public.needs;
CREATE POLICY "Users can update own urgent needs"
ON public.needs FOR UPDATE
TO authenticated
USING (requester_id = public.get_current_user_id())
WITH CHECK (requester_id = public.get_current_user_id());

DROP POLICY IF EXISTS "Users can delete own urgent needs" ON public.needs;
CREATE POLICY "Users can delete own urgent needs"
ON public.needs FOR DELETE
TO authenticated
USING (requester_id = public.get_current_user_id());

ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view own exchange" ON public.exchanges;
CREATE POLICY "Participants can view own exchange"
ON public.exchanges FOR SELECT
TO authenticated
USING (
    giver_id = public.get_current_user_id() OR
    receiver_id = public.get_current_user_id()
);

DROP POLICY IF EXISTS "Users can initiate exchange request" ON public.exchanges;
CREATE POLICY "Users can initiate exchange request"
ON public.exchanges FOR INSERT
TO authenticated
WITH CHECK (receiver_id = public.get_current_user_id());

DROP POLICY IF EXISTS "Participants can update own exchange" ON public.exchanges;
CREATE POLICY "Participants can update own exchange"
ON public.exchanges FOR UPDATE
TO authenticated
USING (
    giver_id = public.get_current_user_id() OR
    receiver_id = public.get_current_user_id()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Exchange participants can read thread messages" ON public.messages;
CREATE POLICY "Exchange participants can read thread messages"
ON public.messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.exchanges e
        WHERE e.id = messages.exchange_id
        AND (e.giver_id = public.get_current_user_id() OR e.receiver_id = public.get_current_user_id())
    )
);

DROP POLICY IF EXISTS "Exchange participants can send thread messages" ON public.messages;
CREATE POLICY "Exchange participants can send thread messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = public.get_current_user_id() AND
    EXISTS (
        SELECT 1 FROM public.exchanges e
        WHERE e.id = messages.exchange_id
        AND (e.giver_id = public.get_current_user_id() OR e.receiver_id = public.get_current_user_id())
    )
);

ALTER TABLE public.karma_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own transaction audit trail" ON public.karma_transactions;
CREATE POLICY "Users can read own transaction audit trail"
ON public.karma_transactions FOR SELECT
TO authenticated
USING (user_id = public.get_current_user_id());

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ratings are readable by authenticated users" ON public.ratings;
CREATE POLICY "Ratings are readable by authenticated users"
ON public.ratings FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Participants of completed exchange can insert rating" ON public.ratings;
CREATE POLICY "Participants of completed exchange can insert rating"
ON public.ratings FOR INSERT
TO authenticated
WITH CHECK (
    rater_id = public.get_current_user_id() AND
    EXISTS (
        SELECT 1 FROM public.exchanges e
        WHERE e.id = ratings.exchange_id
        AND e.status = 'completed'
        AND (e.giver_id = rater_id OR e.receiver_id = rater_id)
    )
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = public.get_current_user_id());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = public.get_current_user_id())
WITH CHECK (user_id = public.get_current_user_id());

ALTER TABLE public.impact_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Impact stats readable by campus users" ON public.impact_log;
CREATE POLICY "Impact stats readable by campus users"
ON public.impact_log FOR SELECT
TO authenticated
USING (true);


-- ====================================================================
-- TASK 4 — DATABASE FUNCTIONS & TRIGGERS
-- ====================================================================

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

    IF NOT (v_exchange.handoff_confirmed_giver AND v_exchange.handoff_confirmed_receiver) THEN
        RAISE EXCEPTION 'Mutual handoff verification incomplete. Both giver and receiver must confirm.';
    END IF;

    SELECT * INTO v_receiver FROM public.users WHERE id = v_exchange.receiver_id FOR UPDATE;
    SELECT * INTO v_giver FROM public.users WHERE id = v_exchange.giver_id FOR UPDATE;

    IF v_receiver.karma_balance < v_exchange.karma_value THEN
        RAISE EXCEPTION 'Insufficient Karma balance: Receiver has % Karma, but % required.',
            v_receiver.karma_balance, v_exchange.karma_value;
    END IF;

    IF COALESCE(v_giver.current_streak, 1) >= 3 THEN
        v_multiplier := 1.10;
    END IF;

    v_payout := ROUND(v_exchange.karma_value * v_multiplier);

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

    UPDATE public.exchanges
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = p_exchange_id;

    INSERT INTO public.karma_transactions (
        user_id, exchange_id, amount, direction, balance_after, description
    ) VALUES (
        v_exchange.receiver_id, p_exchange_id, v_exchange.karma_value, 'debit', v_receiver_new_bal,
        'Karma debited for completed campus resource exchange'
    );

    INSERT INTO public.karma_transactions (
        user_id, exchange_id, amount, direction, balance_after, description
    ) VALUES (
        v_exchange.giver_id, p_exchange_id, v_payout, 'credit', v_giver_new_bal,
        'Karma credited for giving campus resource' || CASE WHEN v_multiplier > 1.0 THEN ' (+10% Streak Bonus!)' ELSE '' END
    );

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

            UPDATE public.listings SET status = 'exchanged' WHERE id = v_exchange.listing_id;
        END IF;
    END IF;

    INSERT INTO public.impact_log (
        exchange_id, money_saved_estimate, waste_diverted_kg, hours_contributed
    ) VALUES (
        p_exchange_id, v_money_saved, v_waste_kg, v_hours
    );

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


CREATE OR REPLACE FUNCTION public.trg_compute_urgency_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_hours_remaining NUMERIC;
BEGIN
    v_hours_remaining := GREATEST(EXTRACT(EPOCH FROM (NEW.deadline - NOW())) / 3600.0, 0.1);
    NEW.urgency_score := ROUND((100.0 / v_hours_remaining)::NUMERIC, 2);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_needs_urgency ON public.needs;
CREATE TRIGGER trg_needs_urgency
    BEFORE INSERT OR UPDATE OF deadline ON public.needs
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_compute_urgency_score();


CREATE OR REPLACE FUNCTION public.decay_reputation()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.users
    SET reputation_score = GREATEST(3.0, reputation_score - 0.1),
        updated_at = NOW()
    WHERE updated_at < NOW() - INTERVAL '30 days'
      AND reputation_score > 3.0;
END;
$$;


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


-- ====================================================================
-- TASK 5 — STORAGE BUCKETS & POLICIES
-- ====================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read access for listing-images" ON storage.objects;
CREATE POLICY "Public read access for listing-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "Users can delete own listing images" ON storage.objects;
CREATE POLICY "Users can delete own listing images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'listing-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Public read access for user avatars" ON storage.objects;
CREATE POLICY "Public read access for user avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can write to own avatar folder" ON storage.objects;
CREATE POLICY "Users can write to own avatar folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own avatar file" ON storage.objects;
CREATE POLICY "Users can update own avatar file"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own avatar file" ON storage.objects;
CREATE POLICY "Users can delete own avatar file"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);


-- ====================================================================
-- TASK 6 — REALTIME SUBSCRIPTIONS
-- ====================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'needs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.needs;
    END IF;
END $$;

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.needs REPLICA IDENTITY FULL;


-- ====================================================================
-- TASK 7 — DEMO SEED DATA
-- ====================================================================

INSERT INTO public.users (id, name, email, department, year, hostel_block, reputation_score, karma_balance, current_streak)
VALUES
    ('11111111-0000-0000-0000-000000000001', 'Aarav Sharma', 'aarav.sharma@srmist.edu.in', 'Computer Science & Engineering', 3, 'Java Block 3', 4.9, 145, 4),
    ('11111111-0000-0000-0000-000000000002', 'Priya Nair', 'priya.nair@srmist.edu.in', 'Electronics & Communication', 3, 'KC Block B', 4.8, 120, 3),
    ('11111111-0000-0000-0000-000000000003', 'Rohan Gupta', 'rohan.gupta@srmist.edu.in', 'Biotechnology', 4, 'Adhiyaman Block', 4.7, 190, 5),
    ('11111111-0000-0000-0000-000000000004', 'Sneha Reddy', 'sneha.reddy@srmist.edu.in', 'Information Technology', 2, 'MKN Block', 4.6, 85, 2),
    ('11111111-0000-0000-0000-000000000005', 'Karthik Raja', 'karthik.raja@srmist.edu.in', 'Mechanical Engineering', 3, 'Java Block 1', 4.5, 60, 1),
    ('11111111-0000-0000-0000-000000000006', 'Ananya Verma', 'ananya.verma@srmist.edu.in', 'Electrical & Electronics', 2, 'KC Block A', 4.8, 95, 2),
    ('11111111-0000-0000-0000-000000000007', 'Vikram Singh', 'vikram.singh@srmist.edu.in', 'Civil Engineering', 4, 'Nelson Mandela Block', 4.4, 110, 3),
    ('11111111-0000-0000-0000-000000000008', 'Diya Menon', 'diya.menon@srmist.edu.in', 'Aerospace Engineering', 1, 'MKN Block', 4.9, 45, 1),
    ('11111111-0000-0000-0000-000000000009', 'Aditya Joshi', 'aditya.joshi@srmist.edu.in', 'Data Science & AI', 3, 'Java Block 4', 4.7, 130, 4),
    ('11111111-0000-0000-0000-000000000010', 'Meera Pillai', 'meera.pillai@srmist.edu.in', 'Chemical Engineering', 2, 'KC Block C', 4.6, 75, 2),
    ('11111111-0000-0000-0000-000000000011', 'Siddharth Roy', 'siddharth.roy@srmist.edu.in', 'Computer Science & Engineering', 1, 'Java Block 2', 4.3, 35, 1),
    ('11111111-0000-0000-0000-000000000012', 'Pooja Hegde', 'pooja.hegde@srmist.edu.in', 'Biomedical Engineering', 3, 'Adhiyaman Block', 4.8, 105, 3),
    ('11111111-0000-0000-0000-000000000013', 'Varun Deshmukh', 'varun.deshmukh@srmist.edu.in', 'Mechatronics', 4, 'Java Block 3', 4.9, 210, 6),
    ('11111111-0000-0000-0000-000000000014', 'Kavya Raman', 'kavya.raman@srmist.edu.in', 'Automobile Engineering', 2, 'MKN Block', 4.5, 70, 1),
    ('11111111-0000-0000-0000-000000000015', 'Nikhil Kumar', 'nikhil.kumar@srmist.edu.in', 'Cyber Security', 3, 'Java Block 1', 4.7, 150, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.listings (id, owner_id, type, title, description, category, tags, karma_value, status, pickup_point, expires_at)
VALUES
    ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'item', 'Casio fx-991EX ClassWiz Scientific Calculator', 'Solar powered, ideal for Engineering Maths I & II. Excellent condition.', 'Electronics & Lab Equipment', ARRAY['calculator', 'maths', 'casio'], 35, 'available', 'Java Block 3 Lobby', NOW() + INTERVAL '30 days'),
    ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'item', 'Engineering Mini Drafter + Sheet Holder Tube', 'Complete mechanical drafting kit for 1st year graphics lab. Spotless condition.', 'Electronics & Lab Equipment', ARRAY['graphics', 'drafter', 'mechanical'], 25, 'available', 'KC Block B Entrance', NOW() + INTERVAL '25 days'),
    ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003', 'item', 'ESP32 IoT Development Kit + Jumper Wires', 'Dual core Wi-Fi/Bluetooth board with breadboard & sensor modules.', 'Electronics & Lab Equipment', ARRAY['esp32', 'iot', 'hardware', 'sih'], 30, 'available', 'Adhiyaman Block Lounge', NOW() + INTERVAL '20 days'),
    ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000005', 'item', 'Cotton Lab Coat (Size L) - Chemistry & Workshop', 'Standard white lab coat, clean condition.', 'Electronics & Lab Equipment', ARRAY['labcoat', 'chemistry', 'workshop'], 15, 'available', 'Java Block 1', NOW() + INTERVAL '15 days'),
    ('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000007', 'item', 'Digital Multimeter with Test Probes', 'Accurate voltage & resistance tester for BEE lab practicals.', 'Electronics & Lab Equipment', ARRAY['multimeter', 'bee', 'circuits'], 20, 'available', 'Nelson Mandela Block', NOW() + INTERVAL '18 days'),
    ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002', 'note', 'Handwritten Operating Systems End-Sem Notes', 'Complete spiral copy covering Semaphore algorithms, Deadlocks & Paging.', 'Study Notes & Academics', ARRAY['os', 'cse', 'handwritten', 'notes'], 20, 'available', 'Central Library Bench', NOW() + INTERVAL '40 days'),
    ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000003', 'note', 'Molecular Biology & Genetics Formula Sheet', 'Concise diagrams for PCR, CRISPR mechanisms and gene mapping.', 'Study Notes & Academics', ARRAY['biotech', 'genetics', 'notes'], 15, 'available', 'Adhiyaman Block', NOW() + INTERVAL '35 days'),
    ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000009', 'note', 'Machine Learning & Neural Nets Exam Summary', 'Formulae, backpropagation derivations and PyTorch code snippets.', 'Study Notes & Academics', ARRAY['ml', 'ai', 'pytorch'], 25, 'available', 'Java Block 4', NOW() + INTERVAL '45 days'),
    ('22222222-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000010', 'note', 'Thermodynamics & Heat Transfer Solved Question Bank', 'Previous 5 year end-sem question solutions with step-by-step working.', 'Study Notes & Academics', ARRAY['thermo', 'mechanical', 'chem'], 20, 'available', 'KC Block C', NOW() + INTERVAL '30 days'),
    ('22222222-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000003', 'ticket', 'Milan 2026 EDM Pro-Nite VIP Pass', 'Extra wristband for main stage DJ pro-nite. Can meet at gate.', 'Campus Events & Cultural', ARRAY['milan', 'pass', 'pronite'], 30, 'available', 'TP Ganesan Auditorium Gate 2', NOW() + INTERVAL '5 days'),
    ('22222222-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000013', 'ticket', 'TEDxSRMIST 2026 Early Bird Entry Ticket', 'Pass for all 6 speaker keynotes and networking lunch session.', 'Campus Events & Cultural', ARRAY['tedx', 'conference', 'ticket'], 25, 'available', 'Tech Park FabLab', NOW() + INTERVAL '12 days'),
    ('22222222-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000001', 'skill', '1-on-1 React & TypeScript Architecture Mentorship', '60-min interactive session covering state management, custom hooks and clean API layering.', 'Skills & Mentorship', ARRAY['react', 'typescript', 'tutoring'], 40, 'available', 'UB 3rd Floor Co-working Area', NOW() + INTERVAL '60 days'),
    ('22222222-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000002', 'skill', 'DSP & Signals & Systems Problem Solving Session', '45-min tutoring on FFT, Z-transforms and pole-zero plots.', 'Skills & Mentorship', ARRAY['dsp', 'ece', 'tutoring'], 35, 'available', 'KC Block B Study Lounge', NOW() + INTERVAL '50 days'),
    ('22222222-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000009', 'skill', 'Python Data Processing & Pandas Crash Course', 'Learn DataFrames, vectorized operations and visualization in 60 mins.', 'Skills & Mentorship', ARRAY['python', 'pandas', 'datascience'], 30, 'available', 'Java Block 4', NOW() + INTERVAL '40 days'),
    ('22222222-0000-0000-0000-000000000016', '11111111-0000-0000-0000-000000000004', 'opportunity', 'Shortlisted SIH Hardware Team - Looking for 1 Embedded C Dev', 'Grand finale qualified team needs 1 member for ESP32 firmware development.', 'Opportunities & Gigs', ARRAY['sih', 'hackathon', 'hardware'], 15, 'available', 'Tech Park 6th Floor', NOW() + INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.needs (id, requester_id, title, description, category, tags, deadline, urgency_score, status, hostel_block)
VALUES
    ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', 'Urgently Need Casio fx-991EX for Maths III Exam Tomorrow', 'Lost my calculator in central library. Need one for 4 hours tomorrow 9 AM.', 'Electronics & Lab Equipment', ARRAY['urgent', 'calculator', 'exam'], NOW() + INTERVAL '14 hours', 7.14, 'open', 'MKN Block'),
    ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000006', 'Need Breadboard & Jumper Wires for EC102 Lab Practical', 'Lab test at 2 PM today. Will return immediately after test.', 'Electronics & Lab Equipment', ARRAY['urgent', 'breadboard', 'ece'], NOW() + INTERVAL '5 hours', 20.00, 'open', 'KC Block A'),
    ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000008', 'Looking for Handwritten Aerospace Structures Notes', 'Preparing for surprise cat test. Need unit 3 & 4 summary notes.', 'Study Notes & Academics', ARRAY['aerospace', 'notes', 'cat'], NOW() + INTERVAL '24 hours', 4.16, 'open', 'MKN Block'),
    ('33333333-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000011', 'Need White Lab Coat (Size M) for Chemistry Lab Today', 'Forgot lab coat at home. Need for 2 hours chemistry practical at 11 AM.', 'Electronics & Lab Equipment', ARRAY['labcoat', 'chemistry', 'urgent'], NOW() + INTERVAL '3 hours', 33.33, 'open', 'Java Block 2'),
    ('33333333-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000012', '1-on-1 Mock Interview Help for Campus Placement', 'Need CSE senior to review resume and conduct mock technical interview tonight.', 'Skills & Mentorship', ARRAY['interview', 'placement', 'mock'], NOW() + INTERVAL '8 hours', 12.50, 'open', 'Adhiyaman Block')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exchanges (id, listing_id, giver_id, receiver_id, karma_value, status, handoff_confirmed_giver, handoff_confirmed_receiver, created_at, completed_at)
VALUES
    ('eeeeeeee-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', 35, 'completed', true, true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
    ('eeeeeeee-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 20, 'completed', true, true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
    ('eeeeeeee-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 40, 'completed', true, true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.impact_log (id, exchange_id, money_saved_estimate, waste_diverted_kg, hours_contributed, created_at)
VALUES
    ('55555555-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', 1450, 1.2, 0.0, NOW() - INTERVAL '5 days'),
    ('55555555-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000002', 450, 0.5, 0.0, NOW() - INTERVAL '10 days'),
    ('55555555-0000-0000-0000-000000000003', 'eeeeeeee-0000-0000-0000-000000000003', 800, 0.0, 1.0, NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ratings (id, exchange_id, rater_id, ratee_id, score, tags, comment, created_at)
VALUES
    ('66666666-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', 5, ARRAY['on time', 'item as described', 'friendly'], 'Calculator worked great! Saved my exam.', NOW() - INTERVAL '5 days'),
    ('66666666-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 5, ARRAY['great notes', 'on time'], 'Super clear OS notes. Semaphore diagrams were top notch.', NOW() - INTERVAL '10 days'),
    ('66666666-0000-0000-0000-000000000003', 'eeeeeeee-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 5, ARRAY['great teacher', 'patient', 'deep tech knowledge'], 'Aarav helped debug my React project and setup TypeScript hooks cleanly.', NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;
