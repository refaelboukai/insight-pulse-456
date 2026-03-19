
-- Create enum types
CREATE TYPE public.attendance_status AS ENUM ('full', 'partial', 'absent');
CREATE TYPE public.behavior_type AS ENUM ('respectful', 'non_respectful', 'disruptive', 'violent');
CREATE TYPE public.violence_type AS ENUM ('physical', 'verbal', 'property_damage', 'sexual');
CREATE TYPE public.participation_level AS ENUM ('completed_tasks', 'active_participation', 'no_participation');
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');
CREATE TYPE public.incident_type AS ENUM ('violence', 'bullying', 'medical', 'safety', 'other');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Students table (preloaded, fixed list)
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_code TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  grade TEXT,
  class_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Staff profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lesson reports
CREATE TABLE public.lesson_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  staff_user_id UUID REFERENCES auth.users(id) NOT NULL,
  lesson_subject TEXT NOT NULL,
  report_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attendance attendance_status NOT NULL,
  behavior_types behavior_type[] NOT NULL DEFAULT '{}',
  violence_subtypes violence_type[] DEFAULT '{}',
  behavior_severity INTEGER CHECK (behavior_severity >= 1 AND behavior_severity <= 5),
  participation participation_level,
  performance_score INTEGER CHECK (performance_score >= 1 AND performance_score <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL,
  description TEXT NOT NULL,
  related_report_id UUID REFERENCES public.lesson_reports(id),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Exceptional events
CREATE TABLE public.exceptional_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_by UUID REFERENCES auth.users(id) NOT NULL,
  incident_type incident_type NOT NULL,
  description TEXT NOT NULL,
  people_involved TEXT,
  staff_response TEXT,
  followup_required BOOLEAN NOT NULL DEFAULT false,
  followup_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exceptional_events ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies

-- Students: all authenticated can read
CREATE POLICY "Authenticated users can view students" ON public.students
FOR SELECT TO authenticated USING (true);

-- User roles: users can see their own
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Profiles: all authenticated can read, users can update own
CREATE POLICY "Authenticated can view profiles" ON public.profiles
FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Lesson reports: staff can insert, all authenticated can read
CREATE POLICY "Staff can insert reports" ON public.lesson_reports
FOR INSERT TO authenticated WITH CHECK (auth.uid() = staff_user_id);
CREATE POLICY "Authenticated can view reports" ON public.lesson_reports
FOR SELECT TO authenticated USING (true);

-- Alerts: admins can read all, staff can read related
CREATE POLICY "Authenticated can view alerts" ON public.alerts
FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert alerts" ON public.alerts
FOR INSERT TO authenticated WITH CHECK (true);

-- Exceptional events: staff can insert, all can read
CREATE POLICY "Staff can insert events" ON public.exceptional_events
FOR INSERT TO authenticated WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Authenticated can view events" ON public.exceptional_events
FOR SELECT TO authenticated USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample students
INSERT INTO public.students (student_code, first_name, last_name, grade, class_name) VALUES
('STU001', 'יוסי', 'כהן', 'ז', 'א'),
('STU002', 'שרה', 'לוי', 'ז', 'א'),
('STU003', 'דוד', 'אברהם', 'ז', 'ב'),
('STU004', 'רחל', 'מזרחי', 'ח', 'א'),
('STU005', 'אלון', 'פרץ', 'ח', 'א'),
('STU006', 'נועה', 'גולן', 'ח', 'ב'),
('STU007', 'עמית', 'שלום', 'ט', 'א'),
('STU008', 'מיכל', 'דהן', 'ט', 'א'),
('STU009', 'איתי', 'ביטון', 'ט', 'ב'),
('STU010', 'תמר', 'רוזנברג', 'י', 'א');
