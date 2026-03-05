-- Phase 14: Member Verification Resiliency Fix
-- Problem: Many locations are missing codes, which blocks membership number generation.
-- Solution: Provide a fallback using substrings of names or IDs.

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
    -- 1. Get Caller
    SELECT * INTO caller FROM public.users WHERE id = auth.uid();
    IF NOT FOUND THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    -- 2. Get Target User
    SELECT * INTO target_user FROM public.users WHERE id = target_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
    IF target_user.verified THEN RAISE EXCEPTION 'User already verified'; END IF;

    -- 3. RBAC Checks (Admin or Ward Coordinator of same ward)
    IF caller.role != 'ADMIN' THEN
        IF caller.role != 'WARD_COORDINATOR' THEN
            RAISE EXCEPTION 'Permission denied';
        END IF;
        IF caller.ward_id != target_user.ward_id THEN
            RAISE EXCEPTION 'Permission denied: Out of ward scope';
        END IF;
    END IF;
    
    -- 4. Fetch Codes with fallback logic
    -- We use COALESCE and simple name-based generation if 'code' is NULL or empty
    
    SELECT COALESCE(NULLIF(code, ''), UPPER(LEFT(REPLACE(name, ' ', ''), 3))) 
    INTO state_c FROM public.states WHERE id = target_user.state_id;
    
    SELECT COALESCE(NULLIF(code, ''), UPPER(LEFT(REPLACE(name, ' ', ''), 3))) 
    INTO lga_c FROM public.lgas WHERE id = target_user.lga_id;
    
    SELECT COALESCE(NULLIF(code, ''), UPPER(LEFT(REPLACE(name, ' ', ''), 3))) 
    INTO ward_c FROM public.wards WHERE id = target_user.ward_id;
    
    -- For Polling Units, we use the ID as a safe numerical identifier if code is missing
    SELECT COALESCE(NULLIF(code, ''), LPAD(id::TEXT, 3, '0')) 
    INTO pu_c FROM public.polling_units WHERE id = target_user.polling_unit_id;
    
    -- If any are STILL NULL (meaning location record itself is missing), then we raise error
    IF state_c IS NULL OR lga_c IS NULL OR ward_c IS NULL OR pu_c IS NULL THEN
        RAISE EXCEPTION 'Location data incomplete for this user. Cannot generate membership number.';
    END IF;

    -- 5. Lock and increment sequence
    INSERT INTO public.pu_member_sequences (polling_unit_id, last_value)
    VALUES (target_user.polling_unit_id, 1)
    ON CONFLICT (polling_unit_id)
    DO UPDATE SET last_value = public.pu_member_sequences.last_value + 1
    RETURNING last_value INTO new_seq;
    
    -- 6. Construct Membership Number
    mem_num := state_c || '-' || lga_c || '-' || ward_c || '-' || pu_c || '-' || LPAD(new_seq::TEXT, 4, '0');
    
    -- 7. Update User
    UPDATE public.users 
    SET verified = true, membership_number = mem_num
    WHERE id = target_user_id;
    
    RETURN mem_num;
END;
$$;
