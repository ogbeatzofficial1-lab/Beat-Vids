"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Music2,
  Clock,
  FileAudio,
  FileText,
  Clapperboard,
  Globe,
  Lock,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Song, LyricLine } from "@/lib/types/database";
import { cn, formatDuration, formatFileSize } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const STATUS_CONFIG = {
  uploading:  { label: "Uploading",   color: "text-yellow-400  bg-yellow-400/10  border-yellow-400/30" },
  processing: { label: "Processing",  color: "text-blue-400    bg-blue-400/10    border-blue-400/30"   },
  ready:      { label: "Ready",       color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"},
  error:      { label: "Error",       color: "text-red-400     bg-red-400/10     border-red-400/30"    },
};

export default function SongDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const songId = params.id;

  const [song, setSong]       = useState<Song | null>(null);
  const [lyrics, setLyrics]   = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
        const [{ data: songData }, { data: lyricsData }] = await Promise.all([
          // 1. We removed the <Song> tag from the .from() function
          supabase.from("songs").select("*").eq("id", songId).single(),
          supabase
            .from("lyrics")
            .select("*")
          .eq("songid", songId)
          .order("lineindex", { ascending: true }) as any,
      ]);
      if (cancelled) return;
      setSong((songData as Song | null) ?? null);
      setLyrics((lyricsData as LyricLine[] | null) ?? []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [songId, supabase]);

async function toggleVisibility() {
  if (!song) return;
  setToggling(true);
  const next = !song.is_public;
  
  const { error } = await supabase
    .from("songs") // Remove the <Song> generic
    .update({ is_public: next } as never) // Cast this to stop the 'never' error
    .eq("id", songId);
    
  if (!error) setSong((s) => s ? { ...s, is_public: next } : s);
  setToggling(false);
}

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-zinc-400">
        <p>Song not found.</p>
        <Link href="/songs" className="text-violet-400 underline text-sm">Back to songs</Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[song.status] ?? STATUS_CONFIG.error;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">

      {/* Back */}
      <button
        onClick={() => router.push("/songs")}
        className="mb-6 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All songs
      </button>

      {/* Hero row */}
      <div className="mb-8 flex items-start gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-violet-600/20 ring-2 ring-violet-500/20">
          {song.cover_url ? (
            <img src={song.cover_url} alt={song.title} className="h-full w-full rounded-2xl object-cover" />
          ) : (
            <Music2 className="h-9 w-9 text-violet-400" />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{song.title}</h1>
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
                status.color
              )}
            >
              {status.label}
            </span>
          </div>

          {song.artist && (
            <p className="text-sm text-zinc-400">{song.artist}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
            {song.duration_ms && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(song.duration_ms)}
              </span>
            )}
            {song.file_size && (
              <span className="flex items-center gap-1.5">
                <FileAudio className="h-3.5 w-3.5" />
                {formatFileSize(song.file_size)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              {song.is_public
                ? <><Globe className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-400">Public</span></>
                : <><Lock className="h-3.5 w-3.5" /> Private</>
              }
            </span>
          </div>
        </div>

        {/* Visibility toggle */}
        <button
          onClick={toggleVisibility}
          disabled={toggling}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
            song.is_public
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          )}
        >
          {toggling ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : song.is_public ? (
            <Globe className="h-3.5 w-3.5" />
          ) : (
            <Lock className="h-3.5 w-3.5" />
          )}
          {song.is_public ? "Make private" : "Make public"}
        </button>
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <ActionCard
          icon={<FileText className="h-5 w-5 text-violet-400" />}
          title="Edit Lyrics"
          description={lyrics.length > 0 ? `${lyrics.length} lines` : "No lyrics yet"}
          href={`/songs/${songId}/lyrics`}
          disabled={song.status !== "ready"}
        />
        <ActionCard
          icon={<Clapperboard className="h-5 w-5 text-fuchsia-400" />}
          title="Open Studio"
          description="Sync and preview"
          href={`/studio?song=${songId}`}
          disabled={song.status !== "ready" || lyrics.length === 0}
        />
        <ActionCard
          icon={<Music2 className="h-5 w-5 text-blue-400" />}
          title="Generate Video"
          description="Create music video"
          href={`/videos/new?song=${songId}`}
          disabled={song.status !== "ready" || lyrics.length === 0}
        />
      </div>

      {/* Lyrics preview */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">
            Lyrics
            {lyrics.length > 0 && (
              <span className="ml-2 text-zinc-600 font-normal">
                ({lyrics.length} lines)
              </span>
            )}
          </h2>
          {lyrics.length > 0 && (
            <Link
              href={`/songs/${songId}/lyrics`}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Edit lyrics
            </Link>
          )}
        </div>

        {lyrics.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-zinc-600">No lyrics added yet.</p>
            <Link
              href={`/songs/${songId}/lyrics`}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
            >
              Add lyrics
            </Link>
          </div>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {lyrics.slice(0, 8).map((line, i) => (
              <li
                key={line.id}
                className="flex items-center gap-3 rounded-lg bg-zinc-950/60 px-3 py-2"
              >
                <span className="w-5 text-right text-[11px] font-mono text-zinc-600">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-zinc-300">{line.text}</span>
                {line.start_ms > 0 && (
                  <span className="font-mono text-[10px] text-zinc-600">
                    {formatMs(line.start_ms)}
                  </span>
                )}
                {line.start_ms > 0 && (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                )}
              </li>
            ))}
            {lyrics.length > 8 && (
              <li className="px-3 py-1 text-xs text-zinc-600 text-center">
                +{lyrics.length - 8} more lines
              </li>
            )}
          </ol>
        )}
      </section>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  href,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  disabled?: boolean;
}) {
  const inner = (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 transition-all",
        disabled
          ? "border-zinc-800 bg-zinc-900/30 opacity-40 cursor-not-allowed"
          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900 cursor-pointer"
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
    </div>
  );

  if (disabled) return inner;
  return <Link href={href}>{inner}</Link>;
}

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const sec = (totalSec % 60).toString().padStart(2, "0");
  const centi = Math.floor((ms % 1000) / 10).toString().padStart(2, "0");
  return `${min}:${sec}.${centi}`;
}
