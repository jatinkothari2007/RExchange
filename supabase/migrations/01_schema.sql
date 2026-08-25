-- ====================================================================
-- RExchange Supabase Migration 01: Table Schemas & Custom Types
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
