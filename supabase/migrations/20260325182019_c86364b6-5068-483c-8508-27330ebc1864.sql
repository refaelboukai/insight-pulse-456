CREATE TABLE public.student_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert their own insights"
ON public.student_insights FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Students can read their own insights"
ON public.student_insights FOR SELECT TO authenticated
USING (true);