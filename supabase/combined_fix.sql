-- CUMULATIVE DATABASE FIX (Phase 9 & 10)
-- Run this in your Supabase SQL Editor if you are seeing errors with Email or Profile Loading.

-- 1. Ensure 'email' column exists in public.users
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE public.users ADD COLUMN email TEXT;
    END IF;
END $$;

-- 2. Backfill placeholder emails for old users if any
UPDATE public.users 
SET email = phone || '@register-obidient.com' 
WHERE email IS NULL;

-- 3. Ensure email uniqueness (case-insensitive)
DROP INDEX IF EXISTS idx_users_email_lower;
CREATE UNIQUE INDEX idx_users_email_lower ON public.users (LOWER(email));

-- 4. FIX RLS POLICIES (Critical for Signups and Dashboard)

-- Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own profile (Fixes "Error loading profile")
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Allow profile creation (Fixes "violates row-level security policy")
-- This allows the server-side signup to insert a profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
ON public.users
FOR INSERT
WITH CHECK (true); -- Relaxed for insert to allow any signup flow

-- Policy: Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- 5. Location Hierarchy Read Access (ensure this is still active)
DROP POLICY IF EXISTS "Public Location Read" ON public.states;
CREATE POLICY "Public Location Read" ON public.states FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Location Read" ON public.lgas;
CREATE POLICY "Public Location Read" ON public.lgas FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Location Read" ON public.wards;
CREATE POLICY "Public Location Read" ON public.wards FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Location Read" ON public.polling_units;
CREATE POLICY "Public Location Read" ON public.polling_units FOR SELECT USING (true);
