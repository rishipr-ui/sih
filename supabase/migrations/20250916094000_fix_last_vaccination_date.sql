-- Normalize sheds last vaccination column to last_vaccination_date
-- Handles cases where an older schema used last_vaccination

DO $$
BEGIN
  -- If last_vaccination exists and last_vaccination_date does not, rename column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sheds' AND column_name = 'last_vaccination'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sheds' AND column_name = 'last_vaccination_date'
  ) THEN
    ALTER TABLE public.sheds RENAME COLUMN last_vaccination TO last_vaccination_date;
  END IF;

  -- If both exist, backfill and drop last_vaccination
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sheds' AND column_name = 'last_vaccination'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sheds' AND column_name = 'last_vaccination_date'
  ) THEN
    -- Backfill nulls from last_vaccination
    EXECUTE 'UPDATE public.sheds SET last_vaccination_date = COALESCE(last_vaccination_date, last_vaccination) WHERE last_vaccination_date IS NULL';
    -- Drop the old column
    ALTER TABLE public.sheds DROP COLUMN IF EXISTS last_vaccination;
  END IF;

  -- If neither exists, add last_vaccination_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sheds' AND column_name = 'last_vaccination_date'
  ) THEN
    ALTER TABLE public.sheds ADD COLUMN last_vaccination_date date;
  END IF;
END $$;


