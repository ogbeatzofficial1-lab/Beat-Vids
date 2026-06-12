# 🎬 BeatzVid

> Turn your audio into cinematic music videos with frame-perfect animated lyrics.

BeatzVid is a full-stack web application that lets users upload audio tracks, sync
lyrics to millisecond-accurate timestamps, and generate stylized music videos —
all from a modern, dark-mode browser interface.

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Supabase Setup](#supabase-setup)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Page Reference](#page-reference)
- [Database Schema](#database-schema)
- [Storage Buckets](#storage-buckets)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## 🛠 Tech Stack

| Layer         | Technology                              |
|---------------|-----------------------------------------|
| Framework     | Next.js 15 (App Router)                 |
| Styling       | Tailwind CSS v4                         |
| Icons         | Lucide React                            |
| Backend       | Supabase (PostgreSQL + Auth + Storage)  |
| Auth          | Supabase Auth (Email/Password + Google OAuth) |
| Language      | TypeScript                              |
| Font          | Inter (Google Fonts)                    |

---

## ✨ Features

- **Audio Upload** — Drag-and-drop MP3, WAV, OGG, FLAC, AAC files up to 50 MB
- **Auto Metadata** — Parses "Artist - Title" from filename automatically
- **Lyric Editor** — Paste raw lyrics, auto-split into timestamped lines
- **Interactive Studio** — Visual timeline player with live lyric overlay
- **Lyric Stamping** — Click "Set" on any lyric line while playing to stamp its start time
- **Waveform Visualizer** — Animated canvas waveform reacts to playback
- **Lyric Clip Lane** — Fuchsia blocks show each lyric segment on the timeline
- **Video Generation** — Queue render jobs with style presets
- **Render Progress** — Live progress bar polling during video rendering
- **Public / Private** — Toggle song visibility; lyrics inherit song privacy
- **Dark Mode First** — Full dark UI, optimized for desktop
- **Google OAuth** — One-click sign in with Google
- **Row Level Security** — All data locked to the authenticated owner

---

## 📁 Project Structure


---

## ✅ Prerequisites

Make sure you have the following installed before starting:

- **Node.js** v18.17 or higher — [nodejs.org](https://nodejs.org)
- **npm** v9+ (comes with Node) or **pnpm** / **yarn**
- **Git** — [git-scm.com](https://git-scm.com)
- A **Supabase** account — [supabase.com](https://supabase.com) (free tier is enough)
- A **Google Cloud** account (only if enabling Google OAuth)

---

## 🔐 Environment Setup

Create a `.env.local` file in the project root:

```bash
# ── Supabase ────────────────────────────────────────────────
# Found in: Supabase Dashboard → Project Settings → API

NEXT_PUBLIC_SUPABASE_URL=[your-project-ref.supabase.co](https://your-project-ref.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only (never expose to the browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

. Enable Google OAuth (optional)
Go to 
console.cloud.google.com
.
Create a new project → APIs & Services → Credentials.
Click Create Credentials → OAuth 2.0 Client ID.
Application type: Web application.

[your-project-ref.supabase.co](https://your-project-ref.supabase.co/auth/v1/callback)


Enable Google OAuth (optional)
Go to 
console.cloud.google.com
.
Create a new project → APIs & Services → Credentials.
Click Create Credentials → OAuth 2.0 Client ID.
Application type: Web application.
Add Authorized redirect URI:


[your-project-ref.supabase.co](https://your-project-ref.supabase.co/auth/v1/callback)
Copy the Client ID and Client Secret.
In Supabase Dashboard → Authentication → Providers → Google:
Toggle Enable.
Paste Client ID and Client Secret.
Save.




# 1. Clone the repo
git clone [github.com](https://github.com/yourusername/beatzvid.git)
cd beatzvid
# 2. Install dependencies
npm install
# 3. Install required packages (if starting fresh)
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  lucide-react \
  clsx \
  tailwind-merge
🚀 Running the App
bash


# Development server ([localhost](http://localhost:3000)
npm run dev
# Production build
npm run build
npm start
# Type checking
npx tsc --noEmit
# Lint
npm run lint


📄 Page Reference
URL	Description	Auth Required
/	Landing page	No
/login	Email/password + Google login	No
/signup	Create account with email	No
/dashboard	Home — stats, recent songs, recent videos	Yes
/upload	Drag-and-drop audio upload	Yes
/songs	All uploaded songs	Yes
/songs/[id]	Song detail, quick actions	Yes
/songs/[id]/lyrics	Paste, parse, and save lyrics	Yes
/studio	Interactive timeline player + lyric stamper	Yes
/videos	All generated videos with live render status	Yes
/videos/[id]	Video detail, watch, download	Yes
🗃 Database Schema


profiles
  id             UUID (FK → auth.users)
  username       TEXT UNIQUE
  display_name   TEXT
  avatar_url     TEXT
  created_at     TIMESTAMPTZ
  updated_at     TIMESTAMPTZ
songs
  id             UUID PK
  user_id        UUID (FK → profiles)
  title          TEXT
  artist         TEXT
  duration_ms    INTEGER
  bpm            NUMERIC
  cover_url      TEXT
  audio_url      TEXT
  file_size      BIGINT
  mime_type      TEXT
  status         ENUM (uploading | processing | ready | error)
  is_public      BOOLEAN
  error_message  TEXT
  created_at     TIMESTAMPTZ
  updated_at     TIMESTAMPTZ
lyrics
  id             UUID PK
  song_id        UUID (FK → songs)
  line_index     INTEGER
  text           TEXT
  start_ms       INTEGER
  end_ms         INTEGER
  word_timings   JSONB  ([{ word, start_ms, end_ms }])
  created_at     TIMESTAMPTZ
generated_videos
  id                  UUID PK
  song_id             UUID (FK → songs)
  user_id             UUID (FK → profiles)
  style               TEXT (cinematic | neon | minimal | visualizer | lyriccard)
  config              JSONB
  video_url           TEXT
  thumbnail_url       TEXT
  duration_ms         INTEGER
  file_size           BIGINT
  status              ENUM (queued | rendering | completed | failed)
  progress            SMALLINT (0–100)
  error_message       TEXT
  render_started_at   TIMESTAMPTZ
  render_finished_at  TIMESTAMPTZ
  created_at          TIMESTAMPTZ
  updated_at          TIMESTAMPTZ
🪣 Storage Buckets
Bucket	Public	Path format	Used for
audio	No	{user_id}/{timestamp}-{filename}	Uploaded audio files
videos	No	{user_id}/{video_id}.mp4	Rendered video output
All buckets use folder-scoped RLS — users can only read/write inside their own {user_id}/ folder.

🔒 Authentication
BeatzVid uses Supabase Auth with the @supabase/ssr package for cookie-based session management that works across Server Components, Client Components, and middleware.

Flow	How it works
Sign up	Email + password → email verification link sent
Log in	Email + password or Google OAuth
Session	Stored in HTTP-only cookies, refreshed via middleware on every request
Route protection	middleware.ts checks supabase.auth.getUser() and redirects unauthenticated users to /login
OAuth callback	/auth/callback/route.ts exchanges the code for a session
Sign out	Calls supabase.auth.signOut() and redirects to /login
🌐 Deployment
Deploy to Vercel (recommended)
bash


# Install Vercel CLI
npm i -g vercel
# Deploy
vercel
# Set environment variables in Vercel dashboard or CLI:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
Or connect your GitHub repo to Vercel and it will auto-deploy on every push to main.

Supabase Auth redirect URLs
In Supabase Dashboard → Authentication → URL Configuration:


 
Site URL:
  [your-app.vercel.app](https://your-app.vercel.app)
Redirect URLs (add all of these):
  [your-app.vercel.app](https://your-app.vercel.app/auth/callback)
  [localhost](http://localhost:3000/auth/callback)
🗺 Roadmap
 Real video rendering via Remotion or Replicate API
 Word-level karaoke sync (per-word word_timings JSONB)
 BPM detection and beat-locked lyric animation
 Custom font and color picker per video style
 Public song/video share pages
 Collaborative lyric editing
 Mobile-responsive Studio view
 Export to MP4, GIF, and WebM
 Stripe subscription for render credits
📝 License
MIT — free to use, modify, and distribute.

Built with ♥ using Next.js, Supabase, and Tailwind CSS.