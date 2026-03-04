-- Phase 8: Voter Intelligence & Onboarding Extension

-- 1. Update Users Table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_registered_voter BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS registered_polling_unit_id INT REFERENCES public.polling_units(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS intended_polling_unit_id INT REFERENCES public.polling_units(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS needs_registration_help BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS is_under_18 BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS age INT;

-- 2. Add Constraints
-- Ensure only one of registered_polling_unit_id or intended_polling_unit_id is populated
ALTER TABLE public.users
ADD CONSTRAINT chk_polling_unit_exclusivity 
CHECK (
    (registered_polling_unit_id IS NULL OR intended_polling_unit_id IS NULL)
);

-- Ensure under 18s cannot have polling units populated
ALTER TABLE public.users
ADD CONSTRAINT chk_under_18_no_polling_unit
CHECK (
    (is_under_18 = false) OR (registered_polling_unit_id IS NULL AND intended_polling_unit_id IS NULL)
);

-- 3. Update RLS (Ensure admins can see all, but members see limited info)
-- Existing policies allow users to see their own profile.
-- We need to ensure that the new Admin page can query these fields.
-- The existing Public Location Read allows SELECT on hierarchy tables.
-- The existing Users policies allow users to view own profile.

-- No specific changes needed for RLS if current policies are broad enough for admins.
-- Actually, let's explicitely add admin read access if needed, 
-- but usually admins have separate service role access or we add a policy.

-- Add index for the new admin page filters
CREATE INDEX IF NOT EXISTS idx_users_voter_status ON public.users(is_registered_voter, age) WHERE is_under_18 = false;
CREATE INDEX IF NOT EXISTS idx_users_help_needed ON public.users(needs_registration_help) WHERE needs_registration_help = true;
CREATE INDEX IF NOT EXISTS idx_users_under_18 ON public.users(is_under_18) WHERE is_under_18 = true;
