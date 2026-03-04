-- Phase 2 Migration Script

-- 1. Add Code Columns for Membership Number generation
ALTER TABLE public.states ADD COLUMN IF NOT EXISTS code VARCHAR(10);
ALTER TABLE public.lgas ADD COLUMN IF NOT EXISTS code VARCHAR(10);
ALTER TABLE public.wards ADD COLUMN IF NOT EXISTS code VARCHAR(10);

-- Update existing seeds with codes so they work
UPDATE public.states SET code = 'LA' WHERE id = 1;
UPDATE public.lgas SET code = 'ETI' WHERE id = 1;
UPDATE public.wards SET code = 'IK' WHERE id = 1;

-- 2. Polling Unit Sequences
CREATE TABLE IF NOT EXISTS public.pu_member_sequences (
    polling_unit_id INT PRIMARY KEY REFERENCES public.polling_units(id) ON DELETE CASCADE,
    last_value INT NOT NULL DEFAULT 0
);
ALTER TABLE public.pu_member_sequences ENABLE ROW LEVEL SECURITY;

-- 3. Role Changes Audit Table
CREATE TABLE IF NOT EXISTS public.role_changes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    promoted_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    old_role VARCHAR(50) NOT NULL,
    new_role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.role_changes ENABLE ROW LEVEL SECURITY;

-- 4. Unique Constraints for Coordinators
CREATE UNIQUE INDEX IF NOT EXISTS one_ward_coordinator ON public.users (ward_id) WHERE role = 'WARD_COORDINATOR';
CREATE UNIQUE INDEX IF NOT EXISTS one_lga_coordinator ON public.users (lga_id) WHERE role = 'LGA_COORDINATOR';
CREATE UNIQUE INDEX IF NOT EXISTS one_state_coordinator ON public.users (state_id) WHERE role = 'STATE_COORDINATOR';

-- 5. RPC Function: Verify Member with RBAC
CREATE OR REPLACE FUNCTION verify_member_fn(target_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user RECORD;
    caller RECORD;
    state_c TEXT;
    lga_c TEXT;
    ward_c TEXT;
    pu_c TEXT;
    new_seq INT;
    mem_num TEXT;
BEGIN
    SELECT * INTO caller FROM public.users WHERE id = auth.uid();
    IF NOT FOUND THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    SELECT * INTO target_user FROM public.users WHERE id = target_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
    IF target_user.verified THEN RAISE EXCEPTION 'User already verified'; END IF;

    -- RBAC Checks
    IF caller.role != 'ADMIN' THEN
        IF caller.role != 'WARD_COORDINATOR' THEN
            RAISE EXCEPTION 'Permission denied';
        END IF;
        IF caller.ward_id != target_user.ward_id THEN
            RAISE EXCEPTION 'Permission denied: Out of ward scope';
        END IF;
    END IF;
    
    SELECT code INTO state_c FROM public.states WHERE id = target_user.state_id;
    SELECT code INTO lga_c FROM public.lgas WHERE id = target_user.lga_id;
    SELECT code INTO ward_c FROM public.wards WHERE id = target_user.ward_id;
    SELECT code INTO pu_c FROM public.polling_units WHERE id = target_user.polling_unit_id;
    
    IF state_c IS NULL OR lga_c IS NULL OR ward_c IS NULL OR pu_c IS NULL THEN
        RAISE EXCEPTION 'Location codes missing. Cannot generate membership number.';
    END IF;

    -- Lock and increment sequence
    INSERT INTO public.pu_member_sequences (polling_unit_id, last_value)
    VALUES (target_user.polling_unit_id, 1)
    ON CONFLICT (polling_unit_id)
    DO UPDATE SET last_value = public.pu_member_sequences.last_value + 1
    RETURNING last_value INTO new_seq;
    
    mem_num := state_c || '-' || lga_c || '-' || ward_c || '-' || pu_c || '-' || LPAD(new_seq::TEXT, 4, '0');
    
    UPDATE public.users 
    SET verified = true, membership_number = mem_num
    WHERE id = target_user_id;
    
    RETURN mem_num;
END;
$$;

-- 6. RPC Function: Promote Member with RBAC
CREATE OR REPLACE FUNCTION promote_member_fn(target_user_id UUID, new_role VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user RECORD;
    caller RECORD;
BEGIN
    SELECT * INTO caller FROM public.users WHERE id = auth.uid();
    IF NOT FOUND THEN RAISE EXCEPTION 'Unauthorized'; END IF;
    IF caller.role != 'ADMIN' THEN RAISE EXCEPTION 'Permission denied: only ADMIN can promote'; END IF;

    SELECT * INTO target_user FROM public.users WHERE id = target_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
    IF NOT target_user.verified THEN RAISE EXCEPTION 'User not verified. Cannot promote.'; END IF;
    
    UPDATE public.users SET role = new_role WHERE id = target_user_id;
    
    INSERT INTO public.role_changes (user_id, promoted_by, old_role, new_role)
    VALUES (target_user_id, caller.id, target_user.role, new_role);
    
    RETURN TRUE;
END;
$$;
