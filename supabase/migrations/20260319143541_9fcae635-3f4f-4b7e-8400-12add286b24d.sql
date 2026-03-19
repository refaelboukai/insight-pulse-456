
-- Delete old sample students
DELETE FROM public.students;

-- Allow admins to insert/update students
CREATE POLICY "Admins can insert students" ON public.students
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update students" ON public.students
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Insert the real students
-- כיתה של טלי
INSERT INTO public.students (student_code, first_name, last_name, grade, class_name) VALUES
('T001', 'אוריאן', 'שיקלי', 'טלי', 'טלי'),
('T002', 'רון', 'מרש', 'טלי', 'טלי'),
('T003', 'הודיה', 'אלחרר', 'טלי', 'טלי'),
('T004', 'יובל', 'אורטס', 'טלי', 'טלי'),
('T005', 'ענהאל', 'שמיאן דהן', 'טלי', 'טלי'),
('T006', 'להב', 'נהוראי', 'טלי', 'טלי'),
('T007', 'ליאן', 'עמאר', 'טלי', 'טלי');

-- כיתה של עדן
INSERT INTO public.students (student_code, first_name, last_name, grade, class_name) VALUES
('E001', 'תאיר', 'שקיר', 'עדן', 'עדן'),
('E002', 'אריאל', 'עוז עזרא', 'עדן', 'עדן'),
('E003', 'נעם', 'יחיאב', 'עדן', 'עדן'),
('E004', 'אלה', 'בן דוד', 'עדן', 'עדן'),
('E005', 'איתמר', 'דכינגר', 'עדן', 'עדן'),
('E006', 'אוריאן', 'קדוש', 'עדן', 'עדן'),
('E007', 'ליה', 'קרמר', 'עדן', 'עדן'),
('E008', 'נעם', 'טובי קרלן', 'עדן', 'עדן'),
('E009', 'נחמן', 'דרור', 'עדן', 'עדן'),
('E010', 'אילון', 'שוורץ', 'עדן', 'עדן'),
('E011', 'איתמר', 'דהן', 'עדן', 'עדן'),
('E012', 'עופר יוסף', 'בכר', 'עדן', 'עדן'),
('E013', 'ליה', 'פקנהיים', 'עדן', 'עדן');
