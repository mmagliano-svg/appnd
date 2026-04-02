-- Add importance to memories
-- Integer 1–5, nullable (null = not set by user).
-- Constraint enforces valid range; RLS is already in place on memories.

ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS importance integer DEFAULT NULL
    CONSTRAINT memories_importance_range CHECK (importance >= 1 AND importance <= 5);
