
-- Student personal schedules table
CREATE TABLE public.student_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  schedule_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE public.student_schedules ENABLE ROW LEVEL SECURITY;

-- Admin can manage
CREATE POLICY "Admins can manage student_schedules" ON public.student_schedules
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Staff can view
CREATE POLICY "Staff can view student_schedules" ON public.student_schedules
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'staff'::app_role));

-- Students can view own enabled schedule
CREATE POLICY "Students can view own enabled schedule" ON public.student_schedules
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'student'::app_role) AND is_enabled = true);

-- Update trigger
CREATE TRIGGER update_student_schedules_updated_at
  BEFORE UPDATE ON public.student_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
