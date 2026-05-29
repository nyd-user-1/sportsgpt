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

## Vocabulary Rules

- **Never call a button a "pill."** A *pill* is a filter chip (e.g. division/season selectors that toggle a view). A *button* triggers an action (open a panel, navigate, submit). Even when a button is rounded and looks pill-shaped, it is still a button — describe it as a button, button group, or chip if it really is filter UI.

## Accurate Explanations

- **No rationalizing mistakes as design intent.** When a visual issue (wrong color, broken layout, off contrast) shows up, the explanation must be the actual cause — usually a bug in the code I just wrote (Tailwind syntax that doesn't compose, opacity on a CSS-var color that produces an unexpected cast, a missed token, a typo). Do not retroactively frame a bug as a deliberate styling choice. If I'm not sure of the cause, say "I'm not sure why that's happening — let me investigate" before guessing.
- **Own it, then fix it.** "I shipped the wrong color because X — switching to the proper token Y" beats "the muted treatment was on purpose" every time.

## Design System Discipline

- **This project has a design system, even if loosely defined.** The paper palette, editorial components in `src/components/editorial/`, the SortTh / Tablet / DivisionTabs / SectionHead primitives, the `paper-link` utility, and the CSS variables in `globals.css` are the design system. Use them.
- Reach for the existing token before introducing a one-off. Need muted text? `--paper-muted`, not `text-[var(--paper-text)]/75`. Need a divider? `--paper-rule` / `--paper-rule-soft`, not a custom `border-zinc-700/40`. Need a tab bar? `DivisionTabs`, not a hand-rolled `<div>` with custom borders.
- When the design system is missing a primitive a page actually needs, extract a new shared component into `src/components/editorial/` rather than writing one-off styling inline. Future pages will reuse it.
- One-off styling we ship today is rework tomorrow when the next page wants the same effect.

## Link Standard

Every in-content link on a paper-palette surface uses this className:

```tsx
<Link href="..." className="text-[var(--paper-text)] hover:text-[var(--paper-strong)] hover:underline transition-colors">…</Link>
```

Base color is `--paper-text` (cream in dark mode), hover flips to `--paper-strong` (blue) and adds an underline. The underline inherits the current text color so it stays blue on hover. Combine freely with layout classes (`truncate`, `whitespace-nowrap`, `block`, etc.). Do not introduce alternate underline color schemes for in-content links.

## Editorial Migration Pattern

Pages are being rebuilt in the editorial voice via parallel `/foo-2` routes that ship side-by-side with the legacy `/foo`, then retire the legacy once approved. **Active migrations:**

- `/team-2` (Teams index) — editorial, ships next to legacy `/team`; old `TeamTable.tsx` will retire.
- `/charts-2` (`ChartsAlmanac.tsx`) — editorial "table of figures" treatment of `/charts`. Three chapter sections (Team & Season / Player & Position / Game Records), 4-col card grid (no 6-col breakpoint per user feedback), full-color photos with subtle `brightness-110` hover. Re-exports the chart detail parallel routes from `/charts/@panel`, `/charts/@player`, `/charts/@team` so the detail panel tree isn't duplicated.

Shared SQL between `/charts` and `/charts-2`: `src/lib/chart-leaders.ts` exposes `fetchChartLeaders()` returning `Record<chartSlug, top3SchoolSlugs>`.

## Shared Editorial Components (`src/components/editorial/`)

Component additions beyond the original system:

- **`SearchButtonGroup`** — five-cell connected pill that sits in every sticky toolbar. Cells: `[Search → ⌘K palette]` + Anthropic + OpenAI + Google + Grok (Grok is sometimes removed, see git history). Logos pulled from `gallery/logos/ai/` blob CDN with `dark:invert` filter so dark icons render visible in dark mode. Cells 2-5 are model-provider placeholders (no click handlers wired). Replaces the old right-side counter chip on every editorial sticky bar.
- **`CmdKButton`**, **`AIButton`** — earlier solo-button versions, superseded by `SearchButtonGroup`. Still exported in case a page needs them individually.
- **`CmdKAIGroup`** — alternate two-cell `[AI │ ⌘K]` variant, also superseded.

## Editorial Panel Conventions

Every `AppPanel` rendered in editorial mode follows two rules:

1. **Sticky footer identifier.** Every panel has a footer slot with a 10px DM Sans uppercase `tracking-[0.24em]` `--paper-faint` label identifying the panel type — `GAME LOG PANEL`, `GAME DETAIL PANEL`, `SEASONS PANEL`, `SCHEDULE PANEL`, `GAME HIGHLIGHTS PANEL`, `TEAM PANEL`, `PLAYER PANEL`. No trailing "View full X page ↗" link in the footer — the link, if present, lives inline in the panel body.
2. **Header structure.** When `canGoBack === false` (top-level view): `[logo] {team name as link to /team/{slug}}`. When `canGoBack === true` (drill-down view): `[← back] {team name as link}`. The team name is *always* a `Link` to `/team/{slug}-varsity-football` with `hover:text-[var(--paper-strong)]`.

## Charts Almanac (`/charts-2`)

- `ChartsAlmanac.tsx` is the editorial component.
- Standard `EditorialButtonGroup` lives in the masthead `rightSlot` (Charts / Players / Ask SportsGPT) with prev/next chevrons wired to last/first chart slug.
- `SearchInput` is wired and filters chart titles by query (`useSearchHotkey` listens for `⌘/`).
- Chapter filter tabs (All / Team & Season / Player & Position / Game Records) above the grid.
- Card click → `/charts-2/[slug]` opens chart detail via the `@panel` parallel route.

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
| `school_year_stats` | `school_slug`, `year` (NYSED year, e.g. 2025 = 2024-25), per-grade enrollment, demographics, grad-rate/diploma cols, **Report Card cols:** `attendance_level`, `chronic_abs_rate`, `cccr_index/level`, `perf_ela/math/sci_idx`, `exp_per_pupil`, `inexp_teach_pct`, `out_of_cert_pct`, `grad_4yr/5yr/6yr_rate` |
| `school_regents_results` | `school_slug`, `year`, `subject` (canonical), `sort_order`, `tested`, `num_prof`, `pct_prof`, `pct_l1..pct_l5`. PK `(school_slug, year, subject)`. One row per school/year/subject; main HS building only, deduped by max `tested`. |
| `search_clicks` | `query_stem`, `result_key`, `result_type`, `result_label`, `count`, `updated_at`. PK `(query_stem, result_key)`. Aggregated click-learning leaderboard — **hard-capped at 50 rows** (LFU eviction). Created by `scripts/create-search-clicks.mjs`. See "Site-Wide Search → Click-learning". |

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
| `/team` | `Shell.tsx` (`TeamMagazineShell`, "Season Index") | Editorial **Season Index** — every team-season is a row; **defaults to All Seasons**. Division tabs + search + sort. **Versus mode**: "Vs." toggle → assign two team-seasons (Team 1/Team 2 chips) → `PanelCompareTeam` head-to-head diff (client-side from loaded rows, no parallel route). Legacy `TeamTable.tsx` retired. |
| `/player` | `PlayerIndexTable.tsx` | All 307 players, searchable, sortable; career stats: Tot Yds, Pass, Rush, Rec, TD, INT |
| `/leaderboard` | `Shell.tsx` (`LeaderboardYearbook`, the "Yearbook") | Editorial top-25/season; Passing/Rushing/Receiving; season stepper + division tabs + search; **Versus** (`@compare` parallel route → `PanelCompare`). `leaderboard-2` was **retired INTO** this route — editorial replaced legacy `LeaderboardTable.tsx`. Passing has YPC/YVA; Rushing has TDs-G/R-EXP. |
| `/honeycomb` | `Honeycomb.tsx` (`HoneycombMap`) | Single geographic hex map of all 52 programs (one cell each, school-colored + logo), positioned from Suffolk district centroids (`src/lib/section-hex-layout.ts`). Division tabs highlight/dim. Cell click → `ChatSeasonsPanel`. Also embedded as a Launchpad slide — see below. |
| `/board` | `Board.tsx` ("The Press Box") | **Prototype** discussion board (tag filters, pinned threads, `AppPanel` thread view + reply/compose). Seeded via `src/lib/board-data.ts`, session-local — needs `board_threads`/`board_posts` + next-auth to go live. |
| `/school` | `src/app/school/` | School index |
| `/gallery` | `src/app/gallery/` | Blob-backed masonry grid + lightbox; dark/light toggle with View Transition ripple |
| `/chat` | `src/app/chat/page.tsx` | AI chat — paperMode + grain overlay. Empty: `SECTION XI · FOOTBALL` eyebrow, Fraunces APP_NAME, ruled line, ChatInput, italic serif tagline, CardCarousel. Active: scrollable thread + bottom-pinned input. Uses `useChat`, `ChatInput`, `ChatMessage`, `CardCarousel`, `ChatSeasonsPanel`. **`/chat-2` is a deprecated duplicate — safe to delete.** |
| `/search` | `page.tsx` + `Shell.tsx` (`SearchShell`) | Editorial site-wide search results page — hero input, scope pills, score-ranked category sections (Players outrank Teams for a player name), player hub card. Ranks via shared `src/lib/search.ts` + click-learning boost. `robots: noindex`. See "Site-Wide Search". |
| `/chat-3` | `page.tsx` + `Shell.tsx` (`Chat3Shell`) | Same search-style picker UI titled "Chat" — type → filter results → click one to send a smart per-type prompt (`promptFor`); page collapses ("Chat" to top, input up, thread below) and reuses `useChat`/`ChatMessage`/`ChatInput`/`ChatSeasonsPanel`. A `-3` rebuild — decide whether to retire `/chat` into it. `robots: noindex`. |

### Detail pages

| Route | File | Notes |
|-------|------|-------|
| `/team/[slug]` | `Shell.tsx` | Hero photo SLIDER (auto-advance 4s, color placeholder slide 0, arrows), RevealFx stagger animation, Profiles carousel, Division Standings |
| `/player/[slug]` | `Shell.tsx` | Season tabs (Total + per-season) with ← → arrow key nav; Total tab = career StatTable with All Seasons rollup; season tab = game log InfoTable (from `games`+`game_box_scores` JSONB matched by player name); breadcrumbs: Team / Position / Player below H1; RevealFx animations |
| `/school/[slug]` | `Shell.tsx` + `page.tsx` | Enrollment, Grad Rate (+ Cohort Completion sub-table), **Report Card chapter** (4 themed sub-tables), Academic, Demographic, Need, Trend, Football, Division. Year-row tables share a `selectedYear` (click a row to select); see "School Detail — Report Card" below. |
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
- Data: `/api/search` — fetched once on first open, cached in ref. Payload now also carries a `boost` click-learning map (see below).
- Navigation: `router.push(href)` only — no `close()` call; palette closes naturally when new URL lacks `?cmd=open`
- Added to: root layout (`layout.tsx`) + Sidebar Search button

---

## Site-Wide Search (`src/lib/search.ts`)

**`src/lib/search.ts` is the single source of truth for all search ranking.** Three surfaces consume it and rank identically: the ⌘K `CommandPalette`, the `/search` results page, and the `/chat-3` prompt picker. Never fork ranking logic into a surface — change it here.

### Engine
- **`matchScore(query, text, mode)`** — `-1` exact · `0` prefix · whole-query substring (index) · token tiers · `Infinity` miss. Uses capped Damerau-Levenshtein (`editDistance`) for ≤1-typo `fuzzyTokenHit` (exact required for tokens <4 chars).
- **AND vs OR.** Default is **AND**: every token must hit (so "joseph fi" → only Joseph Filardi, not every Joseph). **OR** only when an explicit matchup connector is present (`vs / v / versus / at / @ / &`) so both sides of "Floyd vs Sayville" surface. Filler (`the/and/or/a/of`) is dropped but does NOT trigger OR. Anchor rule: a purely-fuzzy multi-token match is rejected.
- **`tokenizeQuery(query)`** → `{ tokens, matchup }`.
- **`expandPositions(pos)`** — `qb`/`quarterback`/`quart` all hit QBs; compound positions (`WR/DB`, `OL-DL`) split + each part expanded via `POSITION_WORDS`.
- **`buildResults(data, query)`** → `GroupedResults` (divisions, charts, teams, games, players, schools, seasons). Teams match name + school-name alias + division; players match name (clean) or name+school+position alias (+10 penalty); seasons loop `AVAILABLE_SEASONS` and link to `/team?season=YEAR` (a season is a team-first stat — `/team` reads `?season=`); games match "Home vs Away" + season label/year.
- **Player hub card** — `dominantPlayer(players, topTeamScore?)` decides whether a query resolves to one specific person (or a tight surname family ≤ `MAX_HUB_BAND`) and returns a representative (prefers one with a known position). Gated: clean NAME hits only (score < 10), small band, and defers to a team that matches as well (so "floyd" → the Floyd *team*, not Andrew Floyd). `PlayerHubCard` + `buildPlayerHub()` (`src/components/PlayerHubCard.tsx`) render the team/school/recent-games hub above results.

### Click-learning (ranking refines from real picks)
- **Table `search_clicks`** — aggregated **LFU leaderboard, hard-capped at 50 rows** (so it never bloats). PK `(query_stem, result_key)`; cols `result_type`, `result_label`, `count`, `updated_at`. Created by `scripts/create-search-clicks.mjs`.
- **`queryStem(query)`** (in `search.ts`) — lowercase + drop filler/connectors + **sort** the meaningful tokens, so "joseph filardi" and "filardi joseph" pool into one bucket. Prefix typing ("joseph fil") gets its own bucket by design.
- **Logging** — `POST /api/search-click` (atomic `INSERT … ON CONFLICT DO UPDATE count = count+1`, then LFU eviction: `DELETE … WHERE (stem,key) = (SELECT … ORDER BY count DESC, updated_at DESC OFFSET 50 LIMIT 1)` — no-op until over cap, single row even on ties). Client helper `logSearchClick(query, r)` in `src/lib/search-click.ts` (fire-and-forget, `keepalive`). **Only result-card clicks log** — never recents, quick-nav, hub headers, or empty-state browse cards.
- **Boost application** — the boost map (`query_stem → result_key → count`) is folded into the `/api/search` payload (palette) and fetched server-side in the `/search` + `/chat-3` page loaders. `applyClickBoost(grouped, query, boost)` re-ranks each category with clicks as a **SECONDARY sort key**: `a.score - b.score || clicks(b) - clicks(a)`. Relevance always wins; clicks only break ties, and only at ≥ `MIN_BOOST_CLICKS` (2). This floats the popular Filardi above his tied sibling without ever letting a weak match leapfrog a stronger one.
- **Cap is `MAX_LOGGED_ROWS = 50`** at the top of the route — edit there to retune.

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

## School Detail — Report Card (`/school/[slug]/Shell.tsx`)

The Report Card chapter follows the **player Stats chapter pattern**: one
`<section>` + `SectionHead`, then per-theme `SubSectionHead` + table. Two
module-scope helpers in `Shell.tsx` keep the tables DRY:

- **`RcYearTable`** — chronological year-rows; takes `RcCol[]` column defs
  (`{ label, get, fmt?, strong? }`). Rows are clickable and call `onSelectYear`,
  sharing the page's `selectedYear` (same active-row highlight as Enrollment/Grad Rate).
- **`RegentsTable`** — subject-rows for one year (Subject | Tested | L1–L5 | Prof %).
  Reflects (does **not** set) `selectedYear` via the `regentsForYear` memo.

**Four Report Card sub-tables:** Academic Performance (ELA/Math/Sci core index,
Perf Avg, CCCR Index/Level) · Regents Exams (selected year) · Attendance &
Absenteeism · Spending & Staffing. CCCR + attendance_level are **2024-25-only**
in source → sparse columns by design.

**Grad Rate section** has its own "Cohort Completion · 4/5/6-Year" sub-table.
⚠ **Two grad sources, do not reconcile:** `grad_pct` (diploma table) is the
August-final 4-yr outcome from the earlier enrollment/grad ingest; the Cohort
Completion 4/5/6-yr rates come from the Report Card source. Different methodologies —
keep them in separate sub-tables. The 4/5/6 within one reporting year are
*different entering cohorts*, so non-monotonic rows (6-Yr < 5-Yr) are correct.
Data provenance + `.mdb` source location: see the Report Card ingest scripts above.

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
| `scripts/extract-suffolk-reportcard.py` | Reads NYSED Report Card `.mdb` files (via `mdb-tools`) → `scripts/data/enrollment/suffolk-report-card.csv` (wide accountability + grad cohorts) + `suffolk-regents.csv` (per-subject). Source `.mdb`s live OUTSIDE the repo at `/code/education/Report Card/`. Run: `python3 scripts/extract-suffolk-reportcard.py` |
| `scripts/ingest-reportcard.mjs` | Ingests both CSVs → adds Report Card cols to `school_year_stats` + populates `school_regents_results` (subject normalization + dedupe by max tested). Run: `node --env-file=.env.local scripts/ingest-reportcard.mjs` |

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

---

## 2026-05-28 additions (Honeycomb, Versus, Board, Sideline, slug hygiene)

### Launchpad Honeycomb slide (`/launchpad`)
`/launchpad` is a **two-slide deck**. The division-tab row (`LaunchpadTabs`) stays; the body below swaps between the standings+hero+cards view and the Honeycomb, driven by `?view=honeycomb`. `LaunchpadTabs` has a **chevron view-cycle** (‹ Launchpad / Honeycomb ›) that sets the param; `LaunchpadDeck.tsx` reads it and `RevealFx`-swaps the content (keyed by `view` so the reveal replays). The `?div` filter applies to both slides. `layout.tsx` calls `fetchSectionSchools()` and passes them in; the Honeycomb is `HoneycombMap` (shared with `/honeycomb`).

### Honeycomb map (`HoneycombMap`, `src/app/honeycomb/Honeycomb.tsx`)
One SVG, 52 pointy-top hex cells. Positions live in `src/lib/section-hex-layout.ts` (`HEX_LAYOUT: slug → [col,row]`, `HEX_COLS`/`HEX_ROWS`) — derived once from Suffolk district GeoJSON centroids, then hand-tuned. **Edit that table to nudge placements.** Cell = school primary color + white logo medallion; hover = brightness + record tooltip (no zoom); division tabs dim non-active. SVG capped `maxWidth: 1350` so it doesn't balloon in the full-width launchpad container. Cell click → `ChatSeasonsPanel` — **pass the school slug, not the team slug** (`/api/team/[slug]/records` + `/schedule` append `-varsity-football` themselves).

### Team Versus (`src/components/PanelCompareTeam.tsx`)
`/team` Season Index Versus toggle assigns two team-seasons → `PanelCompareTeam`, a client `AppPanel` that diffs them (record, win %, GP, PF, PA, Diff, Conf) with winner highlighting — fed from the index's already-loaded rows (no server fetch / parallel route, unlike the player `@compare`).

### Player slug hygiene (was breaking `/player/null`)
`player_game_stats` had NULL `player_slug`s; `player_season_stats` had malformed no-hyphen slugs (e.g. `nicksevilla`) → broken `/player/...` links.
- **Query-time fix:** `/team/[slug]/page.tsx` resolves a valid slug via `COALESCE(slug, <players.slug by collapsed-whitespace name+school>)` for Player Logs + Top Players; the Shell renders **plain text** when no slug resolves.
- **Data scripts (idempotent, dry-run default, `--apply` to write):** `scripts/backfill-player-game-slugs.mjs`, `scripts/reconcile-season-stat-slugs.mjs`, `scripts/dedup-orphan-season-stats.mjs`.
- **Review queue:** `/admin` "Needs Review" (via `/api/admin/status`) lists players with no `players` row + season-stat slug conflicts.
- **Invariant:** canonical slug = `players.slug` (`first-last` kebab); `player_game_stats`/`player_season_stats` must match it — box-score ingest should name-match to `players`, never mint its own slug.

### School district name (`src/lib/school-districts.ts`)
`/school` masthead shows the proper district (e.g. "Bay Shore Union Free School District"). **Not in the DB** (`schools.name` is the short name; report-card ingest kept only `entity_cd`). `SCHOOL_DISTRICTS: slug → name` is sourced from the GeoJSON district names (`POPULAR_NA`, same source as `/maps`), UFSD/CSD expanded, co-ops labelled.

### Sideline chat widget (`src/components/SidelineChat.tsx`)
Global floating community-chat widget, mounted in **root `layout.tsx`** (beside `CommandPalette`) so it's on every page. **Prototype** — seeded/session-local; needs a messages backend + next-auth.

### ⚠ BUILD CHECK — run `npm run build` before pushing
Turbopack (the dev server) does **NOT** full type-check. A `string | null` type error rendered fine on the dev server (all curl checks passed) but **failed every `next build` on Vercel**, silently stalling prod on an old build for hours. Dev-server/curl checks are NOT sufficient — run `npm run build` (or at least `tsc --noEmit`) before pushing, and confirm the Vercel deploy goes green.

### Two-terminal hygiene
This repo is frequently edited by two Claude terminals in the same working tree. **Check `git status` before editing**, commit only your own files via explicit pathspec (`git commit -- <paths>`), and never commit another terminal's staged/in-flight files. A globally-mounted file (e.g. `CommandPalette`) with even a transient compile error 500s every page.
