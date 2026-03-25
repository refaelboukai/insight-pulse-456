
-- Table for managed subjects (admin can add/remove)
CREATE TABLE public.managed_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  has_sub_subjects boolean NOT NULL DEFAULT false,
  sub_subjects text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.managed_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and admin can view managed_subjects" ON public.managed_subjects
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'student')
  );

CREATE POLICY "Admins can manage managed_subjects" ON public.managed_subjects
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed with existing subjects
INSERT INTO public.managed_subjects (name, has_sub_subjects, sub_subjects) VALUES
  ('מתמטיקה', true, ARRAY['אלגברה', 'גיאומטריה']),
  ('עברית', false, '{}'),
  ('אנגלית', false, '{}'),
  ('מדעים', false, '{}'),
  ('היסטוריה', false, '{}'),
  ('גיאוגרפיה', false, '{}'),
  ('חינוך גופני', false, '{}'),
  ('אמנות', false, '{}'),
  ('מוזיקה', false, '{}'),
  ('תנ"ך', false, '{}'),
  ('ספרות', false, '{}'),
  ('פסיכולוגיה', false, '{}'),
  ('כישורי חיים', false, '{}');

-- Table for pedagogical goals per student per subject
CREATE TABLE public.pedagogical_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.managed_subjects(id) ON DELETE CASCADE,
  sub_subject text,
  month text NOT NULL,
  learning_style text,
  current_status text,
  learning_goals text,
  measurement_methods text,
  what_was_done text,
  what_was_not_done text,
  teacher_notes text,
  admin_notes text,
  staff_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject_id, sub_subject, month)
);

ALTER TABLE public.pedagogical_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and admin can view pedagogical_goals" ON public.pedagogical_goals
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Students can view own pedagogical_goals" ON public.pedagogical_goals
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'student'));

CREATE POLICY "Staff can insert pedagogical_goals" ON public.pedagogical_goals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = staff_user_id);

CREATE POLICY "Staff can update own pedagogical_goals" ON public.pedagogical_goals
  FOR UPDATE TO authenticated USING (auth.uid() = staff_user_id);

CREATE POLICY "Admins can manage pedagogical_goals" ON public.pedagogical_goals
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Table for exam schedule
CREATE TABLE public.exam_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.managed_subjects(id) ON DELETE CASCADE,
  sub_subject text,
  exam_date date NOT NULL,
  exam_description text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and admin can view exam_schedule" ON public.exam_schedule
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Students can view own exam_schedule" ON public.exam_schedule
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'student'));

CREATE POLICY "Staff can insert exam_schedule" ON public.exam_schedule
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Staff can update own exam_schedule" ON public.exam_schedule
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage exam_schedule" ON public.exam_schedule
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can delete own exam_schedule" ON public.exam_schedule
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Trigger for updated_at on pedagogical_goals
CREATE TRIGGER update_pedagogical_goals_updated_at
  BEFORE UPDATE ON public.pedagogical_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
