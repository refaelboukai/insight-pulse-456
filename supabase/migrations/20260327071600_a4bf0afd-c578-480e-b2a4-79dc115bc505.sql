
ALTER TYPE public.incident_type ADD VALUE IF NOT EXISTS 'self_harm';
ALTER TYPE public.incident_type ADD VALUE IF NOT EXISTS 'suicide_attempt';

ALTER TABLE public.exceptional_events ADD COLUMN IF NOT EXISTS violence_subtypes text[] DEFAULT '{}';
