-- 0017_birth_date.sql
-- Add optional birth date to people for recurring memory anchor detection.
-- Stored as text to support two precision levels:
--   'MM-DD'       — day + month only (year unknown)
--   'YYYY-MM-DD'  — full date (year known)
-- The anchor detection logic (lib/utils/anchors.ts) only needs MM-DD for matching.

ALTER TABLE people
  ADD COLUMN IF NOT EXISTS birth_date text;
