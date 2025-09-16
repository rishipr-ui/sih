-- Harden daily_logs: ensure table exists, RLS, policies, uniqueness, and sanity checks

-- Ensure table exists (idempotent)
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shed_id uuid NOT NULL REFERENCES public.sheds(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT current_date,
  alive_count integer,
  dead_count integer,
  death_reason text,
  eggs_count integer,
  offspring_count integer
);

-- Enable RLS
ALTER TABLE IF EXISTS public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'daily_logs' AND policyname = 'Users can view their own daily logs'
  ) THEN
    CREATE POLICY "Users can view their own daily logs"
    ON public.daily_logs
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'daily_logs' AND policyname = 'Users can insert their own daily logs'
  ) THEN
    CREATE POLICY "Users can insert their own daily logs"
    ON public.daily_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'daily_logs' AND policyname = 'Users can update their own daily logs'
  ) THEN
    CREATE POLICY "Users can update their own daily logs"
    ON public.daily_logs
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'daily_logs' AND policyname = 'Users can delete their own daily logs'
  ) THEN
    CREATE POLICY "Users can delete their own daily logs"
    ON public.daily_logs
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Uniqueness: one log per shed per user per day
CREATE UNIQUE INDEX IF NOT EXISTS daily_logs_unique_per_day
  ON public.daily_logs(user_id, shed_id, log_date);

-- Sanity check constraints: non-negative counts (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_logs_alive_nonneg'
  ) THEN
    ALTER TABLE public.daily_logs
      ADD CONSTRAINT daily_logs_alive_nonneg CHECK (alive_count IS NULL OR alive_count >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_logs_dead_nonneg'
  ) THEN
    ALTER TABLE public.daily_logs
      ADD CONSTRAINT daily_logs_dead_nonneg CHECK (dead_count IS NULL OR dead_count >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_logs_eggs_nonneg'
  ) THEN
    ALTER TABLE public.daily_logs
      ADD CONSTRAINT daily_logs_eggs_nonneg CHECK (eggs_count IS NULL OR eggs_count >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_logs_offspring_nonneg'
  ) THEN
    ALTER TABLE public.daily_logs
      ADD CONSTRAINT daily_logs_offspring_nonneg CHECK (offspring_count IS NULL OR offspring_count >= 0);
  END IF;
END $$;


