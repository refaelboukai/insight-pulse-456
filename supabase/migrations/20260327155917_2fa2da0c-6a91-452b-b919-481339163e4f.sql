
ALTER TABLE public.students ADD COLUMN parent_code text;

-- Generate unique parent codes for all existing students
UPDATE public.students
SET parent_code = 'P' || substr(md5(random()::text || id::text), 1, 7)
WHERE parent_code IS NULL;

-- Make it not null with a default
ALTER TABLE public.students ALTER COLUMN parent_code SET NOT NULL;
ALTER TABLE public.students ALTER COLUMN parent_code SET DEFAULT '';
