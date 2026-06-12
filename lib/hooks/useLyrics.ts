"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LyricLine } from "@/lib/types/database";

export interface ParsedLine {
  line_index: number;
  text: string;
  start_ms: number;
  end_ms: number | null;
}

// ── Parse raw text into lines ─────────────────────────────────
export function parseRawLyrics(raw: string): ParsedLine[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((text, idx) => ({
      line_index: idx,
      text,
      start_ms: 0,
      end_ms: null,
    }));
}

// ── Parse LRC format: [mm:ss.xx] lyric text ──────────────────
export function parseLRC(raw: string): ParsedLine[] {
  const lrcRegex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)$/;
  const lines: ParsedLine[] = [];

  raw.split("\n").forEach((line) => {
    const match = line.trim().match(lrcRegex);
    if (match) {
      const min  = parseInt(match[1], 10);
      const sec  = parseInt(match[2], 10);
      const ms   = match[3].length === 2
        ? parseInt(match[3], 10) * 10
        : parseInt(match[3], 10);
      const text = match[4].trim();
      if (text) {
        lines.push({
          line_index: lines.length,
          text,
          start_ms: min * 60_000 + sec * 1_000 + ms,
          end_ms: null,
        });
      }
    }
  });

  // Fill end_ms from next line's start_ms
  return lines.map((l, i) => ({
    ...l,
    end_ms: lines[i + 1]?.start_ms ?? null,
  }));
}

// ── Detect format ─────────────────────────────────────────────
export function detectFormat(raw: string): "lrc" | "plain" {
  return /^\[\d{2}:\d{2}\.\d{2,3}\]/.test(raw.trim()) ? "lrc" : "plain";
}

export function useLyrics(songId: string) {
  const supabase = createClient();

  const [lines, setLines]     = useState<ParsedLine[]>([]);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // ── Load existing lyrics from DB ─────────────────────────
  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("lyrics")
      .select("*")
      .eq("song_id", songId)
      .order("line_index");

    if (error) { setError(error.message); return; }

    setLines(
        // 💥 Add ": any" right here next to the "r" 💥
        (data ?? []).map((r: any) => ({
          line_index: r.line_index,
          text:       r.text,
          start_ms:   r.start_ms,
          end_ms:     r.end_ms ?? null,
      }))
    );
  }, [songId, supabase]);

  // ── Parse and set lines from raw text ────────────────────
  const parse = useCallback((raw: string) => {
    const fmt    = detectFormat(raw);
    const parsed = fmt === "lrc" ? parseLRC(raw) : parseRawLyrics(raw);
    setLines(parsed);
    setSaved(false);
  }, []);

  // ── Update a single line's text ───────────────────────────
  const updateText = useCallback((idx: number, text: string) => {
    setLines((prev) =>
      prev.map((l) => (l.line_index === idx ? { ...l, text } : l))
    );
    setSaved(false);
  }, []);

  // ── Stamp a line's start_ms ───────────────────────────────
  const stampLine = useCallback((idx: number, ms: number) => {
    setLines((prev) =>
      prev.map((l) => (l.line_index === idx ? { ...l, start_ms: ms } : l))
    );
    setSaved(false);
  }, []);

  // ── Reorder lines (drag-and-drop ready) ───────────────────
  const reorder = useCallback((from: number, to: number) => {
    setLines((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((l, i) => ({ ...l, line_index: i }));
    });
    setSaved(false);
  }, []);

  // ── Delete a line ─────────────────────────────────────────
  const deleteLine = useCallback((idx: number) => {
    setLines((prev) =>
      prev
        .filter((l) => l.line_index !== idx)
        .map((l, i) => ({ ...l, line_index: i }))
    );
    setSaved(false);
  }, []);

  // ── Add blank line after index ────────────────────────────
  const addLine = useCallback((afterIdx: number) => {
    setLines((prev) => {
      const next = [...prev];
      next.splice(afterIdx + 1, 0, {
        line_index: afterIdx + 1,
        text: "",
        start_ms: 0,
        end_ms: null,
      });
      return next.map((l, i) => ({ ...l, line_index: i }));
    });
    setSaved(false);
  }, []);

  // ── Save all lines to DB (upsert) ─────────────────────────
  const save = useCallback(async () => {
    setSaving(true);
    setError(null);

    // Delete existing lines for this song, then re-insert
    const { error: delError } = await supabase
      .from("lyrics")
      .delete()
      .eq("song_id", songId);

    if (delError) {
      setError(delError.message);
      setSaving(false);
      return;
    }

    if (lines.length === 0) {
      setSaving(false);
      setSaved(true);
      return;
    }

    const rows = lines.map((l) => ({
      song_id:    songId,
      line_index: l.line_index,
      text:       l.text,
      start_ms:   l.start_ms,
      end_ms:     l.end_ms,
    }));

    const { error: insertError } = await supabase
      .from("lyrics")
      .insert(rows as any);

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
  }, [songId, lines, supabase]);

  return {
    lines,
    saving,
    saved,
    error,
    load,
    parse,
    updateText,
    stampLine,
    reorder,
    deleteLine,
    addLine,
    save,
  };
}
