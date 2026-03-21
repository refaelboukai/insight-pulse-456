CREATE TABLE public.schedule_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  day text NOT NULL,
  hour text NOT NULL,
  is_checked boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, checkin_date, day, hour)
);

ALTER TABLE public.schedule_checkins ENABLE ROW LEVEL SECURITY;

-- Students can view and manage their own checkins
CREATE POLICY "Students can view own checkins" ON public.schedule_checkins
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Students can insert own checkins" ON public.schedule_checkins
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Students can update own checkins" ON public.schedule_checkins
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Students can delete own checkins" ON public.schedule_checkins
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'student'::app_role));

-- Staff and admin can view all checkins
CREATE POLICY "Staff and admin can view checkins" ON public.schedule_checkins
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));