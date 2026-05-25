@AGENTS.md

---

# SportsGPT

**Purpose:** NY high school sports intelligence — Section XI football (Nassau/Suffolk, Long Island).
**Stack:** Next.js 16 (App Router, Turbopack), Neon Postgres, Tailwind v4, Vercel Blob, lucide-react, recharts, framer-motion.
**School colors:** `src/lib/school-colors.ts` — `SCHOOL_COLORS: Record<string, { primary, secondary, label }>` for all 52 Section XI schools. Colors derived from actual logo images.
**Repo:** https://github.com/nyd-user-1/sportsgpt
**Accent color:** `#033882`

---

## Workflow Rules

- **Do not push unless user says to.** Work on the dev server (`npm run dev`) and only push when explicitly asked.
- Always `npm run build` before pushing — never `tsc --noEmit`.
- Every DB page must export `export const dynamic = 'force-dynamic'`.

---

## Editorial Design System (Paper Palette)

All panels, shells, and detail pages use a shared dark-background editorial design language. These CSS variables are defined in `globals.css`:

| Variable | Role |
|----------|------|
| `--paper` | Panel background (near-black) |
| `--paper-text` | Primary text — names, stat values |
| `--paper-strong` | Accent blue (#033882 equivalent) — **links and interactive elements ONLY** |
| `--paper-muted` | Secondary text — team names, season labels, subtitles |
| `--paper-faint` | Tertiary text — section headers, column headers, rank numbers |
| `--paper-quiet` | Subtle hover background |
| `--paper-rule` | Primary divider |
| `--paper-rule-soft` | Row-level divider (lighter) |

### Typography stack
- **Display / Names:** `var(--font-display)` = Fraunces serif
- **UI / Labels / Buttons:** `var(--font-sans)` = DM Sans
- **Numbers / Stats:** `var(--font-mono)` = monospace, `tabular-nums`

### Design rules (do not break these)
- **Blue = interactive only.** `--paper-strong` goes on hovered player names (clickable) and actual links ("View full profile"). Never on static stat numbers.
- **Stat numbers are neutral.** Values like "121", "534", "8 TD" are `--paper-text`. Units ("yds", "pts") are `--paper-muted` DM Sans at ~10px, rendered as a separate element.
- **Section headers:** 10px, uppercase, `tracking-[0.24em]`, `--paper-faint`, DM Sans.
- **Rank indicators** in list panels: small mono `--paper-faint` before each row (1. 2. 3.).
- **Player name hover pattern:** `group` on the row div, `text-[var(--paper-text)] group-hover:text-[var(--paper-strong)]` on the name span. Never set color in inline style (inline styles override Tailwind group-hover).
- **Stat tables:** Use flex rows with `flex-1` season label + `w-10` fixed-width stat columns (not `w-full` table — it spreads sparse numbers too wide across the panel).
- **`PAPER_BRIDGE`:** `const PAPER_BRIDGE = { background: 'var(--paper)', color: 'var(--paper-text)' }` — wrap any panel root that needs to force the paper palette.

### Section header pattern (Game Log, Player Profile)
```tsx
<div className="px-5 pt-6 pb-2 border-t border-[var(--paper-rule)] first:border-t-0">
  <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>
    {sectionLabel}
  </span>
</div>
```

### Player row pattern (Game Log)
```tsx
<div className="group flex items-center gap-2.5 px-5 py-3 hover:bg-[var(--paper-quiet)] transition-colors">
  <span className="shrink-0 tabular-nums text-[var(--paper-faint)] w-5 text-right" style={{ ...MONO, fontSize: 11 }}>{rank}.</span>
  {/* logo */}
  <div className="flex-1 min-w-0">
    <span className="text-[var(--paper-text)] group-hover:text-[var(--paper-strong)] transition-colors" style={SERIF}>name</span>
    <p className="text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>team</p>
  </div>
  <div className="flex items-baseline gap-1">
    <span className="text-[13px] tabular-nums text-[var(--paper-text)]" style={MONO}>{value}</span>
    <span className="text-[10px] text-[var(--paper-muted)]" style={SANS}>{unit}</span>
  </div>
</div>
```

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
| `ANTHROPIC_API_KEY_SPORTSGPT2` | Claude API key for AI highlight rewriter. Must be set in Vercel + `.env.local`. |

After `vercel env pull`, manually append all three to `.env.local`.

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
| `game_box_scores` | `game_id` (UNIQUE), `newsday_id`, `highlights`, `quarter_scores` (JSONB), `player_stats` (JSONB — raw scrape, avoid for stat rendering) |
| `player_game_stats` | `game_id`, `season`, `player_slug`, `player_name`, `school_slug`, `team_name`, `stat_type`, `rush_att/yds/tds`, `pass_comp/att/yds/tds/int`, `rec_rec/yds/tds`, `kick_pat/fg/points`, `def_int/sacks/fumbles` |
| `player_rosters` | `school_slug`, `season`, `player_name`, `player_slug`, `position`, `jersey_number`, `class` |

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

### Game data coverage (manually ingested from MaxPreps)

| Season (DB) | School Year | Rows | Status |
|-------------|-------------|------|--------|
| 2021        | 2021-22     | 203  | ✅ Complete |
| 2022        | 2022-23     | 219  | ✅ Complete (Hampton Bays + Eastport-South Manor had no 22-23 season per MaxPreps) |
| 2023        | 2023-24     | 237  | ✅ Complete |
| 2024        | 2024-25     | 240  | ✅ Complete |
| 2025        | 2025-26     | 224  | ✅ Complete |

**Season label convention:** DB `season=2024` = fall 2024 games = school year 2024-25.
Display via `formatSeason()` in `src/lib/utils.ts`.

**ALWAYS refer to seasons in school-year format** — say "2024-25 season" or "24-25 season", NEVER just "2024 season". This applies everywhere: code comments, user-facing text, conversations, memory, documentation. DB integer values (2024, 2023, etc.) are internal only.

**Unexpected team slugs to know:**
- Westhampton Beach → `westhampton-varsity-football`
- Amityville Memorial → `amityville-varsity-football`
- John Glenn → `glenn-varsity-football`
- GSMHS → `greenport-southold-mattituck-varsity-football`
- Mount Sinai → `mt-sinai-varsity-football`
- East Hampton/Pierson → `east-hampton-bridgehampton-pierson-varsity-football`
- Patchogue-Medford / Pat-Med → `patchogue-medford-varsity-football`
- Shoreham-Wading River / SWR → `shoreham-wading-river-varsity-football`

**Nassau County schools NOT in DB:** Farmingdale, Plainedge, Garden City, Massapequa, North Shore — skip those games.

**No unique constraint** on games table — deduplicate carefully before inserting.

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
| `/chat` | `src/app/chat/page.tsx` | AI chat — paperMode + grain overlay. Empty: `SECTION XI · FOOTBALL` eyebrow, Fraunces APP_NAME, ruled line, ChatInput, italic serif tagline, CardCarousel. Active: scrollable thread + bottom-pinned input. Uses `useChat`, `ChatInput`, `ChatMessage`, `CardCarousel`, `ChatSeasonsPanel`. **`/chat-2` is a deprecated duplicate — safe to delete.** |

### Detail pages

| Route | File | Notes |
|-------|------|-------|
| `/team/[slug]` | `Shell.tsx` | Hero photo SLIDER (auto-advance 4s, color placeholder slide 0, arrows), RevealFx stagger animation, Profiles carousel, Division Standings |
| `/player/[slug]` | `Shell.tsx` | Season tabs (Total + per-season) with ← → arrow key nav; Total tab = career StatTable with All Seasons rollup; season tab = game log InfoTable (from `games`+`game_box_scores` JSONB matched by player name); breadcrumbs: Team / Position / Player below H1; RevealFx animations |
| `/school/[slug]` | — | Enrollment, academics |
| `/division/[slug]` | `Shell.tsx` | Hero photo slider (auto-advance, arrows), Standings + season carousel |
| `/gallery/p/[id]` | `page.tsx` | Fullscreen lightbox; stable hash IDs; filmstrip centered on active photo |
| `/maps` | `page.tsx` + parallel route | Suffolk district choropleth colored by school identity; click → team detail in AppPanel |
| `/section/[slug]` | `Shell.tsx` + `page.tsx` | Section XI overview. Only `section-xi` is valid. Hero strip → division cards (2×2 grid, 520px tall). Sections: Division I–IV (ranked team lists), Season (one card per team×season → team page), Games (all games → `/game/[id]`). Sticky ContentsNav with IntersectionObserver. `selectedSeason: number \| null` (null = All-Time). Per-division player+game counts via SQL CTEs. |
| `/colors` | `page.tsx` | Dev review page: all 52 school logos + color swatches, ✓/✗ confirmation (localStorage) |

### Game Detail (`/game/[id]`)
- `page.tsx` — fetches game + box score + `player_game_stats` + prev/next game IDs + player slug map
- `GameShell.tsx` — split-screen hero, RevealFx animations, stat tabs, AI highlights, Game Log panel
- `?ref={team-slug}` param — keeps chevron navigation anchored to the referring team's schedule
- Score links in team game log (`/team/[slug]`) append `?ref={team.slug}` to game URLs

**GameShell layout (top → bottom):**
1. Hero (400px split-screen, `object-cover object-top`, Week N badge top-left)
2. Stat tabs: **Box Score | Passing | Rushing | Receiving | Kicking | Defense**
   - Box Score tab: `ScoreTable` (quarter breakdown, team logos, W/L, final score)
   - Stat tabs: `GameStatSection` — flat player list sourced from `player_game_stats` table. Each row: school logo (from `school_slug`) + player name linked to `/player/[slug]` (from `player_slug`) + stat columns. No JSONB parsing.
3. AI Highlights — AI-rewritten text via client-side deferred fetch
4. Game Log panel (header icon) — `PanelPlayers` from `game_box_scores.player_stats` JSONB (fallback). Editorial design: rank numbers per category, player name (Fraunces) + team (italic), stat value (mono --paper-text) + unit (DM Sans --paper-muted) as separate elements. Click player name → opens player profile parallel route panel.
5. Player profile panel (`@panel/player/[slug]/page.tsx`) — editorial design: full-bleed hero, identity row with position (e.g. "Longwood · Division I · RB"), stat sections (flex rows, `flex-1` season + `w-10` per stat column to avoid sparse sprawl), "View full profile" link in --paper-strong.

**CRITICAL: Always use `player_game_stats` for game stat tabs, NOT `game_box_scores.player_stats` JSONB.**
- `player_game_stats` has `school_slug` + `player_slug` on every row → logos and links work without any name matching
- `game_box_scores.player_stats` JSONB is only used for the Game Log side panel (PanelPlayers) as fallback

**AI Highlight Rewriter:**
- API route: `src/app/api/game/[id]/highlights/route.ts`
- Fetches raw `highlights` from `game_box_scores`, rewrites via `claude-haiku-4-5`
- Permanently cached per game ID: `unstable_cache(['highlight'], { revalidate: false })`
- Client-side: `useEffect` waits 2s after page load, then fetches. Skeleton shimmer while loading.
- Inline markdown renderer: `renderHighlights()` converts `**bold**` and paragraph breaks (no external lib)
- System prompt: high school beat reporter voice, 2–3 paragraphs, final score in bold, no `#` headings

### Launchpad (`/launchpad`)
Parallel routes (`@detail` slot): standings left, team photo or game split-screen right.

**Standings table:** Team, W, L, PCT, Conf, PF, PA, DIFF. Selected row = blue-50 + inset left accent.

**ProviderSection cards:** Horizontal scroll, `w-[400px]`, split-screen photos, black Week badge, long date. `?team={slug}` param preserves team filter when navigating from team context to a game card.

### Chat (`/chat`)
Editorial AI chat page. `useChat()` hook (`src/hooks/useChat.ts`) handles streaming, tool loops, meta-tracking. Backend at `src/app/api/chat/route.ts` — Anthropic primary, OpenAI/Gemini/Grok fallbacks, `TOOLS` from `src/lib/chat-tools.ts`. Stream emissions are joined with `\n\n` so multi-block responses don't run together.

**System prompt** does NOT hard-code division membership — model is instructed to call `get_standings({season, division})` instead. Also instructed: headers on own line, space after colons, prefer short team names (Pat-Med, SWR, GSMHS).

**`chat-tools.ts`** runs every query result through `normalizeRows` → `formatTeamName`, which strips `" Varsity Football"` and applies preferred abbreviations (Patchogue-Medford → Pat-Med, Shoreham-Wading River → SWR, Greenport-Southold-Mattituck → GSMHS, East Hampton-Bridgehampton-Pierson → East Hampton).

**Chat components** (all in `src/components/`):
- `ChatInput.tsx` — paper-rule frame on paper-quiet (3px radius), Fraunces serif textarea, paper-strong send button, model dropdown w/ paper palette
- `ChatMessage.tsx` — user bubble re-framed as paper-rule on paper-quiet; assistant markdown via `mdComponents` (10px uppercase ruled-line headers, Fraunces 17px paragraphs, paper-palette tables, paper-strong code/links, italic paper-muted em). Tables use `whitespace-nowrap` on `th` and `word-break: keep-all` on `td` so numbers like "10-1" don't break at the hyphen. Action bar uses 10px uppercase text links (`Copy / Charts / Explore seasons`). Follow-ups use ranked-list hover pattern (`px-4 -mx-4`, paper-text 4% color-mix bg, 3px radius, ↳ + italic Fraunces → paper-strong)
- `CardCarousel.tsx` — chevron arrows toggle between Teams mode (260×170 photo cards w/ matted hero treatment) and Suggested Prompts mode (220×130 cards w/ 32px logo + mono paper-strong question). Both horizontal-scroll with snap. Prompts seeded as `PromptCard[]` with `logoKey` (school slug or division number).
- `ChatSeasonsPanel.tsx` — paper-palette AppPanel with three-level drill-down: SeasonsView → ScheduleView → GameView (editorial section headers + ranked rows + `View full game page` link)

**Matted hero treatment** (used by team cards in CardCarousel + team/division hero sliders): outer `border-paper-rule` + `bg-paper-quiet` + inner 4–8px padding + inner `overflow-hidden` div with radius 1. Gives the editorial "photo in a frame" look.

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

## Core UX Design Pattern: Stay-on-Page Secondary Views

**The central design principle of this app:** the user should never be forced to navigate away from their current view just to see detail on a related entity. Two mechanisms implement this:

### AppPanel (client-side)
`AppPanel` renders via `createPortal` into `#app-panel-root` (a flex sibling of the main content div inside `AppLayout`). It slides in from the right at 423px (1/3) or 50vw (1/2). It has a title bar, close (×), and expand/collapse button.

**Concrete implementations:**
- `PanelPlayer` — player profile card with photo, stats, "View full profile →" link. Used on `/leaderboard` (row click) and `/game/[id]` (player name in Players panel).
- `PanelChart` — previously simple preview; now empty (charts use parallel route instead).
- `PanelChat` — AI chat panel, context-aware.
- `PanelImage` — team photo gallery for the two teams in a game.
- `AppPanel` directly — e.g., the "Players" box score panel on `/game/[id]`.

**Rule:** Any clickable entity (player name, team name, chart card, game card) that would otherwise navigate away should instead open an AppPanel showing the detail. Hard navigation is the fallback, not the default.

### Parallel Routes + AppPanel (server-side detail)
When the secondary page needs **server-rendered data** (DB queries, the full page component tree), use a parallel route `@panel` slot wired through a client `PanelWrapper` into `AppPanel`.

Pattern (as implemented on `/charts`):
```
src/app/charts/
  layout.tsx                ← AppLayout + 3 slot wrappers (panel, player, team)
  page.tsx                  ← server component; 28 parallel SQL queries for chart card photos
  ChartsGrid.tsx            ← 'use client'; A-Z sorted responsive grid (minmax 220px), keyboard nav
  ChartsPanelWrapper.tsx    ← chart panel; prev/next cycle through CHART_SLUGS_AZ
  ChartsPlayerWrapper.tsx   ← player panel; prev/next from sessionStorage chart-players-{slug}
  ChartsTeamWrapper.tsx     ← team panel; prev/next from sessionStorage chart-teams-{slug}
  @panel/[slug]/
    default.tsx             ← re-exports page (keeps chart visible at deeper URLs)
    page.tsx                ← 28 chart cases; SportsBarChartInteractive or SportsAreaGradient
  @player/[slug]/[playerSlug]/page.tsx  ← PlayerPanelContent from PanelPlayer
  @team/[slug]/team/[teamSlug]/page.tsx ← TeamPanelContent from PanelTeam
```

**Charts grid:** 28 charts sorted A-Z, `repeat(auto-fill, minmax(220px, 1fr))`, gap-5. Each card shows photo of the #1 leader (top 3 from DB, cycling by card index). Keyboard ←→↑↓ navigates by grid position. Active card: `outline-2 outline-[#033882] outline-offset-2` + 3s hover-state lock. Title below card, turns `sky-500` on hover.

**Three-panel layout:** chart (1/2 or 1/3) + player (1/3) + team (1/3) render as flex siblings in `#app-panel-root`. Chart collapses to 1/3 when player or team panel opens. Clicking a player row navigates to `/charts/[chartSlug]/[playerSlug]`; team row to `/charts/[chartSlug]/team/[teamSlug]`.

**Panel components:** `PanelPlayer` → `PlayerPanelContent` (photo + info bar + stat accordions). `PanelTeam` → `TeamPanelContent` (photo + info bar + Season Records + Top Players + footer link). Both follow the same compact card pattern.

**Use this pattern whenever:** the secondary view requires its own DB queries or the full page component (chart detail, player profile full page, team detail full page). Use plain `AppPanel` + client fetch when the data is lightweight or already available.

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
| `scripts/scrape-boxscores.mjs` | **Generalized Newsday box score scraper.** Args: `<newsday-slug> <db-season>` |
| `scripts/ingest-boxscores.mjs` | **Generalized box score ingest.** Args: `<json-file> <db-team-slug> <season>` |

Run with: `node --env-file=.env.local scripts/<name>.mjs`

---

## Box Score Scraping Pipeline

### Newsday URL pattern by season
- **2025-26** (DB `season=2025`): no suffix
- **2024-25** (DB `season=2024`): append `/2025`
- **2023-24** (DB `season=2023`): append `/2024`
- **2022-23** (DB `season=2022`): append `/2023`
- **2021-22** (DB `season=2021`): append `/2022`

Formula: suffix = `/${DB_season + 1}`. Already handled automatically by `scrape-boxscores.mjs`.

### Full run for a single team + season
```bash
node scripts/scrape-boxscores.mjs longwood 2025
# → writes scripts/scraped/longwood-2025.json

node --env-file=.env.local scripts/ingest-boxscores.mjs scripts/scraped/longwood-2025.json longwood-varsity-football 2025
```

### Box score coverage (as of 2026-05-18)
| Season | Coverage |
|--------|----------|
| 2025-26 | 224/224 ✅ Complete |
| 2024-25 | 238/240 ✅ Complete |
| 2023-24 | 234/237 ✅ Complete |
| 2022-23 | 215/219 ✅ Complete (4 Nassau gaps) |
| 2021-22 | 197/203 ✅ Complete (6 Nassau/date-mismatch gaps) |

### **NEXT SESSION — resume here:**
1. Delete `/chat-2` (deprecated duplicate — superseded by `/chat` editorial pass on 2026-05-25)
2. Naming conventions audit (see below)
3. Remaining component extraction (see below — `PanelGameLog/Schedule/Season` done; still TODO: AccordionStatTable, HeroSlider, BreadcrumbNav, DownloadMenu, finish InfoTable family)
4. Explode `game_box_scores.player_stats` JSONB into relational table (see below)
5. Season card vs. game card width differences on the Section XI page (deferred — "we'll go over the differences tomorrow")

### Naming conventions audit — NEXT
The codebase has grown organically and needs a naming pass before it gets harder to navigate.

**Known inconsistencies to resolve:**
- Panel components: `PanelPlayer`, `PanelTeam` exist — but the parallel route pages that use them are in `@player` and `@team` slots. Naming should be consistent: if the component is `PanelTeam`, the slot wrapper should be `TeamPanelWrapper` (not `ChartsTeamWrapper`), etc.
- Chart wrapper files: `ChartsPanelWrapper`, `ChartsPlayerWrapper`, `ChartsTeamWrapper` — the "Charts" prefix couples these to the charts route. If we add panels to other routes (maps already has one), the naming breaks down.
- Shell vs Page: `/team/[slug]/Shell.tsx`, `/player/[slug]/Shell.tsx`, `/division/[slug]/Shell.tsx` — consistent, good. Keep this pattern.
- `InfoTable`, `InfoTableStandings` etc. — partially extracted, but not complete.

**Rule going forward:** `Panel{Entity}` for panel components, `{Entity}PanelContent` for the exported body, `{Route}{Entity}Wrapper` for client wrappers.

---

### Component extraction — NEXT
Several components are defined inline inside page/shell files and should be extracted to `src/components/` for reuse.

**Done (2026-05-25):**
- ✅ `PanelGameLog` — extracted from inline `AppPanel` render in `TeamShell.tsx`
- ✅ `PanelSchedule` — extracted alongside PanelGameLog
- ✅ `PanelSeason` — extracted alongside PanelGameLog

**Still TODO:**
- `AccordionStatTable` + `StatRow` — defined in `PanelPlayer.tsx`, duplicated in `PanelTeam.tsx`. Extract to `src/components/AccordionStatTable.tsx`.
- `HeroSlider` — defined inside `Shell.tsx` for teams and divisions. Extract to `src/components/HeroSlider.tsx`.
- `BreadcrumbNav` — appears in player Shell. Extract.
- `DownloadMenu` — appears in leaderboard. Extract.
- `InfoTable`, `InfoTableStandings`, `InfoTableProfile` — partially done, finish extraction.

---

### Explode game_box_scores.player_stats JSONB — NEXT
`game_box_scores.player_stats` is a raw JSONB blob scraped from Newsday. It is currently only used as a fallback in the Game Log side panel (`PanelPlayers`). It is **not** used for any stat rendering — `player_game_stats` (the proper relational table) handles all game stat tabs.

**The goal:** parse `player_stats` JSONB for all ingested games and insert the records into `player_game_stats`, matching players by name to their slug via the `players` table. This would:
- Fill gaps in `player_game_stats` for games where the structured ingest missed players
- Give every scraped player a `player_slug` so logos and profile links work everywhere
- Allow deprecating the JSONB fallback entirely

**Approach:**
1. Write a script `scripts/explode-player-stats.mjs` that:
   - Reads all `game_box_scores` rows where `player_stats IS NOT NULL`
   - For each player entry in the JSONB, fuzzy-matches the player name to `players.slug`
   - Inserts into `player_game_stats` (skip if already exists for that game_id + player_slug + stat_type)
2. Run once, verify coverage, then schedule as part of the ingest pipeline

**Risk:** name matching is imperfect — player names in the JSONB may not exactly match `players.player_name`. Use normalized comparison (lowercase, strip punctuation) and flag unmatched rows for manual review.

---


## Sidebar Structure (`src/components/Sidebar.tsx`)

Order (top → bottom):
1. **SportsGPT brand block** — Trophy icon + APP_NAME, `border border-[var(--border)]`, hover state. Styled like Log In button.
2. Launchpad (NAV_TOP[0])
3. Search button (opens CommandPalette)
4. Chat → Charts → Players → Teams (NAV_TOP.slice(1))
5. Divider
6. Gallery → Leaderboard (NAV_BOTTOM)
7. More... accordion (NAV_MORE: Maps, Schools, Divisions, Section XI)
8. Footer: Glossary, Admin, Log In

**AppLayout header:** Trophy, APP_NAME, and "|" separator removed. Only page title (bold) remains.

---

## Maps Page (`/maps`)

`src/components/SuffolkDistrictMap.tsx` — Google Maps Data layer with Suffolk County school district GeoJSON (from Blob).

- GeoJSON: `https://tmdolblsg0vd3laa.public.blob.vercel-storage.com/geojson/suffolk-schools.geojson`
- `DISTRICT_SCHOOLS` constant: maps `POPULAR_NA` field → school slug array. Includes 15+ feeder districts (Amagansett, Montauk, Oysterponds, Shelter Island, Southold, Mattituck-Cutchogue, Bridgehampton, Sag Harbor, Wainscott, Sagaponack, Springs, East Quogue, Quogue, Remsenburg-Speonk, East Moriches, Tuckahoe Comn, etc.).
- Fill color: `SCHOOL_COLORS[slug].primary` from `src/lib/school-colors.ts`
- Hover: cursor-following tooltip with school logo, division, all-time W-L
- Click: `router.push('/maps/[team-slug]', { scroll: false })` → opens AppPanel parallel route

**Maps parallel route** (`/maps/[team-slug]`):
```
src/app/maps/
  layout.tsx          ← AppLayout + MapsPanelWrapper
  page.tsx            ← SuffolkDistrictMap (no AppLayout)
  default.tsx         ← re-exports page.tsx
  MapsPanelWrapper.tsx ← 'use client'; reads slug from pathname, opens AppPanel
  @panel/
    default.tsx       ← returns null
    [slug]/page.tsx   ← same DB queries as /team/[slug], renders TeamShell panelMode
```
Nav arrows (‹ ›) in panelMode push to `/maps/[next-slug]` — panel updates in place, map stays live.

---

## Team Shell (`/team/[slug]/Shell.tsx`)

### panelMode
`TeamShell` accepts `panelMode?: boolean`. When true: skips `AppLayout` (via `MaybeLayout` helper), used by `/maps/@panel/[slug]/page.tsx`. Nav arrows push to `/maps/[slug]` instead of `/team/[slug]`.

### Hero Slider
- `heroSlides`: always starts with a color placeholder (slide 0: `SCHOOL_COLORS[slug].primary` bg + school logo centered + drop shadow)
- Followed by all `TEAM_PHOTOS[schoolSlug]` entries
- Auto-advances every 4s; cross-fade 700ms; ‹ › arrow buttons; dot indicators
- Teams with no photos: placeholder only (no arrows)

### RevealFx Animation (`src/components/RevealFx.tsx`)
Replicates once-ui's mask+blur reveal. Applied to each Shell section with staggered delays:
- Header: `delay=0, translateY=4, className="pt-8 -mt-8"` (extra padding so tooltips stay within mask)
- Hero slider: `delay=0.15, translateY=16`
- Profiles/stats: `delay=0.3, translateY=8`
- Top Players: `delay=0.42, translateY=8`
- Division Standings: `delay=0.52, translateY=8`

CSS technique: `mask-image: linear-gradient(to right, black 0%, black 25%, transparent 50%)` + `mask-size: 400%` sweeps from hidden (mask-position: 100%) to revealed (0%). Combined with `filter: blur(10px)→none` and `translateY`. Filter set to `none` only after `mask-position` transition ends (avoids breaking sticky table headers prematurely).

---

## App Config (`src/lib/app-config.ts`)

All brand, nav, routing strings here.

```
SIDEBAR_NAV_TOP:    [Launchpad, Chat, Charts, Players, Teams]
SIDEBAR_NAV_BOTTOM: [Gallery, Leaderboard]
SIDEBAR_NAV_MORE:   [Maps, Schools, Divisions, Section XI]   ← new export
```
