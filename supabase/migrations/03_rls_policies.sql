-- ====================================================================
-- RExchange Supabase Migration 03: Row Level Security (RLS) Policies
-- ====================================================================

-- Helper function to get public.users.id from auth.uid()
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- 1. USERS TABLE RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view student profiles on campus
CREATE POLICY "Public profiles are readable by authenticated users"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- User can update only their own profile row
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth_id);


-- 2. LISTINGS TABLE RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Authenticated students can read all available/active campus listings
CREATE POLICY "Listings are readable by campus students"
ON public.listings FOR SELECT
TO authenticated
USING (true);

-- Owner can insert own listing
CREATE POLICY "Users can insert own listings"
ON public.listings FOR INSERT
TO authenticated
WITH CHECK (owner_id = public.get_current_user_id());

-- Owner can update own listing
CREATE POLICY "Users can update own listings"
ON public.listings FOR UPDATE
TO authenticated
USING (owner_id = public.get_current_user_id())
WITH CHECK (owner_id = public.get_current_user_id());

-- Owner can delete own listing
CREATE POLICY "Users can delete own listings"
ON public.listings FOR DELETE
TO authenticated
USING (owner_id = public.get_current_user_id());


-- 3. NEEDS TABLE RLS
ALTER TABLE public.needs ENABLE ROW LEVEL SECURITY;

-- Read policy for open needs board
CREATE POLICY "Needs board readable by campus students"
ON public.needs FOR SELECT
TO authenticated
USING (true);

-- Requester can insert need
CREATE POLICY "Users can insert own urgent needs"
ON public.needs FOR INSERT
TO authenticated
WITH CHECK (requester_id = public.get_current_user_id());

-- Requester can update own need
CREATE POLICY "Users can update own urgent needs"
ON public.needs FOR UPDATE
TO authenticated
USING (requester_id = public.get_current_user_id())
WITH CHECK (requester_id = public.get_current_user_id());

-- Requester can delete own need
CREATE POLICY "Users can delete own urgent needs"
ON public.needs FOR DELETE
TO authenticated
USING (requester_id = public.get_current_user_id());


-- 4. EXCHANGES TABLE RLS
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;

-- Only giver or receiver can read exchange contract
CREATE POLICY "Participants can view own exchange"
ON public.exchanges FOR SELECT
TO authenticated
USING (
    giver_id = public.get_current_user_id() OR
    receiver_id = public.get_current_user_id()
);

-- Requester (receiver) can insert exchange request
CREATE POLICY "Users can initiate exchange request"
ON public.exchanges FOR INSERT
TO authenticated
WITH CHECK (receiver_id = public.get_current_user_id());

-- Only giver or receiver can update exchange status / flags
CREATE POLICY "Participants can update own exchange"
ON public.exchanges FOR UPDATE
TO authenticated
USING (
    giver_id = public.get_current_user_id() OR
    receiver_id = public.get_current_user_id()
);


-- 5. MESSAGES TABLE RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Only participants of parent exchange can read messages
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

-- Only participants can post messages to thread
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


-- 6. KARMA TRANSACTIONS TABLE RLS
ALTER TABLE public.karma_transactions ENABLE ROW LEVEL SECURITY;

-- User can read only their own transaction ledger
CREATE POLICY "Users can read own transaction audit trail"
ON public.karma_transactions FOR SELECT
TO authenticated
USING (user_id = public.get_current_user_id());

-- Inserts ONLY allowed via SECURITY DEFINER functions (No direct client insert)
-- No INSERT policy defined for authenticated users!


-- 7. RATINGS TABLE RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view reputation ratings
CREATE POLICY "Ratings are readable by authenticated users"
ON public.ratings FOR SELECT
TO authenticated
USING (true);

-- Insert restricted to participant of COMPLETED exchange
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


-- 8. NOTIFICATIONS TABLE RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- User can read only their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = public.get_current_user_id());

-- User can update (mark as read) only their own notifications
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = public.get_current_user_id())
WITH CHECK (user_id = public.get_current_user_id());


-- 9. IMPACT LOG TABLE RLS
ALTER TABLE public.impact_log ENABLE ROW LEVEL SECURITY;

-- Campus aggregate impact log readable by all authenticated users
CREATE POLICY "Impact stats readable by campus users"
ON public.impact_log FOR SELECT
TO authenticated
USING (true);
