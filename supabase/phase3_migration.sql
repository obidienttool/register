-- Phase 3 Migration Script

-- 1. Create Polling Unit Team Members table
CREATE TABLE IF NOT EXISTS public.pu_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    polling_unit_id INT NOT NULL REFERENCES public.polling_units(id) ON DELETE CASCADE,
    role_title VARCHAR(100) NOT NULL,
    assigned_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT one_team_per_user UNIQUE (user_id) -- A user cannot be on more than one PU team
);
ALTER TABLE public.pu_team_members ENABLE ROW LEVEL SECURITY;

-- 2. Create Audit Logs table for Team Assignments
CREATE TABLE IF NOT EXISTS public.pu_team_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    polling_unit_id INT NOT NULL REFERENCES public.polling_units(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('assigned', 'removed')),
    role_title VARCHAR(100),
    performed_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.pu_team_logs ENABLE ROW LEVEL SECURITY;

-- Allow reading PU teams for dashboard / public view
CREATE POLICY "Public team read" ON public.pu_team_members FOR SELECT USING (true);
CREATE POLICY "Admin/Coordinator team log read" ON public.pu_team_logs FOR SELECT USING (true);

-- 3. RPC Function: Assign Team Member
-- This function natively enforces RBAC, verified requirement, and the max 5 limit
CREATE OR REPLACE FUNCTION assign_pu_team_member(target_user_id UUID, target_pu_id INT, target_role_title VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user RECORD;
    caller RECORD;
    target_pu RECORD;
    current_team_count INT;
BEGIN
    -- Get caller
    SELECT * INTO caller FROM public.users WHERE id = auth.uid();
    IF NOT FOUND THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    -- Get target user
    SELECT * INTO target_user FROM public.users WHERE id = target_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;

    -- Enforce verified only
    IF NOT target_user.verified THEN 
        RAISE EXCEPTION 'Only verified members can be assigned to a team'; 
    END IF;

    -- Enforce user belongs to the polling unit
    IF target_user.polling_unit_id != target_pu_id THEN
        RAISE EXCEPTION 'User does not belong to this polling unit';
    END IF;

    -- Get target PU to check ward
    SELECT * INTO target_pu FROM public.polling_units WHERE id = target_pu_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Polling unit not found'; END IF;

    -- RBAC Checks
    IF caller.role != 'ADMIN' THEN
        IF caller.role != 'WARD_COORDINATOR' THEN
            RAISE EXCEPTION 'Permission denied: must be Admin or Ward Coordinator';
        END IF;
        IF caller.ward_id != target_pu.ward_id THEN
            RAISE EXCEPTION 'Permission denied: Out of ward scope';
        END IF;
    END IF;

    -- Check Max 5 limit
    SELECT COUNT(*) INTO current_team_count FROM public.pu_team_members WHERE polling_unit_id = target_pu_id;
    IF current_team_count >= 5 THEN
        RAISE EXCEPTION 'Team limit reached (max 5 members per polling unit)';
    END IF;

    -- Insert Team Member
    -- The unique constraint "one_team_per_user" will handle overlaps automatically
    INSERT INTO public.pu_team_members (user_id, polling_unit_id, role_title, assigned_by)
    VALUES (target_user_id, target_pu_id, target_role_title, caller.id);

    -- Log to audit table
    INSERT INTO public.pu_team_logs (polling_unit_id, user_id, action, role_title, performed_by)
    VALUES (target_pu_id, target_user_id, 'assigned', target_role_title, caller.id);

    RETURN TRUE;
END;
$$;

-- 4. RPC Function: Remove Team Member
CREATE OR REPLACE FUNCTION remove_pu_team_member(target_user_id UUID, target_pu_id INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller RECORD;
    target_pu RECORD;
    deleted_member RECORD;
BEGIN
    SELECT * INTO caller FROM public.users WHERE id = auth.uid();
    IF NOT FOUND THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    SELECT * INTO target_pu FROM public.polling_units WHERE id = target_pu_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Polling unit not found'; END IF;

    -- RBAC Checks
    IF caller.role != 'ADMIN' THEN
        IF caller.role != 'WARD_COORDINATOR' THEN
            RAISE EXCEPTION 'Permission denied: must be Admin or Ward Coordinator';
        END IF;
        IF caller.ward_id != target_pu.ward_id THEN
            RAISE EXCEPTION 'Permission denied: Out of ward scope';
        END IF;
    END IF;

    -- Delete and get role
    DELETE FROM public.pu_team_members 
    WHERE user_id = target_user_id AND polling_unit_id = target_pu_id
    RETURNING * INTO deleted_member;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Team member not found in this polling unit';
    END IF;

    -- Log removal
    INSERT INTO public.pu_team_logs (polling_unit_id, user_id, action, role_title, performed_by)
    VALUES (target_pu_id, target_user_id, 'removed', deleted_member.role_title, caller.id);

    RETURN TRUE;
END;
$$;
