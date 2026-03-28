-- 0016_memory_invites.sql
-- Person-centric shared-story invites.
-- Distinct from memory_participants invites (generic email-based).
-- Links a specific person (from the `people` table) to a shared memory.
-- Future: when a ghost person claims their account, accepted_at can be set.

CREATE TABLE IF NOT EXISTS memory_invites (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id        uuid        NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  person_id        uuid        NOT NULL REFERENCES people(id)   ON DELETE CASCADE,
  inviter_user_id  uuid        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  token            text        UNIQUE NOT NULL,
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'opened', 'accepted', 'expired')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  opened_at        timestamptz NULL,
  accepted_at      timestamptz NULL,
  expires_at       timestamptz NULL
);

ALTER TABLE memory_invites ENABLE ROW LEVEL SECURITY;

-- Inviter can read and manage their own invites
CREATE POLICY "inviter_manage" ON memory_invites
  FOR ALL USING (inviter_user_id = auth.uid());
