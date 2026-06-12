"use client";

import { useRef, useEffect, useCallback } from "react";
import {
  Play, Pause, SkipBack, SkipForward,
  ZoomIn, ZoomOut, Volume2, VolumeX, Scissors,
} from "lucide-react";
import type { LyricLine } from "@/app/(dashboard)/studio/page";

interface MasterTimelineProps {
  currentMs: number;
  durationMs: number;
  isPlaying: boolean;
  volume: number;
  zoom: number;
  lyrics: LyricLine[];
  onPlayPause: () => void;
  onSeek: (ms: number) => void;
  onSkip: (dir: "forward" | "back") => void;
  onVolumeChange: (v: number) => void;
  onZoom: (dir: "in" | "out") => void;
}

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const sec = (totalSec % 60).toString().padStart(2, "0");
  const centisec = Math.floor((ms % 1000) / 10).toString().padStart(2, "0");
  return `${min}:${sec}.${centisec}`;
}

export function MasterTimeline({
  currentMs,
  durationMs,
  isPlaying,
  volume,
  zoom,
  lyrics,
  onPlayPause,
  onSeek,
  onSkip,
  onVolumeChange,
  onZoom,
}: MasterTimelineProps) {
  const waveformRef  = useRef<HTMLCanvasElement>(null);
  const timelineRef  = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const isDragging   = useRef(false);

  const progress = currentMs / durationMs;

  // ── Waveform Canvas ──────────────────────────────────────
  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const totalBars = Math.floor(width / 4) * zoom;
      const barW = width / totalBars;
      const mid = height / 2;

      for (let i = 0; i < totalBars; i++) {
        const x = i * barW;
        const normalizedX = i / totalBars;
        const seed =
          Math.sin(i * 1.3) * 0.3 +
          Math.sin(i * 0.4) * 0.25 +
          Math.sin(i * 2.8) * 0.15 +
          Math.cos(i * 0.9) * 0.2;
        const amplitude = (Math.abs(seed) + 0.1) * mid * 0.85;
        const isPast = normalizedX < progress;

        // Top half
        const topGrad = ctx.createLinearGradient(x, mid - amplitude, x, mid);
        if (isPast) {
          // 💥 Changed Canvas paint colors to OG BEATZ Orange 💥
          topGrad.addColorStop(0, "rgba(249, 115, 22, 1)");
          topGrad.addColorStop(1, "rgba(234, 88, 12, 0.5)");
        } else {
          topGrad.addColorStop(0, "rgba(82, 82, 91, 0.6)");
          topGrad.addColorStop(1, "rgba(63, 63, 70, 0.3)");
        }
        ctx.fillStyle = topGrad;
        ctx.beginPath();
        ctx.roundRect(x + 0.5, mid - amplitude, Math.max(barW - 1.5, 1), amplitude, 1);
        ctx.fill();

        // Bottom half (mirror, dimmer)
        const botGrad = ctx.createLinearGradient(x, mid, x, mid + amplitude * 0.6);
        if (isPast) {
          // 💥 Changed Canvas paint colors to OG BEATZ Orange 💥
          botGrad.addColorStop(0, "rgba(234, 88, 12, 0.4)");
          botGrad.addColorStop(1, "rgba(194, 65, 12, 0.1)");
        } else {
          botGrad.addColorStop(0, "rgba(63, 63, 70, 0.2)");
          botGrad.addColorStop(1, "rgba(39, 39, 42, 0.1)");
        }
        ctx.fillStyle = botGrad;
        ctx.beginPath();
        ctx.roundRect(x + 0.5, mid, Math.max(barW - 1.5, 1), amplitude * 0.6, 1);
        ctx.fill();
      }

      // Playhead line (Changed to orange)
      const playheadX = progress * width;
      ctx.strokeStyle = "rgba(249, 115, 22, 1)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(249, 115, 22, 0.8)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Playhead diamond handle (Changed to orange)
      ctx.fillStyle = "rgba(249, 115, 22, 1)";
      ctx.beginPath();
      ctx.arc(playheadX, height / 2, 5, 0, Math.PI * 2);
      ctx.fill();

      // Lyric markers (Changed from fuchsia to orange)
      for (const line of lyrics) {
        const markerX = (line.start_ms / durationMs) * width;
        ctx.fillStyle = "rgba(249, 115, 22, 0.7)";
        ctx.fillRect(markerX - 1, 0, 2, 6);
        ctx.fillRect(markerX - 1, height - 6, 2, 6);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [currentMs, durationMs, progress, zoom, lyrics]);

  // ── Seek by clicking / dragging on waveform ──────────────
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      onSeek(Math.round(ratio * durationMs));
    },
    [durationMs, onSeek]
  );

  const handleMouseDown = () => { isDragging.current = true; };
  const handleMouseUp   = () => { isDragging.current = false; };
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(Math.round(ratio * durationMs));
    },
    [durationMs, onSeek]
  );

  // ── Time ruler labels ─────────────────────────────────────
  const rulerMarks = Array.from({ length: 9 }, (_, i) =>
    Math.round((i / 8) * durationMs)
  );

  return (
    <div className="flex flex-col bg-zinc-950 select-none">

      {/* ── Controls Row ── */}
      <div className="flex items-center gap-4 border-b border-zinc-800 px-6 py-3">

        {/* Transport Controls */}
        <div className="flex items-center gap-1">
          <IconBtn onClick={() => onSkip("back")} title="Skip back 5s">
            <SkipBack className="h-4 w-4" />
          </IconBtn>

          {/* Changed play/pause button to primary */}
          <button
            onClick={onPlayPause}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary-hover active:bg-primary/80 transition-colors"
          >
            {isPlaying
              ? <Pause className="h-4 w-4 fill-white" />
              : <Play  className="h-4 w-4 fill-white translate-x-px" />
            }
          </button>

          <IconBtn onClick={() => onSkip("forward")} title="Skip forward 5s">
            <SkipForward className="h-4 w-4" />
          </IconBtn>
        </div>

        {/* Current time (Changed text to primary) */}
        <div className="font-mono text-sm tabular-nums text-primary bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1 min-w-[7rem] text-center">
          {formatMs(currentMs)}
        </div>

        {/* Progress bar (thin scrubber) */}
        <div className="flex flex-1 items-center gap-2">
          <span className="font-mono text-[10px] text-zinc-600 shrink-0">
            {formatMs(0)}
          </span>
          <div
            className="relative flex-1 h-1.5 rounded-full bg-zinc-800 cursor-pointer group"
            onClick={handleTimelineClick}
          >
            <div
              // Changed fill to primary
              className="h-full rounded-full bg-primary transition-none"
              style={{ width: `${progress * 100}%` }}
            />
            <div
              // Changed handle to primary
              className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-primary-hover shadow-lg border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress * 100}% - 7px)` }}
            />
          </div>
          <span className="font-mono text-[10px] text-zinc-600 shrink-0">
            {formatMs(durationMs)}
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border-l border-zinc-800 pl-4">
          <IconBtn onClick={() => onZoom("out")} title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </IconBtn>
          <span className="w-10 text-center font-mono text-xs text-zinc-400">
            {zoom.toFixed(2)}x
          </span>
          <IconBtn onClick={() => onZoom("in")} title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </IconBtn>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
          <button
            onClick={() => onVolumeChange(volume > 0 ? 0 : 0.8)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {volume === 0
              ? <VolumeX className="h-4 w-4" />
              : <Volume2 className="h-4 w-4" />
            }
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            // Changed volume slider to primary
            className="h-1 w-20 cursor-pointer accent-primary"
          />
        </div>

        {/* Scissors tool */}
        <div className="border-l border-zinc-800 pl-4">
          <IconBtn title="Split clip at playhead">
            <Scissors className="h-4 w-4" />
          </IconBtn>
        </div>
      </div>

      {/* ── Waveform Track ── */}
      <div className="flex" ref={timelineRef}>
        {/* Track label gutter */}
        <div className="flex w-28 shrink-0 flex-col justify-center border-r border-zinc-800 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Audio
          </span>
          <span className="mt-0.5 text-[9px] text-zinc-700 truncate">
            Track 1
          </span>
        </div>

        {/* Waveform + ruler */}
        <div className="flex flex-1 flex-col">
          {/* Time ruler */}
          <div className="flex items-end h-4 border-b border-zinc-800/60 relative">
            {rulerMarks.map((ms) => (
              <div
                key={ms}
                className="absolute bottom-0 flex flex-col items-center"
                style={{ left: `${(ms / durationMs) * 100}%` }}
              >
                <span className="text-[8px] font-mono text-zinc-600 leading-none mb-0.5">
                  {formatMs(ms)}
                </span>
                <div className="h-1.5 w-px bg-zinc-700" />
              </div>
            ))}
          </div>

          {/* Waveform canvas */}
          <div
            className="relative h-20 cursor-crosshair"
            onClick={handleTimelineClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={waveformRef}
              className="h-full w-full"
              height={80}
            />
          </div>

          {/* Lyric clip lane */}
          <div className="relative h-6 border-t border-zinc-800/60 bg-zinc-900/50">
            {lyrics.map((line) => {
              const left  = (line.start_ms / durationMs) * 100;
              const end = line.end_ms !== null && line.end_ms !== undefined ? line.end_ms : durationMs;
              const width = ((end - line.start_ms) / durationMs) * 100;
              return (
                <div
                  key={line.id}
                  title={line.text}
                  // Changed lyric blocks from fuchsia to primary/orange
                  className="absolute top-1 h-4 rounded-sm bg-primary/30 border border-primary/40 overflow-hidden"
                  style={{ left: `${left}%`, width: `${width}%` }}
                >
                  <span className="px-1 text-[8px] text-orange-300 whitespace-nowrap leading-4 block truncate">
                    {line.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reusable Icon Button ──────────────────────────────────────
function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
    >
      {children}
    </button>
  );
}