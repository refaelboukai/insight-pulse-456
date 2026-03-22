
-- Add new absence_reason enum values
ALTER TYPE public.absence_reason ADD VALUE IF NOT EXISTS 'home_learning';
ALTER TYPE public.absence_reason ADD VALUE IF NOT EXISTS 'hospitalization';
ALTER TYPE public.absence_reason ADD VALUE IF NOT EXISTS 'balance_home';
ALTER TYPE public.absence_reason ADD VALUE IF NOT EXISTS 'medical_suspension';

-- Add other_reason_text column for free text when "other" is selected
ALTER TABLE public.daily_attendance ADD COLUMN IF NOT EXISTS other_reason_text text;

-- Create table to track follow-up actions for long-absent students
CREATE TABLE public.absent_student_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  phone_contact boolean NOT NULL DEFAULT false,
  home_visit boolean NOT NULL DEFAULT false,
  materials_sent boolean NOT NULL DEFAULT false,
  notes text,
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, week_start)
);

ALTER TABLE public.absent_student_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and admin can view followups" ON public.absent_student_followups
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can insert followups" ON public.absent_student_followups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can update followups" ON public.absent_student_followups
  FOR UPDATE TO authenticated
  USING (recorded_by = auth.uid());

CREATE POLICY "Admins can manage followups" ON public.absent_student_followups
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
