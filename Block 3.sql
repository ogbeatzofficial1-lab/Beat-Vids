CREATE TABLE public.lyrics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id      UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  line_index   INTEGER NOT NULL,
  text         TEXT NOT NULL,
  start_ms     INTEGER NOT NULL,
  end_ms       INTEGER,
  word_timings JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT lyrics_order UNIQUE (song_id, line_index)
);

CREATE INDEX idx_lyrics_song_id  ON public.lyrics(song_id);
CREATE INDEX idx_lyrics_start_ms ON public.lyrics(song_id, start_ms);
