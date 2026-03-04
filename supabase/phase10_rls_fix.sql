-- Phase 10: RLS Fix for Signup Profile Creation

-- The error "new row violates row-level security policy for table users" 
-- happens because when a user signs up, they might not be fully authenticated 
-- if email confirmation is required, or the 'authenticated' role isn't yet 
-- active during the immediate insert.

-- We explicitly allow users to insert their own profile record.
-- If auth.uid() is available (which it should be immediately after signUp), 
-- we allow the insert if the ID matches.

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
ON public.users
FOR INSERT
WITH CHECK (
    auth.uid() = id
);

-- Ensure the 'anon' role can't insert, only newly 'created' auth users.
-- Supabase handles this by auth.uid() returning the ID of the user just created.

-- Also ensure 'authenticated' users can update their own profile (standard)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- Ensure everyone can still see profiles (or restrict to authenticated if preferred)
-- Current policy seems to be "Public Profiles are viewable by everyone" or similar.
