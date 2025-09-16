-- Normalize sheds age column to age_days
-- Handles cases where an older schema used age_number

DO $$
BEGIN
  -- If age_number exists and age_days does not, rename column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sheds' AND column_name = 'age_number'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sheds' AND column_name = 'age_days'
  ) THEN
    ALTER TABLE public.sheds RENAME COLUMN age_number TO age_days;
  END IF;

  -- If both exist, backfill and drop age_number
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sheds' AND column_name = 'age_number'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sheds' AND column_name = 'age_days'
  ) THEN
    -- Backfill nulls from age_number
    EXECUTE 'UPDATE public.sheds SET age_days = COALESCE(age_days, age_number) WHERE age_days IS NULL';
    -- Drop the old column
    ALTER TABLE public.sheds DROP COLUMN IF EXISTS age_number;
  END IF;

  -- If neither exists, add age_days
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sheds' AND column_name = 'age_days'
  ) THEN
    ALTER TABLE public.sheds ADD COLUMN age_days integer;
  END IF;
END $$;


