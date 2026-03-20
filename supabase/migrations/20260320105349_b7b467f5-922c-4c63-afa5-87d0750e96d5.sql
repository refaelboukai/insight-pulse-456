
-- 1. Add DELETE policy for support_completions (staff can remove their own completions)
CREATE POLICY "Staff can delete own support_completions"
  ON public.support_completions FOR DELETE
  TO authenticated
  USING (completed_by = auth.uid());

-- 2. Add unique constraint on daily_attendance for upsert to work
ALTER TABLE public.daily_attendance
  ADD CONSTRAINT daily_attendance_student_date_unique
  UNIQUE (student_id, attendance_date);
