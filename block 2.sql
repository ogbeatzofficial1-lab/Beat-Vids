CREATE TYPE public.song_status AS ENUM (
  'uploading', 'processing', 'ready', 'error'
);

CREATE TABLE public.songs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  artist       TEXT,
  duration_ms  INTEGER,
  bpm          NUMERIC(5, 2),
  cover_url    TEXT,
  audio_url    TEXT NOT NULL,
  file_size    BIGINT,
  mime_type    TEXT DEFAULT 'audio/mpeg',
  status       public.song_status NOT NULL DEFAULT 'uploading',
  is_public    BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER songs_updated_at
  BEFORE UPDATE ON public.songs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_songs_user_id ON public.songs(user_id);
CREATE INDEX idx_songs_status  ON public.songs(status);
