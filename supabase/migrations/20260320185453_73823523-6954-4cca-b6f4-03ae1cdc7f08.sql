
-- 1. FIX PRIVILEGE ESCALATION: user_roles
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can only self-assign student role"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND role = 'student'::app_role);

-- 2. RESTRICT SELECT ON SENSITIVE TABLES

-- students
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
CREATE POLICY "Staff and admin can view all students"
ON public.students FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own student record"
ON public.students FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'student'::app_role));

-- lesson_reports
DROP POLICY IF EXISTS "Authenticated can view reports" ON public.lesson_reports;
CREATE POLICY "Staff and admin can view lesson_reports"
ON public.lesson_reports FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own lesson_reports"
ON public.lesson_reports FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'student'::app_role));

-- student_grades
DROP POLICY IF EXISTS "Authenticated can view student_grades" ON public.student_grades;
CREATE POLICY "Staff and admin can view student_grades"
ON public.student_grades FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own student_grades"
ON public.student_grades FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'student'::app_role));

-- student_evaluations
DROP POLICY IF EXISTS "Authenticated can view student_evaluations" ON public.student_evaluations;
CREATE POLICY "Staff and admin can view student_evaluations"
ON public.student_evaluations FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own student_evaluations"
ON public.student_evaluations FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'student'::app_role));

-- exceptional_events (students should NOT see)
DROP POLICY IF EXISTS "Authenticated can view events" ON public.exceptional_events;
CREATE POLICY "Staff and admin can view exceptional_events"
ON public.exceptional_events FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- support_sessions
DROP POLICY IF EXISTS "Authenticated can view support_sessions" ON public.support_sessions;
CREATE POLICY "Staff and admin can view support_sessions"
ON public.support_sessions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- support_assignments
DROP POLICY IF EXISTS "Authenticated can view support_assignments" ON public.support_assignments;
CREATE POLICY "Staff and admin can view support_assignments"
ON public.support_assignments FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own support_assignments"
ON public.support_assignments FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'student'::app_role));

-- daily_attendance
DROP POLICY IF EXISTS "Authenticated users can read daily_attendance" ON public.daily_attendance;
CREATE POLICY "Staff and admin can view daily_attendance"
ON public.daily_attendance FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own daily_attendance"
ON public.daily_attendance FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'student'::app_role));

-- alerts
DROP POLICY IF EXISTS "Authenticated can view alerts" ON public.alerts;
CREATE POLICY "Staff and admin can view alerts"
ON public.alerts FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- support_completions
DROP POLICY IF EXISTS "Authenticated can view support_completions" ON public.support_completions;
CREATE POLICY "Staff and admin can view support_completions"
ON public.support_completions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 3. ALLOW STAFF TO INSERT SUPPORT ASSIGNMENTS
DROP POLICY IF EXISTS "Admins can insert support_assignments" ON public.support_assignments;
CREATE POLICY "Staff and admin can insert support_assignments"
ON public.support_assignments FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
