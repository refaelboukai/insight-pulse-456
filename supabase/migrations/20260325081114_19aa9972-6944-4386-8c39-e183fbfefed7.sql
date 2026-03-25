
ALTER TABLE public.student_grades ADD COLUMN school_year text NOT NULL DEFAULT 'תשפ"ו';
ALTER TABLE public.student_evaluations ADD COLUMN school_year text NOT NULL DEFAULT 'תשפ"ו';
