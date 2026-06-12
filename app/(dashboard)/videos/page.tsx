"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Video,
  Plus,
  Play,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clapperboard,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { GeneratedVideo } from "@/lib/types/database";
import { cn } from "@/lib/utils";

// ── Constants ────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ReactNode;
  }
> = {
  queued: {
    label: "Queued",
    color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/30",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  rendering: {
    label: "Rendering",
    // Changed from blue to primary
    color: "text-primary bg-primary/10 border-primary/30",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
  completed: {
    label: "Complete",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  failed: {
    label: "Failed",
    color: "text-red-400 bg-red-400/10 border-red-400/30",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

const STYLE_LABELS: Record<string, string> = {
  cinematic:  "Cinematic",
  neon:       "Neon",
  minimal:    "Minimal",
  visualizer: "Visualizer",
  lyriccard:  "Lyric Card",
};

// ── Page ─────────────────────────────────────────────────────

export default function VideosPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [videos, setVideos]     = useState<GeneratedVideo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Load ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("generated_videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setError(error.message);
      } else {
        setVideos((data as GeneratedVideo[]) ?? []);
      }

      setLoading(false);
    }

    load();

    // Poll every 5 s if any video is still rendering / queued
    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from("generated_videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled || !data) return;

      const updated = data as GeneratedVideo[];
      setVideos(updated);

      const stillActive = updated.some(
        (v) => v.status === "rendering" || v.status === "queued"
      );
      if (!stillActive) clearInterval(pollInterval);
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [supabase]);

  // ── Delete ──────────────────────────────────────────────────
  async function handleDelete(videoId: string) {
    setMenuOpen(null);
    setDeleting(videoId);

    const { error } = await supabase
      .from("generated_videos")
      .delete()
      .eq("id", videoId);

    if (!error) {
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    }

    setDeleting(null);
  }

  // ── Close menu on outside click ──────────────────────────────
  useEffect(() => {
    function handleClick() {
      setMenuOpen(null);
    }
    if (menuOpen) {
      document.addEventListener("click", handleClick);
    }
    return () => document.removeEventListener("click", handleClick);
  }, [menuOpen]);

  // ── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {/* Changed from violet to primary */}
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Videos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {videos.length}{" "}
            {videos.length === 1 ? "video" : "videos"} generated
          </p>
        </div>
        <Link
          href="/songs"
          // Changed background to primary
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Video
        </Link>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {videos.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
            <Video className="h-7 w-7 text-zinc-500" />
          </div>
          <div>
            <p className="font-semibold text-zinc-300">No videos yet</p>
            <p className="mt-1 text-sm text-zinc-600">
              Pick a song and generate your first music video.
            </p>
          </div>
          <Link
            href="/songs"
            // Changed background to primary
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            Choose a song
          </Link>
        </div>
      )}

      {/* Video grid */}
      {videos.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => {
            const cfg   = STATUS_CONFIG[video.status] ?? STATUS_CONFIG.failed;
            const style = STYLE_LABELS[video.style] ?? video.style;
            const isDeleting = deleting === video.id;

            return (
              <li
                key={video.id}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 transition-all",
                  isDeleting
                    ? "opacity-40 pointer-events-none"
                    : "hover:border-zinc-700"
                )}
              >
                {/* Thumbnail / preview area */}
                <div
                  className="relative flex h-44 cursor-pointer items-center justify-center overflow-hidden bg-zinc-950"
                  onClick={() => router.push(`/videos/${video.id}`)}
                >
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={`${style} thumbnail`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-700">
                      <Clapperboard className="h-10 w-10" />
                      <span className="text-xs">No preview</span>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent" />

                  {/* Play button overlay (completed only) */}
                  {video.status === "completed" && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      {/* Changed to primary */}
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/50">
                        <Play className="h-5 w-5 translate-x-px fill-white text-white" />
                      </div>
                    </div>
                  )}

                  {/* Rendering progress bar */}
                  {video.status === "rendering" && (
                    <div className="absolute bottom-0 left-0 right-0">
                      <div className="h-1 w-full bg-zinc-800">
                        <div
                          // Changed to primary
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${video.progress ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status badge (top left) */}
                  <div className="absolute left-3 top-3">
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm",
                        cfg.color
                      )}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </div>

                  {/* Kebab menu (top right) */}
                  <div
                    className="absolute right-2 top-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() =>
                        setMenuOpen(menuOpen === video.id ? null : video.id)
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-zinc-400 opacity-0 backdrop-blur-sm transition-opacity hover:text-white group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {menuOpen === video.id && (
                      <div className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
                        <button
                          onClick={() => handleDelete(video.id)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-col gap-3 p-4">

                  {/* Style + date */}
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">
                      {style} Style
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-600">
                      {new Date(video.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Rendering progress label */}
                  {video.status === "rendering" && (
                    // Changed text to primary
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Rendering… {video.progress ?? 0}%
                    </div>
                  )}

                  {/* Error message */}
                  {video.status === "failed" && video.error_message && (
                    <p className="text-xs text-red-400 line-clamp-2">
                      {video.error_message}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {video.status === "completed" && video.video_url && (
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        // Changed background to primary
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition-colors"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" />
                        Watch
                      </a>
                    )}

                    <button
                      onClick={() => router.push(`/videos/${video.id}`)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors",
                        video.status === "completed" && video.video_url
                          ? "w-auto"
                          : "flex-1"
                      )}
                    >
                      Details
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}