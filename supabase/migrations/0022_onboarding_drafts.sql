-- 0022_onboarding_drafts.sql
-- Server-persisted pre-auth draft for the onboarding create flow.
--
-- Purpose: allow the draft (title, description, photo, people) to survive when
-- the user opens the magic link from Gmail webview or a different browser context,
-- where localStorage would be empty.
--
-- The token is 32 bytes of random hex (64 chars) — effectively unguessable.
-- Access is controlled exclusively by the opaque token via the service role.
-- RLS is enabled with no public policies, so only the admin client can read/write.

create table if not exists public.onboarding_drafts (
  id           uuid        primary key default gen_random_uuid(),
  token        text        unique not null default encode(gen_random_bytes(32), 'hex'),
  title        text        not null,
  description  text,
  start_date   date        not null default current_date,
  -- Compressed base64 JPEG data-URL (canvas-compressed, ≤ ~250 KB).
  -- Stored as text in the DB — Postgres handles large text fine for MVP volumes.
  image_data   text,
  -- JSON array of DraftPerson: [{value: string}]
  people       jsonb,
  -- Set when the restore page finishes creating the memory — prevents replay.
  consumed_at  timestamptz,
  expires_at   timestamptz not null default (now() + interval '7 days'),
  created_at   timestamptz not null default now()
);

-- Enable RLS but define no policies.
-- The table is only accessible via createAdminClient() (service role) from server actions.
-- Anonymous / authenticated Supabase clients cannot read or write this table.
alter table public.onboarding_drafts enable row level security;
