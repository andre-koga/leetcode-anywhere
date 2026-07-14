-- Profiles, drafts, submissions, and avatar storage for AnyLeet cloud sync.
-- Apply in the Supabase SQL editor (or via `supabase db push`) after creating a project.

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (
    username is null or (char_length(username) >= 3 and char_length(username) <= 30)
  ),
  constraint profiles_username_format check (
    username is null or username ~ '^[a-z0-9_]+$'
  ),
  constraint profiles_full_name_length check (
    full_name is null or char_length(full_name) <= 80
  ),
  constraint profiles_bio_length check (
    bio is null or char_length(bio) <= 280
  )
);

create index if not exists profiles_username_idx on public.profiles (username);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles
  for select
  to authenticated, anon
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

-- ---------------------------------------------------------------------------
-- Drafts (per user, per problem, per language)
-- ---------------------------------------------------------------------------

create table if not exists public.drafts (
  user_id uuid not null references auth.users (id) on delete cascade,
  problem_id text not null,
  language text not null,
  code text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, problem_id, language),
  constraint drafts_language_check check (language in ('javascript', 'typescript', 'python'))
);

create index if not exists drafts_user_updated_idx on public.drafts (user_id, updated_at desc);

alter table public.drafts enable row level security;

drop policy if exists "Users can read their own drafts" on public.drafts;
create policy "Users can read their own drafts"
  on public.drafts
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own drafts" on public.drafts;
create policy "Users can insert their own drafts"
  on public.drafts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own drafts" on public.drafts;
create policy "Users can update their own drafts"
  on public.drafts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own drafts" on public.drafts;
create policy "Users can delete their own drafts"
  on public.drafts
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Submissions / attempts
-- ---------------------------------------------------------------------------

create table if not exists public.submissions (
  id bigint generated always as identity primary key,
  client_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  problem_id text not null,
  language text not null,
  code text not null,
  verdict text not null,
  passed integer not null,
  total integer not null,
  time_ms integer not null,
  created_at timestamptz not null default now(),
  constraint submissions_language_check check (language in ('javascript', 'typescript', 'python')),
  constraint submissions_verdict_check check (
    verdict in ('accepted', 'wrong-answer', 'error', 'timeout')
  ),
  constraint submissions_client_id_unique unique (user_id, client_id)
);

create index if not exists submissions_user_created_idx
  on public.submissions (user_id, created_at desc);

create index if not exists submissions_user_problem_idx
  on public.submissions (user_id, problem_id);

create index if not exists submissions_user_accepted_idx
  on public.submissions (user_id, problem_id)
  where verdict = 'accepted';

alter table public.submissions enable row level security;

-- Owners can read all of their attempts (including code). Public profile pages
-- use get_user_solved_problems() so solution code is never exposed.
drop policy if exists "Users can read their own submissions" on public.submissions;
create policy "Users can read their own submissions"
  on public.submissions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own submissions" on public.submissions;
create policy "Users can insert their own submissions"
  on public.submissions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create or replace function public.get_user_solved_problems(profile_id uuid)
returns table (problem_id text, first_solved_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select s.problem_id, min(s.created_at) as first_solved_at
  from public.submissions s
  where s.user_id = profile_id
    and s.verdict = 'accepted'
  group by s.problem_id
  order by first_solved_at;
$$;

grant execute on function public.get_user_solved_problems(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Avatar storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
  on storage.objects
  for select
  to authenticated, anon
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
