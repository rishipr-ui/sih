-- Ensure sheds.vaccinated is a boolean column
-- Handles older schemas where vaccinated might be TEXT/INT

DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'sheds' AND column_name = 'vaccinated';

  -- If column does not exist, create it
  IF col_type IS NULL THEN
    ALTER TABLE public.sheds ADD COLUMN vaccinated boolean;
  ELSIF col_type <> 'boolean' THEN
    -- Create a temp boolean column
    ALTER TABLE public.sheds ADD COLUMN IF NOT EXISTS vaccinated_bool boolean;
    -- Best-effort conversion from various legacy types/values
    UPDATE public.sheds SET vaccinated_bool = CASE
      WHEN CAST(vaccinated AS text) ILIKE 't' THEN true
      WHEN CAST(vaccinated AS text) ILIKE 'true' THEN true
      WHEN CAST(vaccinated AS text) ILIKE 'yes' THEN true
      WHEN CAST(vaccinated AS text) = '1' THEN true
      WHEN CAST(vaccinated AS text) ILIKE 'f' THEN false
      WHEN CAST(vaccinated AS text) ILIKE 'false' THEN false
      WHEN CAST(vaccinated AS text) ILIKE 'no' THEN false
      WHEN CAST(vaccinated AS text) = '0' THEN false
      ELSE NULL
    END;

    -- Drop old column and rename
    ALTER TABLE public.sheds DROP COLUMN vaccinated;
    ALTER TABLE public.sheds RENAME COLUMN vaccinated_bool TO vaccinated;
  END IF;
END $$;


