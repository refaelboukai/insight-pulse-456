CREATE TABLE public.weekly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  staff_user_id uuid NOT NULL,
  week_start date NOT NULL,
  summary_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, week_start)
);

ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and admin can view weekly_summaries" ON public.weekly_summaries
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can insert weekly_summaries" ON public.weekly_summaries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = staff_user_id);

CREATE POLICY "Staff can update own weekly_summaries" ON public.weekly_summaries
  FOR UPDATE TO authenticated
  USING (auth.uid() = staff_user_id);

CREATE POLICY "Admins can delete weekly_summaries" ON public.weekly_summaries
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view own weekly_summaries" ON public.weekly_summaries
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Parents can view weekly_summaries" ON public.weekly_summaries
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'parent'::app_role));

CREATE TRIGGER update_weekly_summaries_updated_at
  BEFORE UPDATE ON public.weekly_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();