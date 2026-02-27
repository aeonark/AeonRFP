create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company text,
  role text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy if not exists "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy if not exists "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy if not exists "profiles_update_own" on public.profiles for update using (auth.uid() = id);
