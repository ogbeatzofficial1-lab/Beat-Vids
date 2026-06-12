"use client";

import { useEffect, useRef, useMemo } from "react";
import { Music2 } from "lucide-react";

interface MediaPlayerProps {
  activeLine?: any;
  currentMs: number;
  durationMs: number;
  isPlaying: boolean;
  audioUrl?: string;
}

export function MediaPlayer({ activeLine, isPlaying, audioUrl }: MediaPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  // useMemo ensures the cache-bust token only updates when the actual track URL changes
  const stableAudioUrl = useMemo(() => {
    if (!audioUrl) return "";
    // If it already has query parameters, append with &, otherwise use ?
    const separator = audioUrl.includes("?") ? "&" : "?";
    return `${audioUrl}${separator}cb=${Date.now()}`;
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !stableAudioUrl) return;

    if (isPlaying) {
      // Play is asynchronous; catching errors safely prevents console crashes
      audio.play().catch(e => console.error("Playback failed:", e));
    } else {
      audio.pause();
    }
  }, [isPlaying, stableAudioUrl]);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center bg-zinc-900">
      {stableAudioUrl && (
        <audio 
          key={stableAudioUrl} 
          ref={audioRef} 
          src={stableAudioUrl} 
          crossOrigin="anonymous"
          preload="metadata"
        />
      )}
      
      <Music2 className="h-12 w-12 text-primary/70 mb-4" />
      <div className="text-2xl font-bold text-center px-4">
        {activeLine?.text || "Ready to play"}
      </div>
    </div>
  );
}
