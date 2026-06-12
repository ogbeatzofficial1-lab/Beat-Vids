"use client";

import { useEffect, useState, useRef, Suspense } from "react"; // <-- Added Suspense
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MediaPlayer } from "@/components/studio/MediaPlayer";
import { LyricStudio } from "@/components/studio/LyricStudio";
import { MasterTimeline } from "@/components/studio/MasterTimeline";

export interface LyricLine {
  id: string;
  song_id: string;
  line_index: number;
  text: string;
  start_ms: number;
  end_ms: number | null;
}

export interface SongData {
  id: string;
  title: string;
  audio_url: string;
  duration_ms: number;
  lyrics: LyricLine[];
}

// 1. Rename the main layout component to StudioContent
function StudioContent() {
  const searchParams = useSearchParams();
  const songId = searchParams.get("song");
  const supabase = createClient();

  const [songData, setSongData] = useState<SongData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function loadSong() {
      if (!songId) return;
      setLoading(true);

      const [songResult, lyricsResult] = await Promise.all([
        supabase.from("songs").select("*").eq("id", songId).single(),
        supabase.from("lyrics").select("*").eq("song_id", songId).order("line_index")
      ]);

      const songDbData = songResult.data as any;
      const lyricsDbData = lyricsResult.data as any[] | null;

      if (songDbData) {
        const { data: urlData } = supabase.storage
          .from("audio")
          .getPublicUrl(songDbData.audio_url);

        setSongData({
          id: songDbData.id,
          title: songDbData.title || "Untitled",
          audio_url: urlData?.publicUrl || "",
          duration_ms: songDbData.duration_ms || 300000,
          lyrics: (lyricsDbData || []).map((l) => ({
            id: l.id,
            song_id: l.song_id,
            line_index: l.line_index,
            text: l.text,
            start_ms: l.start_ms,
            end_ms: l.end_ms,
          }))
        });
      }
      setLoading(false);
    }
    loadSong();
  }, [songId, supabase]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => setCurrentMs((p) => p + 50), 50);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  if (loading) return <div className="p-10 text-white">Loading...</div>;
  if (!songData) return <div className="p-10 text-white">Song not found.</div>;

  const activeLineId = songData.lyrics.findIndex((l) => {
    const end = l.end_ms !== null && l.end_ms !== undefined ? l.end_ms : Infinity;
    return currentMs >= l.start_ms && currentMs < end;
  });

  const handleStamp = async (lineId: string) => {
    if (!songData) return;

    const updatedLyrics = songData.lyrics.map((l) => {
      if (l.id === lineId) {
        return { ...l, start_ms: currentMs };
      }
      return l;
    });

    const sorted = [...updatedLyrics].sort((a, b) => a.start_ms - b.start_ms);
    const withEndMs = sorted.map((l, idx) => ({
      ...l,
      line_index: idx,
      end_ms: sorted[idx + 1]?.start_ms ?? null,
    }));

    setSongData({
      ...songData,
      lyrics: withEndMs,
    });

    const targetLine = withEndMs.find((l) => l.id === lineId);
    if (targetLine) {
      await (supabase
        .from("lyrics") as any)
        .update({
          start_ms: targetLine.start_ms,
          end_ms: targetLine.end_ms,
          line_index: targetLine.line_index,
        })
        .eq("id", lineId);
    }

    const prevLine = withEndMs.find((l) => l.line_index === (targetLine?.line_index ?? 0) - 1);
    if (prevLine) {
      await (supabase
        .from("lyrics") as any)
        .update({ end_ms: prevLine.end_ms })
        .eq("id", prevLine.id);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-white overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <MediaPlayer 
            activeLine={songData.lyrics[activeLineId] || null} 
            currentMs={currentMs} 
            durationMs={songData.duration_ms} 
            isPlaying={isPlaying} 
            audioUrl={songData.audio_url} 
        />
        <LyricStudio 
            lyrics={songData.lyrics} 
            activeLineId={activeLineId} 
            currentMs={currentMs} 
            onStamp={handleStamp} 
        />
      </div>
      <MasterTimeline
        currentMs={currentMs}
        durationMs={songData.duration_ms}
        isPlaying={isPlaying}
        lyrics={songData.lyrics}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onSeek={setCurrentMs}
        onSkip={() => {}}
        onVolumeChange={() => {}}
        onZoom={() => {}}
        volume={0.8}
        zoom={1}
      />
    </div>
  );
}

// 2. Export a default wrapper component that sets up the required Suspense boundary
export default function StudioPage() {
  return (
    <Suspense fallback={<div className="p-10 text-white">Loading Studio...</div>}>
      <StudioContent />
    </Suspense>
  );
}
