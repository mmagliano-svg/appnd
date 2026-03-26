-- Thread of messages attached to a memory (private to participants)
CREATE TABLE IF NOT EXISTS public.memory_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id  uuid        NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES public.users(id),
  content    text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS memory_messages_memory_id_idx ON public.memory_messages (memory_id, created_at);

ALTER TABLE public.memory_messages ENABLE ROW LEVEL SECURITY;

-- Only participants of a memory can read its messages
CREATE POLICY "messages_select_participants" ON public.memory_messages
  FOR SELECT USING (
    memory_id IN (
      SELECT memory_id FROM public.memory_participants
      WHERE user_id = auth.uid() AND joined_at IS NOT NULL
    )
  );

-- Only participants can post
CREATE POLICY "messages_insert_participants" ON public.memory_messages
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    memory_id IN (
      SELECT memory_id FROM public.memory_participants
      WHERE user_id = auth.uid() AND joined_at IS NOT NULL
    )
  );
