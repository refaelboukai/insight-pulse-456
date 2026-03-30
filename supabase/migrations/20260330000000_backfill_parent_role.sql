-- Backfill: ensure parent@school.local has 'parent' role in user_roles
-- This is needed for accounts created before the trigger was updated to handle parent
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'parent'::app_role FROM auth.users WHERE email = 'parent@school.local'
ON CONFLICT (user_id, role) DO NOTHING;

-- Backfill: also ensure all shared accounts have their correct roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'admin@school.local'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'staff'::app_role FROM auth.users WHERE email = 'staff@school.local'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'student'::app_role FROM auth.users WHERE email = 'student@school.local'
ON CONFLICT (user_id, role) DO NOTHING;

-- Allow parent self-role assignment (needed for signInOrCreateShared)
DROP POLICY IF EXISTS "Users can only self-assign student role" ON public.user_roles;
CREATE POLICY "Users can self-assign shared account roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() AND (
    (role = 'student'::app_role AND auth.email() = 'student@school.local') OR
    (role = 'parent'::app_role AND auth.email() = 'parent@school.local')
  )
);
