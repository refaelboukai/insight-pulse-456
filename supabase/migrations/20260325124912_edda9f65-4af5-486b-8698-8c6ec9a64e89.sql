
CREATE TABLE public.learning_style_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}',
  results JSONB NOT NULL DEFAULT '{}',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE public.learning_style_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own learning_style_profiles"
ON public.learning_style_profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Students can insert own learning_style_profiles"
ON public.learning_style_profiles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Students can update own learning_style_profiles"
ON public.learning_style_profiles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Staff and admin can view learning_style_profiles"
ON public.learning_style_profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update learning_style_profiles"
ON public.learning_style_profiles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete learning_style_profiles"
ON public.learning_style_profiles FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
