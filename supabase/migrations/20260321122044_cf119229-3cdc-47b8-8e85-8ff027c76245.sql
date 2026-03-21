
-- Activity logs table for tracking emotional check-ins and skill usage
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  selected_state TEXT NOT NULL,
  intensity_score INTEGER,
  intensity_label TEXT,
  skill_used TEXT,
  skill_helpful BOOLEAN,
  result_after_practice TEXT,
  support_requested BOOLEAN NOT NULL DEFAULT false,
  adult_contact_name TEXT,
  adult_contact_category TEXT,
  optional_context_text TEXT,
  is_positive_reflection BOOLEAN,
  positive_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily reflections table for student self-ratings
CREATE TABLE public.daily_reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT,
  student_name TEXT NOT NULL DEFAULT 'אנונימי',
  academic_tasks INTEGER NOT NULL,
  class_presence INTEGER NOT NULL,
  behavior INTEGER NOT NULL,
  social_interaction INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity_logs - authenticated users can insert and view
CREATE POLICY "Authenticated can insert activity_logs" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff and admin can view activity_logs" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view own activity_logs" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Students can insert activity_logs" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'student'::app_role));

-- RLS policies for daily_reflections
CREATE POLICY "Authenticated can insert daily_reflections" ON public.daily_reflections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff and admin can view daily_reflections" ON public.daily_reflections
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view own daily_reflections" ON public.daily_reflections
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'student'::app_role));

-- Enable realtime for activity_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
