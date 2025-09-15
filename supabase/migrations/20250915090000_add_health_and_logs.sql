-- Add health fields to sheds
alter table if exists public.sheds
add column if not exists age_days integer,
add column if not exists vaccinated boolean,
add column if not exists last_vaccination_date date;

-- Create daily_logs table for mortality and production tracking
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shed_id uuid not null references public.sheds(id) on delete cascade,
  log_date date not null default current_date,
  alive_count integer,
  dead_count integer,
  death_reason text,
  eggs_count integer,
  offspring_count integer
);

create index if not exists daily_logs_user_id_idx on public.daily_logs(user_id);
create index if not exists daily_logs_shed_id_idx on public.daily_logs(shed_id);
create index if not exists daily_logs_log_date_idx on public.daily_logs(log_date);

