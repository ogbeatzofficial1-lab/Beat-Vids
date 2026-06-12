ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lyrics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_videos ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles: public read"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "profiles: owner write"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Songs: owner sees all, others only see public
CREATE POLICY "songs: owner all"
  ON public.songs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "songs: public read"
  ON public.songs FOR SELECT
  USING (is_public = TRUE);

-- Lyrics: owner or public song
CREATE POLICY "lyrics: owner or public song"
  ON public.lyrics FOR ALL
  USING (
    auth.uid() = (SELECT user_id FROM public.songs WHERE id = song_id)
    OR
    (SELECT is_public FROM public.songs WHERE id = song_id) = TRUE
  );

-- Videos: owner only
CREATE POLICY "videos: owner all"
  ON public.generated_videos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
