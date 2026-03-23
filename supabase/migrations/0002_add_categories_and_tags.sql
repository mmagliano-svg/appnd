-- Migration 0002: add category and tags to memories
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}' NOT NULL;

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_memories_category ON public.memories(category);

-- Index for filtering by tags (GIN index for array search)
CREATE INDEX IF NOT EXISTS idx_memories_tags ON public.memories USING GIN(tags);
