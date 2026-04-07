-- =============================================
-- 0021 — Name-only participants
--
-- Allows a participant row to be created with just a display_name,
-- no email and no user_id.  This supports the "Chi era con te?"
-- feature where the user types a name before they have an email.
--
-- Changes:
--   1. Add display_name column to memory_participants
--   2. Replace the existing user_or_email check with a broader one
--      that accepts name-only rows too
-- =============================================

alter table public.memory_participants
  add column if not exists display_name text;

-- Drop old constraint (named or anonymous — we handle both)
alter table public.memory_participants
  drop constraint if exists participant_has_user_or_email;

-- New constraint: at least one identifier must be present
alter table public.memory_participants
  add constraint participant_has_identifier check (
    user_id      is not null or
    invited_email is not null or
    display_name  is not null
  );
