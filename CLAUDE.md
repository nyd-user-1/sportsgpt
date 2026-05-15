@AGENTS.md

---

# SportsGPT

**Purpose:** NY high school sports intelligence — Section XI football (Nassau/Suffolk, Long Island).
**Stack:** Next.js 16 (App Router, Turbopack), Neon Postgres, Tailwind v4, Vercel Blob, lucide-react, recharts, framer-motion.
**Repo:** https://github.com/nyd-user-1/sportsgpt
**Accent color:** `#033882`

---

## Workflow Rules

- **Do not push unless user says to.** Work on the dev server (`npm run dev`) and only push when explicitly asked.
- Always `npm run build` before pushing — never `tsc --noEmit`.
- Every DB page must export `export const dynamic = 'force-dynamic'`.

---

## Double-highlight fix for sticky table columns

Use `group/row` (named group) on `<tr>` and `group-hover/row:bg-[var(--row-hover)]` on sticky cells.
Never use `--inp-bg` (semi-transparent) on sticky cells — it stacks with the row hover.
`--row-hover: #f5f5f5` is defined in `globals.css`.

---

## Environment Variables

| Var | Notes |
|-----|-------|
| `DATABASE_URL` | Neon — Production + Preview only. Not pulled by `vercel env pull`. Add manually after pull. |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_rw_TmdoLbLsg0VD3LAa_...` — All Environments |

After `vercel env pull`, manually append both to `.env.local`.

---

## Database (Neon Postgres)

Client: `@neondatabase/serverless` — `import { sql } from '@/lib/db'`

### Tables

| Table | Key columns |
|-------|-------------|
| `teams` | `slug`, `name`, `school_slug`, `division`, `section`, `level`, `gender` |
| `schools` | `slug`, `name`, `enrollment`, `grad_rate`, `sat_avg`, `ap_count` |
| `players` | `slug`, `name`, `school_slug`, `team_slug`, `position` |
| `team_season_stats` | `team_slug`, `season`, `overall_wins`, `overall_losses`, `overall_ties`, `conference_wins`, `conference_losses`, `conference_ties` |
| `player_season_stats` | `player_slug`, `school_slug`, `player_name`, `school_name`, `stat_type`, `season`, `pass_yards`, `rush_yards`, `recv_yards`, `total_yards`, `pass_tds`, `rush_tds`, `recv_tds`, `total_tds`, `interceptions`, `completions`, `attempts`, `receptions`, `points`, `games_played` |
| `games` | `id`, `home_team_slug`, `away_team_slug`, `home_score`, `away_score`, `game_date`, `season`, `game_number`, `is_division_game` |

### Slug formats
- Team slug: `{school-slug}-varsity-football`
- School slug: simple kebab-case (`floyd`, `ward-melville`, `half-hollow-hills-east`)
- Player slug: `first-last` kebab-case

### Stat types in `player_season_stats`
`'Passing'` | `'Rushing'` | `'Receiving'` | `'Touchdowns'` | `'Scoring'` | `'Total Yards'`

### Players join pattern
`players.school_slug` is populated; `players.team_slug` is NOT populated — always join via `school_slug`.
```sql
LEFT JOIN teams t ON t.school_slug = p.school_slug
```

---

## Blob Storage (Vercel)

Store: `sportsgpt-images`
Base URL: `https://tmdolblsg0vd3laa.public.blob.vercel-storage.com`

| Prefix | Contents |
|--------|----------|
| `gallery/teams/` | 119 team photos (all schools, multiple per school) |
| `gallery/players/` | 93 player headshots |
| `gallery/logos/` | 53 school logos (80px, served via `SCHOOL_LOGOS`) |
| `gallery/divisions/` | Division I–IV SVG logos |

**`/public` is clean** — Images, PlayerPhotos, and Logos folders deleted. Everything served from Blob.
**Adding photos:** Upload to Blob via Vercel dashboard — no deploy needed. Gallery re-fetches every hour.
**Cache bust:** Delete `.next/cache/` and restart dev server (restart alone does NOT bust `unstable_cache`).

---

## Static Asset Mappings (`src/lib/team-images.ts`)

```typescript
const BLOB   = '...blob.vercel-storage.com/gallery/logos'
const BLOB_T = '...blob.vercel-storage.com/gallery/teams'
const BLOB_P = '...blob.vercel-storage.com/gallery/players'
```

- `SCHOOL_LOGOS` — `Record<string, string>` school slug → Blob logo URL (80px)
- `TEAM_PHOTOS` — `Record<string, string[]>` school slug → array of Blob photo URLs. **First entry = detail page hero.** All entries enrich the gallery.
- `PLAYER_PHOTOS` — `Record<string, string>` player slug → Blob headshot URL
- `DIVISION_LOGOS` — `Record<number, string>` 1–4 → Blob SVG URL

`next.config.ts` whitelists `tmdolblsg0vd3laa.public.blob.vercel-storage.com` for `next/image`.

---

## Page Structure

### Index pages

| Route | File | Notes |
|-------|------|-------|
| `/team` | `TeamTable.tsx` | Sortable; cols: Team, Div, GP, W, L, T, PCT, Conf, PF, PA, DIFF; division filter tabs |
| `/player` | `PlayerIndexTable.tsx` | All 307 players, searchable, sortable; career stats: Tot Yds, Pass, Rush, Rec, TD, INT |
| `/leaderboard` | `LeaderboardTable.tsx` | Top 25/season (2020–2024), Passing/Rushing/Receiving tabs, + season filter popover |
| `/school` | `src/app/school/` | School index |
| `/gallery` | `src/app/gallery/` | Blob-backed masonry grid + lightbox; dark/light toggle with View Transition ripple |

