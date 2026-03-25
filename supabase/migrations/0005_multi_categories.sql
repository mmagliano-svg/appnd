-- Add multi-category support: memories can now belong to multiple chapters
ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';

-- Backfill: copy existing single-category value into the new array
UPDATE memories
SET categories = ARRAY[category]
WHERE category IS NOT NULL
  AND categories = '{}';
