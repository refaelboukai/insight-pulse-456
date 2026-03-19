
CREATE TYPE public.support_type AS ENUM ('social', 'emotional', 'academic', 'behavioral');

CREATE TABLE public.support_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  staff_user_id uuid NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  provider_name text NOT NULL,
  support_types support_type[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view support_sessions" ON public.support_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert support_sessions" ON public.support_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = staff_user_id);
