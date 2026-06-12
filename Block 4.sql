CREATE TYPE public.video_status AS ENUM (
  'queued', 'rendering', 'completed', 'failed'
);

CREATE TABLE public.generated_videos (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id            UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  style              TEXT NOT NULL DEFAULT 'cinematic',
  config             JSONB,
  video_url          TEXT,
  thumbnail_url      TEXT,
  duration_ms        INTEGER,
  file_size          BIGINT,
  status             public.video_status NOT NULL DEFAULT 'queued',
  progress           SMALLINT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  error_message      TEXT,
  render_started_at  TIMESTAMPTZ,
  render_finished_at TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER generated_videos_updated_at
  BEFORE UPDATE ON public.generated_videos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_videos_user_id ON public.generated_videos(user_id);
CREATE INDEX idx_videos_song_id ON public.generated_videos(song_id);
CREATE INDEX idx_videos_status  ON public.generated_videos(status);
