-- Shared Memory v1
-- Introduces a "common moment" wrapper that multiple people can contribute to.

-- ── shared_memories ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shared_memories (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   uuid        NOT NULL,
  title           text        NOT NULL,
  start_date      date        NOT NULL,
  end_date        date,
  location_name   text,
  anchor_id       text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── shared_memory_participants ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shared_memory_participants (
  id                uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_memory_id  uuid  NOT NULL REFERENCES shared_memories(id) ON DELETE CASCADE,
  person_id         uuid  NOT NULL,
  linked_user_id    uuid,
  role              text  NOT NULL DEFAULT 'participant',
  invite_status     text  NOT NULL DEFAULT 'pending',
  added_by_user_id  uuid  NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT smp_role_values         CHECK (role IN ('owner', 'participant')),
  CONSTRAINT smp_invite_status_values CHECK (invite_status IN ('pending', 'accepted', 'declined'))
);

-- ── shared_memory_contributions ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shared_memory_contributions (
  id                uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_memory_id  uuid  NOT NULL REFERENCES shared_memories(id) ON DELETE CASCADE,
  author_user_id    uuid  NOT NULL,
  body              text  NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ── Link memories → shared_memories ───────────────────────────────────────

ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS shared_memory_id uuid
  REFERENCES shared_memories(id) ON DELETE SET NULL;

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_smp_shared_memory_id   ON shared_memory_participants(shared_memory_id);
CREATE INDEX IF NOT EXISTS idx_smc_shared_memory_id   ON shared_memory_contributions(shared_memory_id);
CREATE INDEX IF NOT EXISTS idx_memories_shared_mem_id ON memories(shared_memory_id);

-- ── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE shared_memories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_memory_participants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_memory_contributions ENABLE ROW LEVEL SECURITY;

-- shared_memories: owner + linked participants can read
CREATE POLICY "sm_select" ON shared_memories
  FOR SELECT USING (
    owner_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM shared_memory_participants smp
      WHERE smp.shared_memory_id = shared_memories.id
        AND smp.linked_user_id = auth.uid()
    )
  );

CREATE POLICY "sm_insert" ON shared_memories
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());

-- shared_memory_participants: adder + linked user + memory owner can read
CREATE POLICY "smp_select" ON shared_memory_participants
  FOR SELECT USING (
    added_by_user_id = auth.uid()
    OR linked_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM shared_memories sm
      WHERE sm.id = shared_memory_id
        AND sm.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "smp_insert" ON shared_memory_participants
  FOR INSERT WITH CHECK (added_by_user_id = auth.uid());

-- shared_memory_contributions: members can read, author can insert
CREATE POLICY "smc_select" ON shared_memory_contributions
  FOR SELECT USING (
    author_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM shared_memories sm
      WHERE sm.id = shared_memory_id AND (
        sm.owner_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM shared_memory_participants smp
          WHERE smp.shared_memory_id = sm.id
            AND smp.linked_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "smc_insert" ON shared_memory_contributions
  FOR INSERT WITH CHECK (author_user_id = auth.uid());
