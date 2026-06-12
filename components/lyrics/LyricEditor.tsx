"use client";

import { useState, useRef } from "react";
import {
  FileText, Wand2, Plus, Trash2,
  GripVertical, Clock, Save, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParsedLine } from "@/lib/hooks/useLyrics";

interface LyricEditorProps {
  lines: ParsedLine[];
  saving: boolean;
  saved: boolean;
  error: string | null;
  currentMs: number;
  onParse: (raw: string) => void;
  onUpdateText: (idx: number, text: string) => void;
  onStamp: (idx: number, ms: number) => void;
  onDelete: (idx: number) => void;
  onAdd: (afterIdx: number) => void;
  onReorder: (from: number, to: number) => void;
  onSave: () => void;
}

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const sec = (totalSec % 60).toString().padStart(2, "0");
  const cs  = Math.floor((ms % 1000) / 10).toString().padStart(2, "0");
  return `${min}:${sec}.${cs}`;
}

export function LyricEditor({
  lines,
  saving,
  saved,
  error,
  currentMs,
  onParse,
  onUpdateText,
  onStamp,
  onDelete,
  onAdd,
  onReorder,
  onSave,
}: LyricEditorProps) {
  const [rawText, setRawText]         = useState("");
  const [showImport, setShowImport]   = useState(lines.length === 0);
  const dragFrom                       = useRef<number | null>(null);

  // ── Drag-to-reorder handlers ──────────────────────────────
  const onDragStart = (idx: number) => { dragFrom.current = idx; };
  const onDragOver  = (e: React.DragEvent) => e.preventDefault();
  const onDrop      = (toIdx: number) => {
    if (dragFrom.current !== null && dragFrom.current !== toIdx) {
      onReorder(dragFrom.current, toIdx);
    }
    dragFrom.current = null;
  };

  return (
    <div className="flex flex-col gap-4">

      {/* ── Import Panel ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowImport((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-zinc-800/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-semibold text-zinc-200">
              Import Lyrics
            </span>
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500 uppercase tracking-wide">
              Plain text or LRC
            </span>
          </div>
          {showImport
            ? <ChevronUp className="h-4 w-4 text-zinc-500" />
            : <ChevronDown className="h-4 w-4 text-zinc-500" />
          }
        </button>

        {showImport && (
          <div className="border-t border-zinc-800 px-5 py-4 flex flex-col gap-3">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Paste lyrics here — one line per row.\n\nOr paste LRC format:\n[00:14.25] Your lyric line here\n[00:17.80] Another line here`}
              rows={10}
              className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors font-mono leading-relaxed"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!rawText.trim()}
                onClick={() => {
                  onParse(rawText);
                  setShowImport(false);
                }}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Wand2 className="h-4 w-4" />
                Parse Lyrics
              </button>
              <p className="text-xs text-zinc-600">
                LRC timestamps will be imported automatically.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Lines Editor ── */}
      {lines.length > 0 && (
        <div className="flex flex-col gap-1">

          {/* Column headers */}
          <div className="flex items-center gap-3 px-2 pb-1">
            <span className="w-6 shrink-0" />
            <span className="w-7 shrink-0 text-[10px] uppercase tracking-widest text-zinc-600 text-center">#</span>
            <span className="flex-1 text-[10px] uppercase tracking-widest text-zinc-600">Lyric Line</span>
            <span className="w-28 shrink-0 text-[10px] uppercase tracking-widest text-zinc-600 text-center">Start Time</span>
            <span className="w-24 shrink-0 text-[10px] uppercase tracking-widest text-zinc-600 text-center">Actions</span>
          </div>

          {lines.map((line, idx) => (
            <div
              key={line.line_index}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(idx)}
              className="group flex items-center gap-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-2 py-2 hover:border-zinc-700 hover:bg-zinc-900 transition-all"
            >
              {/* Drag handle */}
              <div className="w-6 shrink-0 flex justify-center cursor-grab active:cursor-grabbing text-zinc-700 group-hover:text-zinc-500 transition-colors">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Index */}
              <span className="w-7 shrink-0 text-center font-mono text-xs text-zinc-600">
                {idx + 1}
              </span>

              {/* Editable text */}
              <input
                type="text"
                value={line.text}
                onChange={(e) => onUpdateText(idx, e.target.value)}
                placeholder="Empty line…"
                className="flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-700 focus:bg-zinc-950 focus:outline-none transition-colors"
              />

              {/* Timestamp display */}
              <div
                className={cn(
                  "w-28 shrink-0 rounded-md border px-2 py-1 text-center font-mono text-xs transition-colors",
                  line.start_ms > 0
                    ? "border-violet-700/40 bg-violet-500/10 text-violet-300"
                    : "border-zinc-800 bg-zinc-900 text-zinc-600"
                )}
              >
                {formatMs(line.start_ms)}
              </div>

              {/* Actions */}
              <div className="flex w-24 shrink-0 items-center justify-end gap-1">
                {/* Stamp button */}
                <button
                  type="button"
                  title={`Stamp ${formatMs(currentMs)} to this line`}
                  onClick={() => onStamp(idx, currentMs)}
                  className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-400 hover:border-violet-500 hover:text-violet-400 transition-colors"
                >
                  <Clock className="h-3 w-3" />
                  Set
                </button>

                {/* Add line below */}
                <button
                  type="button"
                  title="Add line below"
                  onClick={() => onAdd(idx)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  title="Delete line"
                  onClick={() => onDelete(idx)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-700 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add line at end */}
          <button
            type="button"
            onClick={() => onAdd(lines.length - 1)}
            className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-800 py-2 text-sm text-zinc-600 hover:border-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add line
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {lines.length === 0 && !showImport && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-800 py-12 text-center">
          <FileText className="h-8 w-8 text-zinc-700" />
          <p className="text-sm text-zinc-500">No lyrics yet.</p>
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="text-sm text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
          >
            Import lyrics
          </button>
        </div>
      )}

      {/* ── Save bar ── */}
      {lines.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-3">
          <div className="flex items-center gap-2 text-sm">
            {error ? (
              <>
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-red-400">{error}</span>
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-green-400">Saved to database</span>
              </>
            ) : (
              <span className="text-zinc-500">
                {lines.length} line{lines.length !== 1 ? "s" : ""} — unsaved changes
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onSave}
            disabled={saving || saved}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Save className="h-4 w-4 animate-pulse" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Lyrics
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
