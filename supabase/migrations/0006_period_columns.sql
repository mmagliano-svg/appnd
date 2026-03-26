-- =============================================
-- Migration 0006 — Period columns
-- Adds start_date, end_date, parent_period_id to memories
-- =============================================

-- start_date: replaces happened_at as primary date field (backfilled from happened_at)
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS start_date date;

UPDATE public.memories
  SET start_date = happened_at
  WHERE start_date IS NULL;

ALTER TABLE public.memories
  ALTER COLUMN start_date SET NOT NULL,
  ALTER COLUMN start_date SET DEFAULT CURRENT_DATE;

-- end_date: present only for life periods (NULL = single event)
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS end_date date;

-- parent_period_id: optional link from an event to a containing period
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS parent_period_id uuid
  REFERENCES public.memories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS memories_start_date_idx
  ON public.memories(start_date DESC);

CREATE INDEX IF NOT EXISTS memories_parent_period_id_idx
  ON public.memories(parent_period_id);
