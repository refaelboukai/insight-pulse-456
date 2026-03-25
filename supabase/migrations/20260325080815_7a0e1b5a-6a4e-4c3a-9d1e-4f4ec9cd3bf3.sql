
ALTER TABLE public.pedagogical_goals ADD COLUMN school_year text NOT NULL DEFAULT 'תשפ"ו';
ALTER TABLE public.exam_schedule ADD COLUMN school_year text NOT NULL DEFAULT 'תשפ"ו';

-- Drop old unique constraint and recreate with school_year
ALTER TABLE public.pedagogical_goals DROP CONSTRAINT IF EXISTS pedagogical_goals_student_id_subject_id_sub_subject_month_key;
ALTER TABLE public.pedagogical_goals ADD CONSTRAINT pedagogical_goals_unique_per_year UNIQUE(student_id, subject_id, sub_subject, month, school_year);
