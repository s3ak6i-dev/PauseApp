# Pause

A behaviour-change app for building the pause — the gap between urge and action.

Pause helps you ride out urges using a timed breathwork protocol, log slips without shame, track your identity, and review your progress weekly.

---

## What It Does

| Screen | Purpose |
|---|---|
| **Urge Timer** | Full-screen countdown with breath ring. Ride the urge for 60 seconds (extendable). Logs outcome, intensity, and triggers. |
| **Slip Log** | Compassionate 3-step slip logger. De-escalation first, then trigger → emotion → intention. Supports quick-log shortcut. |
| **Weekly Review** | Cinematic weekly summary with Pause Score, trigger heatmap, challenges card, identity reflection, and intention builder. |
| **Identity** | Your identity label and values. Add evidence of who you're becoming and track your daily check-in. |
| **Train** | Daily challenges (physical, focus, awareness, digital) and a baseline assessment to find where to start. |
| **Awareness** | Risk forecast, 7-day activity chart, mood trend, and auto-generated insights from your data. |
| **History** | Browse, edit, and delete every entry — urge sessions, slips, challenges, mood logs, evidence, and weekly reviews. |
| **Settings** | Notification toggles, reduce motion, data export (JSON), and full data deletion. |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite 5 + TypeScript |
| Styling | Tailwind CSS v3 (custom design tokens) |
| Animation | Framer Motion |
| Routing | React Router v6 |
| State | Zustand (persisted to localStorage) |
| Database | Supabase (PostgreSQL via REST) |
| Icons | Lucide React |
| Fonts | Inter + DM Mono |

---

## Design Tokens

The app uses a dark-first colour system:

```
bg-base      #1C1C2E   — main background
bg-elevated  #2A2A3E   — cards, panels
bg-warm      #2E2820   — slip log (warm tone)
accent       #7C8CF8   — primary interactive
success      #6BCB8B
warning      #F0B860
slip         #E07070
```

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/s3ak6i-dev/PauseApp.git
cd PauseApp
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Open the SQL Editor and run `supabase_schema.sql` from the repo root
3. Copy your **Project URL** and **anon public key** from Project Settings → API

### 3. Add environment variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> `.env` is git-ignored — your credentials are never committed.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The onboarding flow runs on first visit.

---

## Database Schema

Six tables, all scoped to a per-device UUID (no auth required):

| Table | Stores |
|---|---|
| `urge_events` | Timer sessions — duration, intensity, outcome, triggers |
| `slip_logs` | Slip records — emotion, intention, reflection depth |
| `challenge_logs` | Challenge completions — type, difficulty, duration |
| `mood_logs` | Morning/evening mood scores (1–5) |
| `evidence_logs` | Identity evidence entries with values tags |
| `weekly_reviews` | Completed weekly review snapshots with Pause Score |

All timestamps are stored as Unix epoch milliseconds in a `ts` column (BIGINT) to avoid PostgreSQL reserved-word conflicts.

Each row is scoped with `user_id` — a stable UUID generated on first visit and stored in `localStorage`. No account or login needed.

---

## Project Structure

```
src/
├── components/
│   ├── layout/          — AppLayout, Sidebar, BottomNav
│   └── ui/              — Button, Card, BottomSheet, Chip, ProgressRing, EmojiScale
├── screens/
│   ├── onboarding/      — 5-stage identity setup
│   ├── urge-timer/      — UrgeTimer + outcome screen + useTimer hook
│   ├── slip-log/        — SlipLog + de-escalation + 3-step flow
│   ├── weekly-review/   — WeeklyReview + 7-step cinematic flow
│   ├── identity/        — Identity screen + evidence log
│   ├── train/           — Daily challenges + library + baseline
│   ├── awareness/       — Insights + risk forecast + mood trend
│   ├── history/         — Full CRUD history across all 6 entity types
│   ├── settings/        — Settings + data export/delete
│   └── Home.tsx         — Dashboard with quick actions
├── db/
│   ├── db.ts            — TypeScript interfaces for all 6 entities
│   └── queries.ts       — All Supabase read/write/update/delete helpers
├── store/
│   └── useAppStore.ts   — Zustand: identity, onboarding state, UI flags
├── lib/
│   ├── supabase.ts      — Supabase client + device ID
│   ├── pauseScore.ts    — Weighted Pause Score formula
│   └── insights.ts      — Auto-generated insight logic
└── router.tsx
```

---

## Build

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static host (Vercel, Netlify, Cloudflare Pages).

---

## License

MIT
