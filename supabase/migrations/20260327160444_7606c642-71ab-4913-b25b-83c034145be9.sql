
-- Add parent visibility toggles to students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_show_reports boolean NOT NULL DEFAULT true;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_show_calendar boolean NOT NULL DEFAULT true;

-- Update trigger for parent@school.local
CREATE OR REPLACE FUNCTION public.auto_assign_role_by_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email = 'admin@school.local' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NEW.email = 'staff@school.local' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff') ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NEW.email = 'student@school.local' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NEW.email = 'parent@school.local' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'parent') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- RLS: Parents can SELECT lesson_reports
CREATE POLICY "Parents can view lesson_reports"
ON public.lesson_reports FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'parent'::app_role));

-- RLS: Parents can SELECT exam_schedule
CREATE POLICY "Parents can view exam_schedule"
ON public.exam_schedule FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'parent'::app_role));

-- RLS: Parents can SELECT calendar_events
CREATE POLICY "Parents can view calendar_events"
ON public.calendar_events FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'parent'::app_role));

-- RLS: Parents can SELECT students
CREATE POLICY "Parents can view students"
ON public.students FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'parent'::app_role));

-- RLS: Parents can SELECT managed_subjects
CREATE POLICY "Parents can view managed_subjects"
ON public.managed_subjects FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'parent'::app_role));