### Detail pages

| Route | File | Notes |
|-------|------|-------|
| `/team/[slug]` | `Shell.tsx` | Hero photo (Blob), Profiles carousel (History + per-season game logs), Division Standings carousel |
| `/player/[slug]` | `Shell.tsx` | Career stats by type; hero: headshot → school logo fallback |
| `/school/[slug]` | — | Enrollment, academics |
| `/division/[slug]` | `Shell.tsx` | Standings (2 rows default, header click expands) + circular season carousel arrows |
| `/gallery/p/[id]` | `page.tsx` | Fullscreen lightbox; stable hash IDs; filmstrip centered on active photo |

### Launchpad (`/launchpad`)
Parallel routes (`@detail` slot): standings left, team photo or game split-screen right.

---

## Gallery (`src/app/gallery/`)

### `src/lib/gallery.ts` — `getPhotos()`
- Lists all blobs under `gallery/` prefix, skips logos and divisions
- **Stable IDs:** `id = stableId(pathname)` — djb2 hash of pathname. NOT positional. Adding photos won't break existing `/gallery/p/[id]` links.
- Enriches player photos with `playerName`, `teamName`, `schoolSlug` via two-pass matching:
  1. Exact: decoded filename matches `PLAYER_PHOTOS` reverse map
  2. Fuzzy: normalized filename contains full player name AND match is unique
- Enriches team photos with `teamName`, `schoolSlug` via `TEAM_PHOTOS` reverse map (decodes URL-encoded filenames)
- Cached with `unstable_cache` (1hr TTL)
- **To bust cache: `rm -rf .next/cache` then restart**

### `GalleryPhoto` type
```typescript
{ id: string; url: string; pathname: string; category: 'teams'|'players'|'logos'|'other';
  playerName?: string; teamName?: string; schoolSlug?: string }
```

### Components
- `HeroCard` — dark/light variants; goalpost SVG line art; sun/moon toggle (top-right); accepts `dark` + `onToggle` props
- `GalleryGrid` — CSS columns masonry; dark/light state owner; View Transition API ripple on toggle; school logo + name overlay on hover (players and teams)
- `SharedModal` — fullscreen lightbox; `currentIdx` (array index) for nav, `photo.id` (hash) for URLs; filmstrip uses `left: calc(50% - offsetPx)` (NOT translateX)

### Dark/Light toggle
- View Transition API: circular ripple from click point expanding to full screen
- `flushSync(() => setDark(d => !d))` forces synchronous React update inside `startViewTransition`
- CSS in `globals.css`: `::view-transition-old/new(root)` rules

---

## Command Palette (`src/components/CommandPalette.tsx`)

- `Cmd+K` opens palette; URL state: `?cmd=open&q=...`
- Empty state: Recent searches (localStorage, max 5) + Quick Nav (Teams, Players, Leaderboard, Gallery, Divisions I–IV)
- Search state: Teams / Players / Schools sections, fuzzy match, school logos shown
- Data: `/api/search` — fetched once on first open, cached in ref
- Navigation: `router.push(href)` only — no `close()` call; palette closes naturally when new URL lacks `?cmd=open`
- Added to: root layout (`layout.tsx`) + Sidebar Search button

---

## Division Page (`/division/[slug]/Shell.tsx`)

- Season carousel: `← →` arrows, circular (wraps from 2024→2021→2024)
- Standings table: header row is the expand trigger (hover state is the affordance — no chevron); starts at 2 rows; no "Show all" button
- No sticky columns (table narrow enough; eliminates double-hover bug)

---

## Team/Player Info Tables

- Header row `onClick` expands table (2 rows default)
- No chevron icon — hover state on header is sufficient affordance
- Data rows: standard `hover:bg-[var(--inp-bg)]` (no sticky = no double-highlight issue)

---

## Home Page (`/`)

- `CardCarouselPortrait` — 12 team cards with Blob action photos, links to `/team/[slug]`
- Header (home page only): gallery icon (→ `/gallery`), Sign in (outline), Sign up (filled dark)
- Shown via `pathname === '/'` check inside `AppLayout`

---

## Components

### CardLandscapeMini
`w-[210px] h-[90px]`, flex-row, 60×60 image left, text right.
Used in: Top Players + Division Standings carousels on `/team/[slug]`.

### SeasonFilterMenu (in LeaderboardTable)
`+` icon popover (ported from SolarGPT). Badge shows active filter. Closes on outside click.

---

## Ingest Scripts

| Script | Purpose |
|--------|---------|
| `scripts/ingest-extended.mjs` | Full DB ingest: schema, schools, standings, player stats, games |
| `scripts/ingest-blob-photos.mjs` | Upload to Blob `gallery/` prefix (now legacy — `/public` is empty) |

Run with: `node --env-file=.env.local scripts/<name>.mjs`

---

## App Config (`src/lib/app-config.ts`)

All brand, nav, routing strings here. Nav order:
Chat → Charts → Maps → Teams → Schools → Players → Leaderboard → Divisions → Section XI → Launchpad → Gallery
