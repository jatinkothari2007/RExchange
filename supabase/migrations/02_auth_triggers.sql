-- ====================================================================
-- RExchange Supabase Migration 02: Auth Domain Validation & User Sync
-- ====================================================================

-- Function 1: Validate college email domain before auth registration
CREATE OR REPLACE FUNCTION public.validate_college_email_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_allowed_domain TEXT;
    v_user_domain TEXT;
BEGIN
    -- Fetch target domain from public.college_config (Defaults to srmist.edu.in)
    SELECT value INTO v_allowed_domain
    FROM public.college_config
    WHERE key = 'allowed_domain';

    IF v_allowed_domain IS NULL THEN
        v_allowed_domain := 'srmist.edu.in';
    END IF;

    -- Extract domain from new user email
    v_user_domain := LOWER(SPLIT_PART(NEW.email, '@', 2));

    -- Reject signup if email domain doesn't match configured institutional domain
    IF v_user_domain <> LOWER(v_allowed_domain) THEN
        RAISE EXCEPTION 'Unauthorized signup: Email domain "@%" is not allowed. Registration is restricted to institutional "@%" domain.',
            v_user_domain, v_allowed_domain;
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger 1: Attach domain validator to auth.users before insert
DROP TRIGGER IF EXISTS trg_validate_college_email ON auth.users;
CREATE TRIGGER trg_validate_college_email
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_college_email_domain();


-- Function 2: Sync auth.users to public.users & grant 20 Karma welcome seed
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
    -- Extract user metadata passed from auth signup
    v_name := COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1));
    v_department := COALESCE(NEW.raw_user_meta_data->>'department', 'Computer Science & Engineering');
    v_year := COALESCE((NEW.raw_user_meta_data->>'year')::INT, 2);
    v_hostel := COALESCE(NEW.raw_user_meta_data->>'hostel_block', 'Java Block 3');

    -- Insert into public.users with initial 20 Karma balance
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
        20, -- Task 2 requirement: 20 starting Karma balance
        5.0
    )
    ON CONFLICT (email) DO UPDATE SET auth_id = EXCLUDED.auth_id;

    -- Create welcome notification for user
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

-- Trigger 2: Sync to public.users after auth.users creation
DROP TRIGGER IF EXISTS trg_handle_new_user_sync ON auth.users;
CREATE TRIGGER trg_handle_new_user_sync
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_sync();
