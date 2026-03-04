-- Phase 9: Unified Email and Phone Authentication Migration

-- 1. Add email column (allow NULL initially for backfill)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;

-- 2. Backfill existing users with their dummy emails if real ones are missing
-- Dummy email format was: [phone]@register-obidient.com
UPDATE public.users 
SET email = phone || '@register-obidient.com'
WHERE email IS NULL;

-- 3. Enforce NOT NULL on email
ALTER TABLE public.users ALTER COLUMN email SET NOT NULL;

-- 4. Create case-insensitive unique index for email
-- Using LOWER() to ensure uniqueness regardless of casing
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON public.users (LOWER(email));

-- 5. Ensure unique index on phone
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'users_phone_idx') THEN
        CREATE UNIQUE INDEX users_phone_idx ON public.users (phone);
    END IF;
END $$;

-- 6. Add comment for clarity
COMMENT ON COLUMN public.users.email IS 'Primary email for unified login and password reset.';
