"use client";

import { useState, useRef, useCallback, useId } from "react";
import {
  Upload, Music2, FileAudio, X,
  CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioDropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

const ALLOWED_EXT = [".mp3", ".wav", ".ogg", ".flac", ".aac"];

export function AudioDropzone({ onFile, disabled }: AudioDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview]       = useState<{ name: string; size: string } | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setPreview({
        name: file.name,
        size: `${(file.size / 1_048_576).toFixed(2)} MB`,
      });
      onFile(file);
    },
    [onFile]
  );

  // ── Drag events ───────────────────────────────────────────
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const onDragLeave = () => setIsDragOver(false);
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload audio file"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12",
        "cursor-pointer transition-all duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
        isDragOver
          ? "border-violet-400 bg-violet-500/10 scale-[1.01]"
          : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-900",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Hidden file input */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ALLOWED_EXT.join(",")}
        className="sr-only"
        onChange={onInputChange}
        disabled={disabled}
      />

      {/* Drag glow */}
      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-violet-500/5 ring-2 ring-violet-400/40" />
      )}

      {preview ? (
        /* ── File selected state ── */
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/20 ring-2 ring-violet-500/30">
            <FileAudio className="h-7 w-7 text-violet-400" />
          </div>
          <div>
            <p className="font-medium text-white">{preview.name}</p>
            <p className="text-sm text-zinc-500">{preview.size}</p>
          </div>
          <button
            type="button"
            onClick={clearPreview}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
          >
            <X className="h-3 w-3" />
            Choose different file
          </button>
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="flex flex-col items-center gap-4 text-center pointer-events-none">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full transition-colors",
              isDragOver
                ? "bg-violet-500/30 ring-2 ring-violet-400/50"
                : "bg-zinc-800 ring-1 ring-zinc-700"
            )}
          >
            {isDragOver
              ? <Music2 className="h-8 w-8 text-violet-300" />
              : <Upload className="h-8 w-8 text-zinc-400" />
            }
          </div>
          <div>
            <p className="text-base font-semibold text-zinc-200">
              {isDragOver ? "Drop it!" : "Drop your audio here"}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              or <span className="text-violet-400 underline underline-offset-2">browse files</span>
            </p>
          </div>
          <p className="text-xs text-zinc-600">
            MP3, WAV, OGG, FLAC, AAC — up to 50 MB
          </p>
        </div>
      )}
    </div>
  );
}

// ── Status indicator (used by upload page) ────────────────────
export function UploadStatusBar({
  status,
  progress,
  error_message,
}: {
  status: string;
  progress: number;
  error_message: string | null;
}) {
  if (status === "idle") return null;

  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    validating:  { label: "Validating file…",       color: "bg-zinc-500",   icon: <Loader2 className="h-4 w-4 animate-spin" /> },
    uploading:   { label: "Uploading…",              color: "bg-violet-500", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
    processing:  { label: "Processing audio…",       color: "bg-fuchsia-500",icon: <Loader2 className="h-4 w-4 animate-spin" /> },
    ready:       { label: "Upload complete!",         color: "bg-green-500",  icon: <CheckCircle2 className="h-4 w-4" /> },
    error:       { label: error_message ?? "Error",   color: "bg-red-500",    icon: <AlertCircle className="h-4 w-4" /> },
  };

  const { label, color, icon } = config[status] ?? config.uploading;

  return (
    <div className="flex flex-col gap-2">
      {/* Bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn("h-full rounded-full transition-all duration-300", color)}
          style={{ width: `${status === "error" ? 100 : progress}%` }}
        />
      </div>

      {/* Label row */}
      <div className="flex items-center gap-2">
        <span className={cn("shrink-0", status === "error" ? "text-red-400" : "text-zinc-400")}>
          {icon}
        </span>
        <span className={cn("text-sm", status === "error" ? "text-red-400" : "text-zinc-300")}>
          {label}
        </span>
        {status !== "ready" && status !== "error" && (
          <span className="ml-auto font-mono text-xs text-zinc-500">{progress}%</span>
        )}
      </div>
    </div>
  );
}
