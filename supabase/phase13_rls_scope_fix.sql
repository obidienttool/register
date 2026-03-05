-- Phase 13: RLS Visibility Fix for Admin Dashboard

-- 1. Helper function to check admin status without recursion
-- Using SECURITY DEFINER so that the function runs with the privileges of the creator
-- this allows us to check roles without triggering the users select policy again.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$;

-- 2. Helper function to check regional coordinator scope
CREATE OR REPLACE FUNCTION public.get_user_role_and_scope()
RETURNS TABLE (role VARCHAR, state_id INT, lga_id INT, ward_id INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT u.role, u.state_id, u.lga_id, u.ward_id 
  FROM public.users u 
  WHERE u.id = auth.uid();
END;
$$;

-- 3. DROP old select policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- 4. CREATE new comprehensive select policy
CREATE POLICY "Member visibility for admins and coordinators"
ON public.users
FOR SELECT
USING (
  -- 1. Everyone can see their own profile
  (auth.uid() = id)
  OR
  -- 2. Admin can see everyone
  (public.check_is_admin())
  OR
  -- 3. Regional Coordinators see their scope
  EXISTS (
    SELECT 1 FROM (SELECT * FROM public.get_user_role_and_scope()) s
    WHERE 
      (s.role = 'WARD_COORDINATOR' AND users.ward_id = s.ward_id)
      OR
      (s.role = 'LGA_COORDINATOR' AND users.lga_id = s.lga_id)
      OR
      (s.role = 'STATE_COORDINATOR' AND users.state_id = s.state_id)
  )
);

-- Note: Polling Unit Team Members table already has a broad "Public team read" policy.
-- If you need to restrict that as well, you can use similar logic there.
