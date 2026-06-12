"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SongStatus } from "@/lib/types/database";

export interface UploadState {
  status: "idle" | "validating" | "uploading" | "processing" | "ready" | "error";
  progress: number;       // 0–100
  errorMessage: string | null;
  songId: string | null;
}

interface AudioMeta {
  title: string;
  artist: string;
  duration_ms: number;
  file_size: number;
  mime_type: string;
}

const ALLOWED_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/aac"];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// ── Read audio duration via HTMLAudioElement ──────────────────
function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(audio.duration * 1000)); // → ms
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read audio metadata."));
    };
    audio.src = url;
  });
}

// ── Parse "Artist - Title" from filename ─────────────────────
function parseFilename(filename: string): { title: string; artist: string } {
  const base = filename.replace(/\.[^.]+$/, ""); // strip extension
  const parts = base.split(/\s*[-–]\s*/);
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
  }
  return { title: base.trim(), artist: "" };
}

export function useAudioUpload() {
  const supabase = createClient();

  const [state, setState] = useState<UploadState>({
    status: "idle",
    progress: 0,
    errorMessage: null,
    songId: null,
  });

  const reset = useCallback(() => {
    setState({ status: "idle", progress: 0, errorMessage: null, songId: null });
  }, []);

  const upload = useCallback(
    async (file: File, overrides?: Partial<AudioMeta>) => {
      // ── 1. Validate ───────────────────────────────────────
      setState({ status: "validating", progress: 0, errorMessage: null, songId: null });

      if (!ALLOWED_TYPES.includes(file.type)) {
        setState({
          status: "error",
          progress: 0,
          errorMessage: `Unsupported format: ${file.type}. Use MP3, WAV, OGG, FLAC, or AAC.`,
          songId: null,
        });
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        setState({
          status: "error",
          progress: 0,
          errorMessage: `File too large (${(file.size / 1_048_576).toFixed(1)} MB). Max is 50 MB.`,
          songId: null,
        });
        return;
      }

      let duration_ms = 0;
      try {
        duration_ms = await getAudioDuration(file);
      } catch {
        // Non-fatal — we store 0 and update later
      }

      const { title, artist } = parseFilename(file.name);
      const meta: AudioMeta = {
        title:     overrides?.title    ?? title,
        artist:    overrides?.artist   ?? artist,
        duration_ms: overrides?.duration_ms ?? duration_ms,
        file_size: file.size,
        mime_type: file.type,
      };

      // ── 2. Auth check ─────────────────────────────────────
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState({
          status: "error", progress: 0,
          errorMessage: "You must be signed in to upload.",
          songId: null,
        });
        return;
      }

      // ── 3. Insert song row (status = uploading) ───────────
      setState((s) => ({ ...s, status: "uploading", progress: 5 }));

      const storagePath = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

      // 💥 Ultimate VIP Pass applied directly to the query builder here
      const { data: songRow, error: insertError } = await (supabase.from("songs") as any)
        .insert({
          user_id:     user.id,
          title:       meta.title,
          artist:      meta.artist || null,
          duration_ms: meta.duration_ms,
          file_size:   meta.file_size,
          mime_type:   meta.mime_type,
          audio_url:   storagePath,   
          status:      "uploading" as SongStatus,
        }) 
        .select("id")
        .single();

      if (insertError || !songRow) {
        setState({
          status: "error", progress: 0,
          errorMessage: insertError?.message ?? "Failed to create song record.",
          songId: null,
        });
        return;
      }

      const songId = (songRow as any).id;

      // ── 4. Upload to Supabase Storage ─────────────────────
      const progressTimer = simulateProgress(
        5, 85, 3000,
        (p) => setState((s) => ({ ...s, progress: p }))
      );

      const { error: storageError } = await supabase.storage
        .from("audio")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      clearInterval(progressTimer);

      if (storageError) {
        // Roll back the song row
        await (supabase.from("songs") as any).delete().eq("id", songId);
        setState({
          status: "error", progress: 0,
          errorMessage: storageError.message,
          songId: null,
        });
        return;
      }

      setState((s) => ({ ...s, progress: 90 }));

      // ── 5. Mark as processing ─────────────────────────────
      // 💥 Applied the VIP Pass here too!
      await (supabase.from("songs") as any)
        .update({ status: "processing" as SongStatus }) 
        .eq("id", songId);

      setState((s) => ({ ...s, status: "processing", progress: 95 }));

      // ── 6. Simulate server-side processing delay ──────────
      await new Promise((r) => setTimeout(r, 1800));

      // 💥 And applied the final VIP Pass here!
      await (supabase.from("songs") as any)
        .update({ status: "ready" as SongStatus }) 
        .eq("id", songId);

      setState({ status: "ready", progress: 100, errorMessage: null, songId });
    },
    [supabase]
  );

  return { state, upload, reset };
}

// ── Smooth fake-progress interpolation ───────────────────────
function simulateProgress(
  from: number,
  to: number,
  durationMs: number,
  onTick: (p: number) => void
): ReturnType<typeof setInterval> {
  const steps = 30;
  const interval = durationMs / steps;
  let current = from;
  const increment = (to - from) / steps;

  return setInterval(() => {
    current = Math.min(current + increment + Math.random() * 2, to);
    onTick(Math.round(current));
  }, interval);
}