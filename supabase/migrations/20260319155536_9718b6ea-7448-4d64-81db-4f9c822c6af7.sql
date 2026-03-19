
CREATE TYPE public.absence_reason AS ENUM (
  'illness',
  'vacation',
  'family_arrangements',
  'medical_checkup',
  'emotional_difficulty',
  'school_suspension',
  'other'
);

CREATE TABLE public.daily_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  is_present boolean NOT NULL DEFAULT true,
  absence_reason absence_reason NULL,
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, attendance_date)
);

ALTER TABLE public.daily_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read daily_attendance"
  ON public.daily_attendance FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert daily_attendance"
  ON public.daily_attendance FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update daily_attendance"
  ON public.daily_attendance FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
