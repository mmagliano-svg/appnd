-- One like per user per memory (simple reaction, no emoji variants for MVP)
CREATE TABLE IF NOT EXISTS public.memory_likes (
  memory_id  uuid NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (memory_id, user_id)
);

ALTER TABLE public.memory_likes ENABLE ROW LEVEL SECURITY;

-- Read: only participants of the memory can see who liked
CREATE POLICY "likes_select_participants" ON public.memory_likes
  FOR SELECT USING (
    memory_id IN (
      SELECT memory_id FROM public.memory_participants
      WHERE user_id = auth.uid() AND joined_at IS NOT NULL
    )
  );

-- Insert / Delete: only the current user can manage their own like
CREATE POLICY "likes_insert_own" ON public.memory_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "likes_delete_own" ON public.memory_likes
  FOR DELETE USING (user_id = auth.uid());
