export type SongStatus = "uploading" | "processing" | "ready" | "error";
export type VideoStatus = "queued" | "rendering" | "completed" | "failed";
export type VideoStyle =
  | "cinematic"
  | "neon"
  | "minimal"
  | "visualizer"
  | "lyric_card";

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Song {
  id: string;
  user_id: string;
  title: string;
  artist: string | null;
  duration_ms: number | null;
  bpm: number | null;
  cover_url: string | null;
  audio_url: string;
  file_size: number | null;
  mime_type: string;
  status: SongStatus;
  is_public: boolean;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface LyricLine {
  id: string;
  song_id: string;
  line_index: number;
  text: string;
  start_ms: number;
  end_ms: number | null;
  word_timings: WordTiming[] | null;
  created_at: string;
}

export interface WordTiming {
  word: string;
  start_ms: number;
  end_ms: number;
}

export interface GeneratedVideo {
  id: string;
  song_id: string;
  user_id: string;
  style: VideoStyle;
  config: Record<string, unknown> | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_ms: number | null;
  file_size: number | null;
  status: VideoStatus;
  progress: number;
  error_message: string | null;
  render_started_at: string | null;
  render_finished_at: string | null;
  created_at: string;
  updated_at: string;
}

// Supabase generic wrapper (matches @supabase/supabase-js shape)
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      songs: { Row: Song; Insert: Partial<Song>; Update: Partial<Song> };
      lyrics: { Row: LyricLine; Insert: Partial<LyricLine>; Update: Partial<LyricLine> };
      generated_videos: { Row: GeneratedVideo; Insert: Partial<GeneratedVideo>; Update: Partial<GeneratedVideo> };
    };
  };
}
