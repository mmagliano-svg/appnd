-- Add memory classification fields
-- is_anniversary: true for recurring yearly events (birthdays, anniversaries, etc.)
-- is_first_time:  true when this memory marks a personal "first"

ALTER TABLE memories
  ADD COLUMN is_anniversary boolean NOT NULL DEFAULT false,
  ADD COLUMN is_first_time  boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN memories.is_anniversary IS 'True for events that recur yearly (compleanno, anniversario, festività)';
COMMENT ON COLUMN memories.is_first_time  IS 'True when this marks a personal "prima volta"';
