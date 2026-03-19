
-- Allow admins to delete from all report-related tables
CREATE POLICY "Admins can delete lesson_reports"
ON public.lesson_reports FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete daily_attendance"
ON public.daily_attendance FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete exceptional_events"
ON public.exceptional_events FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete support_sessions"
ON public.support_sessions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete alerts"
ON public.alerts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
