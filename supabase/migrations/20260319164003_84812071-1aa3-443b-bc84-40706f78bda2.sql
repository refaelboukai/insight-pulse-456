
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS mother_name text,
  ADD COLUMN IF NOT EXISTS father_name text,
  ADD COLUMN IF NOT EXISTS mother_phone text,
  ADD COLUMN IF NOT EXISTS father_phone text,
  ADD COLUMN IF NOT EXISTS mother_email text,
  ADD COLUMN IF NOT EXISTS father_email text,
  ADD COLUMN IF NOT EXISTS gender text;
