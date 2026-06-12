import Link from "next/link";
import { Music2, Video, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="flex items-center gap-3">
        <Music2 className="h-10 w-10 text-violet-400" />
        <h1 className="text-5xl font-bold tracking-tight">BeatzVid</h1>
      </div>

      <p className="max-w-md text-lg text-zinc-400">
        Upload your audio. Add lyrics. Get a cinematic music video with
        frame-perfect animated subtitles.
      </p>

      <div className="flex gap-4">
        <Link
          href="/signup"
          className="rounded-lg bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-500 transition-colors"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold hover:border-zinc-500 transition-colors"
        >
          Log In
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-6 text-sm text-zinc-500">
        {[
          { icon: Music2, label: "Upload Audio" },
          { icon: Sparkles, label: "Sync Lyrics" },
          { icon: Video, label: "Export Video" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <Icon className="h-6 w-6 text-violet-500" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
