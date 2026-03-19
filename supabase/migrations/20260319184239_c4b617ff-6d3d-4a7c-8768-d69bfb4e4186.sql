
CREATE TABLE public.student_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  staff_user_id UUID NOT NULL,
  personal_note TEXT,
  behavior TEXT,
  independent_work TEXT,
  group_work TEXT,
  emotional_regulation TEXT,
  general_functioning TEXT,
  helping_others TEXT,
  environmental_care TEXT,
  duties_performance TEXT,
  studentship TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view student_evaluations" ON public.student_evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert student_evaluations" ON public.student_evaluations FOR INSERT TO authenticated WITH CHECK (auth.uid() = staff_user_id);
CREATE POLICY "Staff can update own student_evaluations" ON public.student_evaluations FOR UPDATE TO authenticated USING (auth.uid() = staff_user_id);
CREATE POLICY "Admins can delete student_evaluations" ON public.student_evaluations FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
