-- 0012_extend_people.sql
-- Extend people with richer identity, relationship context, claim readiness, and group associations

-- relation_label and short_bio may already exist (added out-of-band after 0011) — safe to re-run
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS relation_label  text,
  ADD COLUMN IF NOT EXISTS short_bio       text;

-- Identity
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS first_name      text,
  ADD COLUMN IF NOT EXISTS last_name       text,
  ADD COLUMN IF NOT EXISTS nickname        text;

-- Relationship context
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS how_we_met      text,
  ADD COLUMN IF NOT EXISTS shared_context  text;

-- Claim readiness (separate from status which tracks invite/join flow)
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS claim_status    text NOT NULL DEFAULT 'none'
             CHECK (claim_status IN ('none', 'claimable', 'invited', 'claimed'));

-- Group associations: UUIDs of groups (owned by the same user) this person belongs to.
-- Stored as a denormalized array for MVP simplicity. No FK — intentional for ghost profiles.
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS group_ids       uuid[] NOT NULL DEFAULT '{}';
