-- Add start_date to sheds for live age derivation

ALTER TABLE IF EXISTS public.sheds
ADD COLUMN IF NOT EXISTS start_date date;


