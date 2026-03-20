
-- Add 'student' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';

-- Staff members table
CREATE TABLE public.staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view staff_members" ON public.staff_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage staff_members" ON public.staff_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Support assignments table (admin assigns staff to students)
CREATE TABLE public.support_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  staff_member_id uuid NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  support_types support_type[] NOT NULL DEFAULT '{}',
  frequency text NOT NULL DEFAULT 'weekly',
  target_date date,
  notes_for_parents text,
  assigned_by uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view support_assignments" ON public.support_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert support_assignments" ON public.support_assignments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update support_assignments" ON public.support_assignments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete support_assignments" ON public.support_assignments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Support completions table (staff marks completion)
CREATE TABLE public.support_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.support_assignments(id) ON DELETE CASCADE,
  completion_date date NOT NULL DEFAULT CURRENT_DATE,
  is_completed boolean NOT NULL DEFAULT true,
  notes text,
  completed_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, completion_date)
);
ALTER TABLE public.support_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view support_completions" ON public.support_completions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert support_completions" ON public.support_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update support_completions" ON public.support_completions FOR UPDATE TO authenticated USING (completed_by = auth.uid());

-- Trigger for updated_at on support_assignments
CREATE TRIGGER set_support_assignments_updated_at
  BEFORE UPDATE ON public.support_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
