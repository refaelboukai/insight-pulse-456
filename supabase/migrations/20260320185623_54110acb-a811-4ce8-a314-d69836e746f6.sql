
-- Lock down user_roles: no DELETE allowed (already no policy), add explicit denial
-- The INSERT policy already restricts to student-only self-assignment
-- Ensure no UPDATE is possible on user_roles
-- (There's already no UPDATE policy, but let's be explicit)

-- Add admin-only DELETE policy for user_roles management
CREATE POLICY "Only admins can delete user_roles"
ON public.user_roles FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin-only UPDATE policy for user_roles management  
CREATE POLICY "Only admins can update user_roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
