
ALTER TABLE public.student_mappings DROP CONSTRAINT student_mappings_subject_area_check;
ALTER TABLE public.student_mappings ADD CONSTRAINT student_mappings_subject_area_check CHECK (subject_area IN ('math', 'hebrew', 'english', 'language'));
