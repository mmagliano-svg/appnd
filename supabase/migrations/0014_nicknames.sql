-- 0014_nicknames.sql
-- Replace single nickname (text) with nicknames array (text[])

ALTER TABLE people
  ADD COLUMN IF NOT EXISTS nicknames text[] NOT NULL DEFAULT '{}';

-- Migrate any existing single nickname into the array
UPDATE people
SET nicknames = ARRAY[nickname]
WHERE nickname IS NOT NULL
  AND nickname <> ''
  AND (nicknames IS NULL OR array_length(nicknames, 1) IS NULL);
