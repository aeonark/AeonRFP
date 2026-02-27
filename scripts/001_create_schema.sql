-- Create profiles table for user management
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company text,
  role text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Create RFP documents table
create table if not exists public.rfp_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  file_type text,
  file_size bigint,
  status text default 'queued' check (status in ('queued', 'extracting', 'analyzing', 'complete', 'error')),
  clauses_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.rfp_documents enable row level security;

create policy "rfp_select_own" on public.rfp_documents for select using (auth.uid() = user_id);
create policy "rfp_insert_own" on public.rfp_documents for insert with check (auth.uid() = user_id);
create policy "rfp_update_own" on public.rfp_documents for update using (auth.uid() = user_id);
create policy "rfp_delete_own" on public.rfp_documents for delete using (auth.uid() = user_id);
