-- 0011_people.sql
-- Structured person entities (ghost | invited | active)
-- Separate from tags and from memory_participants (registered users)

-- ── people ────────────────────────────────────────────────────────────────
CREATE TABLE people (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  avatar_url     text,
  status         text        NOT NULL DEFAULT 'ghost'
                             CHECK (status IN ('ghost', 'invited', 'active')),
  linked_user_id uuid        REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- One person name per owner (case-insensitive)
CREATE UNIQUE INDEX idx_people_owner_name ON people (owner_id, lower(name));

-- ── memory_people ─────────────────────────────────────────────────────────
CREATE TABLE memory_people (
  memory_id  uuid        NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  person_id  uuid        NOT NULL REFERENCES people(id)  ON DELETE CASCADE,
  added_by   uuid        NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (memory_id, person_id)
);

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE people        ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_people ENABLE ROW LEVEL SECURITY;

-- Owner manages their people
CREATE POLICY "owner can manage people"
  ON people FOR ALL
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Owner manages memory_people they added
CREATE POLICY "owner can manage memory_people"
  ON memory_people FOR ALL
  USING  (added_by = auth.uid())
  WITH CHECK (added_by = auth.uid());

-- Co-participants can read who was tagged
CREATE POLICY "participants can read memory_people"
  ON memory_people FOR SELECT
  USING (
    memory_id IN (
      SELECT memory_id FROM memory_participants
      WHERE user_id = auth.uid() AND joined_at IS NOT NULL
    )
  );

-- ── indexes ───────────────────────────────────────────────────────────────
CREATE INDEX idx_people_owner_id          ON people        (owner_id);
CREATE INDEX idx_memory_people_memory_id  ON memory_people (memory_id);
CREATE INDEX idx_memory_people_person_id  ON memory_people (person_id);
