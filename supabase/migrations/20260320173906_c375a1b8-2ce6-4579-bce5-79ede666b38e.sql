ALTER TABLE public.lesson_reports 
  ALTER COLUMN participation TYPE participation_level[] 
  USING CASE WHEN participation IS NOT NULL THEN ARRAY[participation] ELSE '{}'::participation_level[] END;

ALTER TABLE public.lesson_reports 
  ALTER COLUMN participation SET DEFAULT '{}'::participation_level[];

ALTER TABLE public.lesson_reports 
  ALTER COLUMN participation SET NOT NULL;