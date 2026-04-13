-- 0023_user_birth_date.sql
-- Add birth_date to users table for the age system.
-- Optional field — null when the user hasn't set it yet.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS birth_date date;
