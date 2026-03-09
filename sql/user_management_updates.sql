-- Add is_disabled column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.users.is_disabled IS 'Determines if the user is suspended from the platform';

-- Ensure only Admins can update this field via RLS
-- (Existing policies might need adjustment if they are too broad)
-- Assuming common pattern: Admins have full access to public.users or specific RPCs.
