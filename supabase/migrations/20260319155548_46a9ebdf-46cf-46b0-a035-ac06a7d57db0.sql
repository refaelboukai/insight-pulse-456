
DROP POLICY "Authenticated users can insert daily_attendance" ON public.daily_attendance;
DROP POLICY "Authenticated users can update daily_attendance" ON public.daily_attendance;

CREATE POLICY "Users can insert own daily_attendance"
  ON public.daily_attendance FOR INSERT TO authenticated 
  WITH CHECK (recorded_by = auth.uid());

CREATE POLICY "Users can update own daily_attendance"
  ON public.daily_attendance FOR UPDATE TO authenticated 
  USING (recorded_by = auth.uid()) WITH CHECK (recorded_by = auth.uid());
