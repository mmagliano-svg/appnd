-- Shared stories: monthly stories that users can publish and share
CREATE TABLE IF NOT EXISTS public.shared_stories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       text        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(20), 'hex'),
  user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year        int         NOT NULL,
  month       int         NOT NULL,
  memory_ids  uuid[]      NOT NULL DEFAULT '{}',
  title       text        NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, year, month)
);

ALTER TABLE public.shared_stories ENABLE ROW LEVEL SECURITY;

-- Owner can do everything with their own stories
CREATE POLICY "stories_owner_all" ON public.shared_stories
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Note: the public story page uses the service-role key, so no public SELECT policy needed.
