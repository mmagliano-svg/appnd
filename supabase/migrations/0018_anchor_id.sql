-- Add anchor_id to memories
-- Stores a fixed anchor identifier (e.g. 'birthday', 'christmas') from the frontend ANCHORS list.
-- text, nullable — no FK constraint, validated at application level.

ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS anchor_id text DEFAULT NULL;
