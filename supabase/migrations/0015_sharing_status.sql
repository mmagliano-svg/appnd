-- 0015_sharing_status.sql
-- Add sharing_status to memories: 'private' (default) | 'shared'
-- A shared memory is one that belongs to a mutual story with tagged people.
-- Compatible with future claim flow: ghost people who join can inherit shared memories.

ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS sharing_status text
    NOT NULL DEFAULT 'private'
    CHECK (sharing_status IN ('private', 'shared'));
