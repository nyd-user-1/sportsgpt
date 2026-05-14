@AGENTS.md

---

# SportsGPT

**Purpose:** NY high school sports intelligence — Section XI football (Nassau/Suffolk, Long Island).
**Stack:** Next.js 16 (App Router, Turbopack), Neon Postgres, Tailwind v4, Vercel Blob, lucide-react, recharts, framer-motion.
**Repo:** https://github.com/nyd-user-1/sportsgpt
**Accent color:** `#033882`

---

## Build Rules

### Every DB page must export `force-dynamic`
```ts
export const dynamic = 'force-dynamic'
```

### Always `npm run build` before pushing — never `tsc --noEmit`

### Double-highlight fix for sticky table columns
Use `group/row` (named group) on `<tr>` and `group-hover/row:bg-[var(--row-hover)]` on sticky cells.
Never use the semi-transparent `--inp-bg` on sticky cells — it compounds with the row hover.
`--row-hover: #f5f5f5` is defined in `globals.css`.

---

## Environment Variables

| Var | Where |
|-----|-------|
| `DATABASE_URL` | Neon Postgres connection string — Production + Preview only (not pulled by `vercel env pull`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob — All Environments. Token: see `.env.local` |

After `vercel env pull`, manually append `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` to `.env.local` — the CLI won't include them automatically.

---

## Database (Neon Postgres)

Client: `@neondatabase/serverless` — `import { sql } from '@/lib/db'`

### Tables
| Table | Key columns |
|-------|-------------|
| `teams` | `slug`, `name`, `school_slug`, `division`, `section`, `level`, `gender` |
| `schools` | `slug`, `name`, `enrollment`, `grad_rate`, `sat_avg`, `ap_count` |
| `players` | `slug`, `name`, `school_slug`, `team_slug`, `position` |
| `team_season_stats` | `team_slug`, `season`, `overall_wins`, `overall_losses`, `conference_wins`, `conference_losses` |
| `player_season_stats` | `player_slug`, `school_slug`, `stat_type`, `season`, `pass_yards`, `rush_yards`, `recv_yards`, `total_yards`, `pass_tds`, `rush_tds`, `recv_tds`, `total_tds`, `interceptions`, `completions`, `attempts`, `receptions`, `points`, `games_played`, ... |
| `games` | `id`, `home_team_slug`, `away_team_slug`, `home_score`, `away_score`, `game_date`, `season`, `game_number`, `is_division_game` |

### Slug formats
- Team slug: `{school-slug}-varsity-football` (e.g. `floyd-varsity-football`)
- School slug: simple kebab-case (e.g. `floyd`, `ward-melville`, `half-hollow-hills-east`)
- Player slug: `{first-last}` kebab-case

### Stat types in `player_season_stats`
`'Passing'` | `'Rushing'` | `'Receiving'` | `'Touchdowns'` | `'Scoring'` | `'Total Yards'`

---

## Blob Storage (Vercel)

Store: `sportsgpt-images`
Base URL: `https://tmdolblsg0vd3laa.public.blob.vercel-storage.com`

| Prefix | Contents |
|--------|----------|
| `gallery/teams/` | 119 team photos |
| `gallery/players/` | 93 player headshots |
| `gallery/logos/` | 52 school logos |

**Adding new photos:** Upload directly via Vercel dashboard → Storage → sportsgpt-images → Upload. No deploy needed — gallery re-fetches every hour via `unstable_cache`.

**Ingest script:** `scripts/ingest-blob-photos.mjs` — uploads from `/public` to Blob, idempotent.

**Gallery data function:** `src/lib/gallery.ts` → `getPhotos()` uses `list({ prefix: 'gallery/' })` + `unstable_cache` (1hr TTL). Logos are excluded from the gallery view. `getPhotos()` is the single swappable source — replace its internals to move metadata to Postgres without touching UI.

---

## Page Structure

### Index pages
| Route | File | Notes |
|-------|------|-------|
| `/team` | `src/app/team/TeamTable.tsx` | Sortable, division filter tabs |
| `/player` | `src/app/player/PlayerIndexTable.tsx` | All 307 players, searchable, sortable, career stats |
| `/leaderboard` | `src/app/leaderboard/LeaderboardTable.tsx` | Top 25/season, season filter via + popover |
| `/school` | `src/app/school/` | School index |
| `/gallery` | `src/app/gallery/` | Blob-backed masonry grid + lightbox |

### Detail pages
| Route | File | Notes |
|-------|------|-------|
| `/team/[slug]` | `src/app/team/[slug]/Shell.tsx` | Hero photo, profiles carousel (History + game seasons), Division Standings |
| `/player/[slug]` | `src/app/player/[slug]/Shell.tsx` | Career stats, hero with headshot → school logo fallback |
| `/school/[slug]` | `src/app/school/[slug]/` | Enrollment, academics |
| `/division/[slug]` | `src/app/division/[slug]/Shell.tsx` | Standings + season selector 2021–2024 |
| `/gallery/p/[id]` | `src/app/gallery/p/[id]/page.tsx` | Fullscreen lightbox, filmstrip, keyboard + swipe nav |

### Launchpad (`/launchpad`)
Parallel routes (`@detail` slot):
- `/launchpad` → standings table left + empty slot right
- `/launchpad/[slug]` → team photo in slot
- `/launchpad/game/[id]` → split-screen home/away photo with score badge

---

## Static Asset Mappings

`src/lib/team-images.ts` — three exported records:
- `SCHOOL_LOGOS` — school slug → `/Logos/...` path
- `TEAM_PHOTOS` — school slug → `/Images/...` path (hero images on team detail pages)
- `PLAYER_PHOTOS` — player slug → `/PlayerPhotos/...` path

These serve files from `/public` for team/player detail pages. The gallery uses Blob instead.

---

## Components

### CardLandscapeMini
`w-[210px] h-[90px]`, flex-row, 60×60 image on left, text on right.
Used in: Top Players carousel + Division Standings carousel on `/team/[slug]`.

### Gallery components (`src/app/gallery/components/`)
- `HeroCard` — dark hero card with goalpost SVG line art, first tile in masonry grid
- `GalleryGrid` — CSS columns masonry (1/2/3/4 responsive), scroll-to-last-viewed
- `SharedModal` — fullscreen lightbox with framer-motion slide, filmstrip, prev/next, keyboard/swipe

### SeasonFilterMenu (in LeaderboardTable)
`+` icon popover pattern (ported from SolarGPT). Badge shows active filter count. Click to open, click outside to close, Clear link resets.

---

## Ingest Scripts

| Script | Purpose |
|--------|---------|
| `scripts/ingest-extended.mjs` | Full DB ingest: schema, schools, standings, player stats, games |
| `scripts/ingest-blob-photos.mjs` | Upload `/public/{Images,PlayerPhotos,Logos}` → Blob under `gallery/` prefix |

Run ingest scripts with: `node --env-file=.env.local scripts/<name>.mjs`

---

## App Config (`src/lib/app-config.ts`)

All brand, nav, and routing strings live here. Current nav order:
Chat → Charts → Maps → Teams → Schools → Players → Leaderboard → Divisions → Section XI → Launchpad → Gallery
