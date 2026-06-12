"use client";

import { useEffect, useRef } from "react";
import { Stamp, Clock } from "lucide-react";
import type { LyricLine } from "@/app/(dashboard)/studio/page";

interface LyricStudioProps {
  lyrics: LyricLine[];
  activeLineId: number;
  currentMs: number;
  onStamp: (lineId: string) => void;
}

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const sec = (totalSec % 60).toString().padStart(2, "0");
  const centisec = Math.floor((ms % 1000) / 10).toString().padStart(2, "0");
  return `${min}:${sec}.${centisec}`;
}

export function LyricStudio({
  lyrics,
  activeLineId,
  currentMs,
  onStamp,
}: LyricStudioProps) {
  const activeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active lyric line
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeLineId]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-zinc-900">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* Changed clock icon to primary */}
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-zinc-200">Lyric Timing Studio</span>
        </div>
        <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
          {lyrics.length} lines
        </span>
      </div>

      {/* ── Column Labels ── */}
      <div className="flex items-center gap-3 border-b border-zinc-800/60 px-5 py-2 shrink-0">
        <span className="w-6 text-center text-[10px] font-medium uppercase tracking-widest text-zinc-600">#</span>
        <span className="flex-1 text-[10px] font-medium uppercase tracking-widest text-zinc-600">Lyric</span>
        <span className="w-24 text-center text-[10px] font-medium uppercase tracking-widest text-zinc-600">Timestamp</span>
        <span className="w-16 text-center text-[10px] font-medium uppercase tracking-widest text-zinc-600">Stamp</span>
      </div>

      {/* ── Lyric Lines ── */}
      <div className="flex-1 overflow-y-auto">
        {lyrics.map((line, idx) => {
          const isActive = idx === activeLineId;
          const isPast   = line.end_ms !== null && line.end_ms <= currentMs;

          return (
            <div
              key={line.id}
              ref={isActive ? activeRef : null}
              className={`
                group flex items-center gap-3 px-5 py-3 border-b border-zinc-800/40
                transition-all duration-200 cursor-default
                ${isActive
                  // Changed active line highlight to primary
                  ? "bg-primary/10 border-l-2 border-l-primary"
                  : isPast
                    ? "opacity-40 hover:opacity-60"
                    : "hover:bg-zinc-800/40"
                }
              `}
            >
              {/* Line number */}
              <span
                className={`w-6 text-center text-xs font-mono shrink-0 ${
                  // Changed active line number to primary
                  isActive ? "text-primary" : "text-zinc-600"
                }`}
              >
                {idx + 1}
              </span>

              {/* Lyric text */}
              <p
                className={`flex-1 text-sm leading-relaxed transition-colors ${
                  isActive
                    ? "text-white font-semibold"
                    : "text-zinc-400"
                }`}
              >
                {line.text}
              </p>

              {/* Timestamp display */}
              <div
                className={`
                  w-24 text-center font-mono text-xs rounded-md px-2 py-1 shrink-0
                  transition-colors border
                  ${isActive
                    // Changed active timestamp badge to primary
                    ? "bg-primary/20 border-primary/40 text-primary-hover"
                    : "bg-zinc-800/60 border-zinc-700/40 text-zinc-500"
                  }
                `}
              >
                {formatMs(line.start_ms)}
              </div>

              {/* Stamp button */}
              <button
                onClick={() => onStamp(line.id)}
                title="Stamp current playhead time to this line"
                className={`
                  flex w-16 items-center justify-center gap-1 rounded-md py-1 text-xs font-medium shrink-0
                  transition-all border
                  ${isActive
                    // Changed active stamp button to primary
                    ? "bg-primary border-primary text-white hover:bg-primary-hover"
                    : "bg-zinc-800 border-zinc-700 text-zinc-500 opacity-0 group-hover:opacity-100 hover:border-primary hover:text-primary"
                  }
                `}
              >
                <Stamp className="h-3 w-3" />
                Set
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Footer: current time hint ── */}
      <div className="border-t border-zinc-800 px-5 py-2.5 shrink-0 flex items-center gap-2">
        {/* Changed pulsing dot to primary */}
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs text-zinc-500">
          Playhead at{" "}
          {/* Changed playhead time to primary */}
          <span className="font-mono text-primary">{formatMs(currentMs)}</span>
          {" "}— click{" "}
          <span className="text-zinc-300 font-medium">Set</span>{" "}
          on any line to stamp it
        </span>
      </div>
    </div>
  );
}