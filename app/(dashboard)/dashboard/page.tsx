"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Music2,
  Video,
  Upload,
  ArrowRight,
  Loader2,
  Clock,
  CheckCircle2,
  Clapperboard,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Song, GeneratedVideo } from "@/lib/types/database";
import { cn, formatDuration } from "@/lib/utils";

export default function DashboardPage() {
  const supabase = createClient();

  const [songs, setSongs]     = useState<Song[]>([]);
  const [videos, setVideos]   = useState<GeneratedVideo[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { data: songsData }, { data: videosData }] =
        await Promise.all([
          supabase.from("profiles").select("displayname, username").eq("id", user.id).single(),
          supabase.from("songs").select("*").order("created_at", { ascending: false }).limit(4),
          supabase.from("generated_videos").select("*").order("created_at", { ascending: false }).limit(4),
        ]);

      setUsername((profile as any)?.displayname ?? (profile as any)?.username ?? null);
      setSongs((songsData as Song[]) ?? []);
      setVideos((videosData as GeneratedVideo[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {/* Changed from violet to primary */}
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const readySongs    = songs.filter((s) => s.status === "ready").length;
  const doneVideos    = videos.filter((v) => v.status === "completed").length;
  const renderingVideos = videos.filter((v) => v.status === "rendering").length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">

      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {username ? `Hey, ${username} 👋` : "Welcome back 👋"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Here&apos;s what&apos;s happening with your BeatzVid projects.
        </p>
      </div>

      {/* Stat cards - Updated to use primary brand colors */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Songs"         value={songs.length}     color="primary" />
        <StatCard label="Ready"         value={readySongs}       color="emerald" />
        <StatCard label="Videos done"   value={doneVideos}       color="primary" />
        <StatCard label="Rendering"     value={renderingVideos}  color="zinc" />
      </div>

      {/* Quick actions - Replaced violet/fuchsia/blue with primary */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <QuickAction
          href="/upload"
          icon={<Upload className="h-5 w-5 text-primary" />}
          title="Upload Song"
          description="Add a new audio track"
        />
        <QuickAction
          href="/songs"
          icon={<Music2 className="h-5 w-5 text-primary" />}
          title="My Songs"
          description="Manage your tracks"
        />
        <QuickAction
          href="/videos"
          icon={<Video className="h-5 w-5 text-primary" />}
          title="My Videos"
          description="View generated videos"
        />
      </div>

      {/* Recent songs */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Recent Songs
          </h2>
          <Link
            href="/songs"
            className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {songs.length === 0 ? (
          <EmptySlot
            icon={<Music2 className="h-6 w-6 text-zinc-600" />}
            message="No songs yet — upload your first track."
            href="/upload"
            cta="Upload now"
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {songs.map((song) => (
              <li key={song.id}>
                <Link
                  href={`/songs/${song.id}`}
                  className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 hover:border-zinc-700 hover:bg-zinc-900 transition-all"
                >
                  {/* Changed background and icon to primary */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                    <Music2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {song.title}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {song.artist ?? "Unknown artist"}
                      {song.duration_ms ? ` · ${formatDuration(song.duration_ms)}` : ""}
                    </p>
                  </div>
                  <StatusDot status={song.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent videos */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Recent Videos
          </h2>
          <Link
            href="/videos"
            className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {videos.length === 0 ? (
          <EmptySlot
            icon={<Video className="h-6 w-6 text-zinc-600" />}
            message="No videos generated yet."
            href="/songs"
            cta="Pick a song"
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {videos.map((video) => (
              <li key={video.id}>
                <Link
                  href={`/videos/${video.id}`}
                  className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 hover:border-zinc-700 hover:bg-zinc-900 transition-all"
                >
                  {/* Changed background and icon to primary */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                    <Clapperboard className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100 capitalize">
                      {video.style} style
                    </p>
                    <p className="text-xs text-zinc-600 capitalize">
                      {video.status}
                      {video.status === "rendering" ? ` · ${video.progress ?? 0}%` : ""}
                    </p>
                  </div>
                  {video.status === "completed" && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                  {video.status === "rendering" && (
                    <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "primary" | "emerald" | "zinc";
}) {
  const colors = {
    primary: "bg-primary/10  border-primary/20  text-primary",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    zinc:    "bg-zinc-800/50    border-zinc-700/50    text-zinc-300",
  };
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl border p-4",
        colors[color]
      )}
    >
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs font-medium uppercase tracking-widest opacity-70">
        {label}
      </span>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-primary/50 hover:bg-zinc-900 transition-all group"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 text-zinc-600 group-hover:text-primary transition-colors" />
    </Link>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ready:      "bg-emerald-400",
    processing: "bg-primary animate-pulse",
    uploading:  "bg-yellow-400 animate-pulse",
    error:      "bg-red-400",
  };
  return (
    <span
      className={cn("h-2 w-2 rounded-full shrink-0", colors[status] ?? "bg-zinc-600")}
    />
  );
}

function EmptySlot({
  icon,
  message,
  href,
  cta,
}: {
  icon: React.ReactNode;
  message: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 py-10 text-center">
      {icon}
      <p className="text-sm text-zinc-600">{message}</p>
      <Link
        href={href}
        className="text-xs text-primary hover:text-primary-hover underline underline-offset-2 transition-colors"
      >
        {cta}
      </Link>
    </div>
  );
}