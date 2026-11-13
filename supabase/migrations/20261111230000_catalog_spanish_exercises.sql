-- Translated fields are optional. Updates flow through the existing catalog change log.
ALTER TABLE public.exercises
    ADD COLUMN IF NOT EXISTS name_es text,
    ADD COLUMN IF NOT EXISTS description_es text,
    ADD COLUMN IF NOT EXISTS instructions_es text,
    ADD COLUMN IF NOT EXISTS tips_es text;
