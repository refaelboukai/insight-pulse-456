
-- Fix overly permissive alert insert policy
DROP POLICY "System can insert alerts" ON public.alerts;
CREATE POLICY "Authenticated can insert alerts" ON public.alerts
FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
