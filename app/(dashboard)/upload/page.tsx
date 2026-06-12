"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Music2, ArrowRight, Info } from "lucide-react";
import { useAudioUpload } from "@/lib/hooks/useAudioUpload";
import { AudioDropzone, UploadStatusBar } from "@/components/songs/AudioDropzone";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function UploadPage() {
  const router = useRouter();
  const { state, upload, reset } = useAudioUpload();

  const [file, setFile]       = useState<File | null>(null);
  const [title, setTitle]     = useState("");
  const [artist, setArtist]   = useState("");
  const [is_public, setis_public] = useState(false);

  const isIdle       = state.status === "idle";
  const isWorking    = ["validating", "uploading", "processing"].includes(state.status);
  const isDone       = state.status === "ready";
  const isError      = state.status === "error";

  function handleFile(f: File) {
    reset();
    setFile(f);
    // Pre-fill title/artist from filename
    const base   = f.name.replace(/\.[^.]+$/, "");
    const parts  = base.split(/\s*[-–]\s*/);
    if (parts.length >= 2) {
      setArtist(parts[0].trim());
      setTitle(parts.slice(1).join(" - ").trim());
    } else {
      setTitle(base.trim());
      setArtist("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    await upload(file, { title: title.trim(), artist: artist.trim() });
  }

  function handleGoToStudio() {
    if (state.songId) router.push(`/songs/${state.songId}`);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-4 py-16">

      {/* ── Page Header ── */}
      <div>
        {/* Changed from violet to primary */}
        <div className="flex items-center gap-2 text-primary mb-2">
          <Music2 className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-widest">New Song</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Upload Your Audio</h1>
        <p className="mt-2 text-zinc-400">
          Upload a track and we'll prepare it for lyric syncing and video generation.
        </p>
      </div>

      {/* ── Upload Form ── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Dropzone */}
        <AudioDropzone onFile={handleFile} disabled={isWorking || isDone} />

        {/* Progress / status */}
        {state.status !== "idle" && (
          <UploadStatusBar
            status={state.status}
            progress={state.progress}
            error_message={state.errorMessage}
          />
        )}

        {/* Metadata fields — show once a file is chosen */}
        {file && !isDone && (
          <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="text-sm font-semibold text-zinc-300">Song Details</p>

            <Input
              id="title"
              label="Title"
              placeholder="Song title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isWorking}
              required
            />

            <Input
              id="artist"
              label="Artist"
              placeholder="Artist name (optional)"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              disabled={isWorking}
            />

            {/* Visibility toggle */}
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-zinc-200">Make public</span>
                <span className="text-xs text-zinc-500">
                  Others can view this song and its lyrics
                </span>
              </div>
              <button
                type="button"
                onClick={() => setis_public((v) => !v)}
                disabled={isWorking}
                // Changed focus ring and background to primary
                className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${is_public ? "bg-primary" : "bg-zinc-700"}`}
                role="switch"
                aria-checked={is_public}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200
                    ${is_public ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Error retry */}
        {isError && (
          <button
            type="button"
            onClick={reset}
            // Changed from violet to primary
            className="text-sm text-primary hover:text-primary-hover underline underline-offset-2 text-center transition-colors"
          >
            Try again
          </button>
        )}

        {/* CTA */}
        {!isDone ? (
          <Button
            type="submit"
            disabled={!file || isWorking || isDone}
            loading={isWorking}
          >
            {isWorking ? "Uploading…" : "Upload & Continue"}
          </Button>
        ) : (
          /* ── Success state ── */
          <div className="flex flex-col gap-3">
            {/* Standardized to match emerald success badges from other pages */}
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <span className="font-semibold">{title}</span> is ready. Head to the
                studio to add lyrics and timestamps.
              </span>
            </div>

            <Button type="button" onClick={handleGoToStudio}>
              Open in Studio
              <ArrowRight className="h-4 w-4" />
            </Button>

            <button
              type="button"
              onClick={() => {
                reset();
                setFile(null);
                setTitle("");
                setArtist("");
              }}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors text-center"
            >
              Upload another track
            </button>
          </div>
        )}
      </form>

      {/* ── Format tip ── */}
      {isIdle && (
        <p className="text-center text-xs text-zinc-700">
          Best results with high-quality MP3 (320kbps) or lossless WAV/FLAC.
        </p>
      )}
    </div>
  );
}