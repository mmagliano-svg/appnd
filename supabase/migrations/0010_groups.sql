-- ── Groups ────────────────────────────────────────────────────────────────────
-- A Group is a persistent set of people who share memories together.
-- When a memory is created with group_id, all current group members are
-- auto-added as memory_participants (handled at the application layer).

CREATE TABLE groups (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  type         text        NOT NULL DEFAULT 'friends'
                           CHECK (type IN ('couple','family','friends','trip','other')),
  created_by   uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_token text        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Group members ────────────────────────────────────────────────────────────

CREATE TABLE group_members (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id       uuid        REFERENCES users(id) ON DELETE CASCADE,
  invited_email text,
  joined_at     timestamptz,
  role          text        NOT NULL DEFAULT 'member'
                            CHECK (role IN ('admin', 'member')),
  UNIQUE (group_id, user_id)
);

-- ── Add group_id to memories ──────────────────────────────────────────────────

ALTER TABLE memories ADD COLUMN group_id uuid REFERENCES groups(id) ON DELETE SET NULL;

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Groups: joined members can read their groups
CREATE POLICY "group members can read their groups"
  ON groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND joined_at IS NOT NULL
    )
  );

-- Groups: authenticated users can create
CREATE POLICY "users can create groups"
  ON groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Groups: creator can update
CREATE POLICY "creator can update group"
  ON groups FOR UPDATE
  USING (created_by = auth.uid());

-- Group members: members of the same group can read fellow members
CREATE POLICY "group members can read fellow members"
  ON group_members FOR SELECT
  USING (
    group_id IN (
      SELECT gm2.group_id FROM group_members gm2
      WHERE gm2.user_id = auth.uid() AND gm2.joined_at IS NOT NULL
    )
  );

-- Group members: existing members can invite others (insert unjoined rows)
CREATE POLICY "group members can add invites"
  ON group_members FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT gm2.group_id FROM group_members gm2
      WHERE gm2.user_id = auth.uid() AND gm2.joined_at IS NOT NULL
    )
  );

-- Memories: group members can read memories that belong to their groups.
-- This is additive to the existing memory_participants policy (RLS policies are OR'd).
CREATE POLICY "group members can read group memories"
  ON memories FOR SELECT
  USING (
    group_id IS NOT NULL
    AND group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND joined_at IS NOT NULL
    )
  );

-- Indexes for performance
CREATE INDEX idx_group_members_group_id  ON group_members (group_id);
CREATE INDEX idx_group_members_user_id   ON group_members (user_id);
CREATE INDEX idx_memories_group_id       ON memories (group_id);
