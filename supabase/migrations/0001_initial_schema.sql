-- =============================================
-- Appnd MVP — Initial Schema
-- =============================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================

create type content_type as enum ('text', 'photo', 'note');
create type media_type as enum ('image', 'video');

-- =============================================
-- TABLES
-- =============================================

-- Users (mirrors auth.users, public profile data)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Memories
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  happened_at date not null,
  location_name text,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Memory Participants
create table public.memory_participants (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  invited_email text,
  invite_token text unique not null,
  joined_at timestamptz,
  constraint participant_has_user_or_email check (
    user_id is not null or invited_email is not null
  )
);

-- Memory Contributions
create table public.memory_contributions (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content_type content_type not null,
  text_content text,
  media_url text,
  caption text,
  created_at timestamptz not null default now()
);

-- Memory Media
create table public.memory_media (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  contribution_id uuid references public.memory_contributions(id) on delete set null,
  uploaded_by uuid not null references public.users(id) on delete cascade,
  storage_path text not null,
  media_type media_type not null,
  created_at timestamptz not null default now()
);

-- =============================================
-- INDEXES
-- =============================================

create index memories_created_by_idx on public.memories(created_by);
create index memories_happened_at_idx on public.memories(happened_at desc);
create index memory_participants_memory_id_idx on public.memory_participants(memory_id);
create index memory_participants_user_id_idx on public.memory_participants(user_id);
create index memory_participants_invite_token_idx on public.memory_participants(invite_token);
create index memory_contributions_memory_id_idx on public.memory_contributions(memory_id);
create index memory_contributions_author_id_idx on public.memory_contributions(author_id);
create index memory_media_memory_id_idx on public.memory_media(memory_id);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger memories_updated_at
  before update on public.memories
  for each row execute function update_updated_at();

-- =============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- =============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table public.users enable row level security;
alter table public.memories enable row level security;
alter table public.memory_participants enable row level security;
alter table public.memory_contributions enable row level security;
alter table public.memory_media enable row level security;

-- USERS: can read own profile, can update own profile
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- Allow reading other users' basic info if sharing a memory
create policy "users_select_participants" on public.users
  for select using (
    id in (
      select mp.user_id from public.memory_participants mp
      where mp.memory_id in (
        select mp2.memory_id from public.memory_participants mp2
        where mp2.user_id = auth.uid()
      )
    )
  );

-- MEMORIES: visible only to participants
create policy "memories_select_participants" on public.memories
  for select using (
    id in (
      select memory_id from public.memory_participants
      where user_id = auth.uid()
    )
  );

create policy "memories_insert_authenticated" on public.memories
  for insert with check (auth.uid() = created_by);

create policy "memories_update_creator" on public.memories
  for update using (auth.uid() = created_by);

-- MEMORY_PARTICIPANTS: visible to memory participants
create policy "memory_participants_select" on public.memory_participants
  for select using (
    memory_id in (
      select memory_id from public.memory_participants
      where user_id = auth.uid()
    )
  );

create policy "memory_participants_insert_creator" on public.memory_participants
  for insert with check (
    memory_id in (
      select id from public.memories where created_by = auth.uid()
    )
  );

create policy "memory_participants_update_own" on public.memory_participants
  for update using (user_id = auth.uid());

-- MEMORY_CONTRIBUTIONS: visible to memory participants
create policy "contributions_select_participants" on public.memory_contributions
  for select using (
    memory_id in (
      select memory_id from public.memory_participants
      where user_id = auth.uid()
    )
  );

create policy "contributions_insert_participants" on public.memory_contributions
  for insert with check (
    auth.uid() = author_id
    and memory_id in (
      select memory_id from public.memory_participants
      where user_id = auth.uid()
    )
  );

-- MEMORY_MEDIA: visible to memory participants
create policy "media_select_participants" on public.memory_media
  for select using (
    memory_id in (
      select memory_id from public.memory_participants
      where user_id = auth.uid()
    )
  );

create policy "media_insert_participants" on public.memory_media
  for insert with check (
    auth.uid() = uploaded_by
    and memory_id in (
      select memory_id from public.memory_participants
      where user_id = auth.uid()
    )
  );
