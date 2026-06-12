"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Music2,
  Plus,
  Clock,
  MoreVertical,
  Trash2,
  FileText,
  Clapperboard,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Song } from "@/lib/types/database";
import { cn, formatDuration, formatFileSize } from "@/lib/utils";

const STATUS_CONFIG = {
  uploading:  { label: "Uploading",  color: "text-yellow-400  bg-yellow-400/10  border-yellow-400/30" },
  processing: { label: "Processing", color: "text-primary     bg-primary/10     border-primary/30"   },
  ready:      { label: "Ready",      color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"},
  error:      { label: "Error",      color: "text-red-400     bg-red-400/10     border-red-400/30"    },
};

export default function SongsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [songs, setSongs]       = useState<Song[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) { setError(error.message); }
      else       { setSongs((data as Song[]) ?? []); }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleDelete(songId: string) {
    setMenuOpen(null);
    const { error } = await supabase.from("songs").delete().eq("id", songId);
    if (!error) setSongs((prev) => prev.filter((s) => s.id !== songId));
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Songs</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {songs.length} {songs.length === 1 ? "track" : "tracks"} uploaded
          </p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Upload Song
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {songs.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
            <Music2 className="h-7 w-7 text-zinc-500" />
          </div>
          <div>
            <p className="font-semibold text-zinc-300">No songs yet</p>
            <p className="mt-1 text-sm text-zinc-600">
              Upload your first track to get started.
            </p>
          </div>
          <Link
            href="/upload"
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            Upload Song
          </Link>
        </div>
      )}

      {/* Songs grid */}
      {songs.length > 0 && (
        <ul className="flex flex-col gap-3">
          {songs.map((song) => {
            const status = STATUS_CONFIG[song.status] ?? STATUS_CONFIG.error;

            return (
              <li
                key={song.id}
                className="group relative flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 hover:border-zinc-700 hover:bg-zinc-900 transition-all"
              >
                {/* Album art / placeholder */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/20">
                  {song.cover_url ? (
                    <img
                      src={song.cover_url}
                      alt={song.title}
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <Music2 className="h-6 w-6 text-primary" />
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                  <p className="truncate font-semibold text-white">{song.title}</p>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    {song.artist && <span>{song.artist}</span>}
                    {song.duration_ms && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(song.duration_ms)}
                        </span>
                      </>
                    )}
                    {song.file_size && (
                      <>
                        <span>·</span>
                        <span>{formatFileSize(song.file_size)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <span
                  className={cn(
                    "hidden sm:inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
                    status.color
                  )}
                >
                  {status.label}
                </span>

                {/* Action buttons (show on hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ActionBtn
                    icon={<FileText className="h-3.5 w-3.5" />}
                    label="Edit lyrics"
                    onClick={() => router.push(`/songs/${song.id}/lyrics`)}
                    disabled={song.status !== "ready"}
                  />
                  <ActionBtn
                    icon={<Clapperboard className="h-3.5 w-3.5" />}
                    label="Open studio"
                    onClick={() => router.push(`/studio?song=${song.id}`)}
                    disabled={song.status !== "ready"}
                  />
                </div>

                {/* Kebab menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === song.id ? null : song.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {menuOpen === song.id && (
                    <div className="absolute right-0 top-9 z-10 w-40 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
                      <button
                        onClick={() => handleDelete(song.id)}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800 rounded-xl transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete song
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-[11px] text-zinc-300 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}