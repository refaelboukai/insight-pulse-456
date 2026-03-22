
-- Allow admins to delete activity_logs
CREATE POLICY "Admins can delete activity_logs"
ON public.activity_logs FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete daily_reflections
CREATE POLICY "Admins can delete daily_reflections"
ON public.daily_reflections FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete brain_training_scores
CREATE POLICY "Admins can delete brain_training_scores"
ON public.brain_training_scores FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete brain_training_history
CREATE POLICY "Admins can delete brain_training_history"
ON public.brain_training_history FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
