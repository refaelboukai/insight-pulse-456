
CREATE TABLE public.student_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_area text NOT NULL CHECK (subject_area IN ('math', 'hebrew', 'english')),
  has_mapping boolean NOT NULL DEFAULT false,
  grade_level text,
  updated_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject_area)
);

ALTER TABLE public.student_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and admin can view student_mappings" ON public.student_mappings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can insert student_mappings" ON public.student_mappings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Staff can update student_mappings" ON public.student_mappings
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete student_mappings" ON public.student_mappings
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_student_mappings_updated_at
  BEFORE UPDATE ON public.student_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
