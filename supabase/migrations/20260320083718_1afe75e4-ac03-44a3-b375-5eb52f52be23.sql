
ALTER TABLE public.student_grades 
ADD COLUMN semester text NOT NULL DEFAULT 'semester_a',
ADD COLUMN sub_grades jsonb DEFAULT NULL;

COMMENT ON COLUMN public.student_grades.semester IS 'semester_a, semester_b, or summer';
COMMENT ON COLUMN public.student_grades.sub_grades IS 'Array of {grade: number, weight: number} objects for weighted grade calculation';
