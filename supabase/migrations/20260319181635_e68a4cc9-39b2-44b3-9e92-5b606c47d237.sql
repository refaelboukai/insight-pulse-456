
CREATE TABLE public.student_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  staff_user_id uuid NOT NULL,
  subject text NOT NULL,
  grade integer CHECK (grade >= 0 AND grade <= 100),
  verbal_evaluation text,
  ai_enhanced_evaluation text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view student_grades"
ON public.student_grades FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Staff can insert student_grades"
ON public.student_grades FOR INSERT TO authenticated
WITH CHECK (auth.uid() = staff_user_id);

CREATE POLICY "Staff can update own student_grades"
ON public.student_grades FOR UPDATE TO authenticated
USING (auth.uid() = staff_user_id);

CREATE POLICY "Admins can delete student_grades"
ON public.student_grades FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_student_grades_updated_at
  BEFORE UPDATE ON public.student_grades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
