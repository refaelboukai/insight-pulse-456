
-- Create a trigger function to auto-assign roles based on email
CREATE OR REPLACE FUNCTION public.auto_assign_role_by_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email = 'admin@school.local' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NEW.email = 'staff@school.local' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'staff')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NEW.email = 'student@school.local' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users on insert
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_role_by_email();

-- Backfill: ensure existing users have their roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'admin@school.local'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'staff'::app_role FROM auth.users WHERE email = 'staff@school.local'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'student'::app_role FROM auth.users WHERE email = 'student@school.local'
ON CONFLICT (user_id, role) DO NOTHING;
