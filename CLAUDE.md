@AGENTS.md

---

# SportsGPT

**Purpose:** NY high school sports intelligence — starting with Section XI football.
**Stack:** Next.js 16 (App Router, Turbopack), Neon Postgres, Tailwind v4, Google Maps, lucide-react, recharts.
**Repo:** https://github.com/nyd-user-1/sportsgpt

---

## ⚠ TEMPLATE NOTICE — Read this before writing any code

This repo is also the canonical "clone and swap" template for new GPT apps.
The goal: clone → edit config → connect DB → ship. No hunting through components.

### Step 1 — Brand (edit ONE file + ONE component)

**`src/lib/app-config.ts`** — every brand/nav string lives here:
- `APP_NAME`, `APP_TAGLINE`, `ACCENT_COLOR` — app identity
- `CHAT_PLACEHOLDER`, `CHAT_PLACEHOLDER_PANEL`, `CHAT_PANEL_INTRO` — all input placeholders
- `CHART_NAV_EVENT` — namespace to match the new app
- `SIDEBAR_NAV_TOP/BOTTOM`, `SIDEBAR_DATA_ITEMS`, `SIDEBAR_MAP_ITEMS` — all nav
- `PATH_NAV`, `PATH_TITLE`, `NAV_CYCLE` — routing/header labels

**`src/components/AppLogo.tsx`** — swap the icon (currently `Trophy` from lucide-react).

**`src/app/layout.tsx`** — already imports `APP_NAME`/`APP_TAGLINE` from app-config. No edit needed.

### Step 2 — Domain content files (replace wholesale, don't parameterize)

These files have a `// REPLACE FOR NEW DOMAIN` header. They ship as empty stubs.
The app builds and renders cleanly with empty arrays — that's intentional.

| File | What to put there |
|------|-------------------|
| `src/lib/chart-configs.ts` | One `ChartConfig` entry per chart you want |
| `src/lib/glossary-terms.ts` | `GlossaryTerm[]` for your data model |
| `src/lib/launchpad-data.ts` | `LAUNCHPAD_TABS` + `LAUNCHPAD_ITEMS` for the Launchpad card grid |
| `src/lib/dummy-locations.ts` | Placeholder rows for detail pages before real DB data exists |
| `src/app/chart/[slug]/page.tsx` | One `case` per chart slug with your DB queries |

### Step 3 — Database

- Create a new Neon project at neon.tech
- Add `DATABASE_URL` to `.env.local` and Vercel (Production + Preview + Development)
- `src/lib/db.ts` uses a lazy placeholder connection — it will NOT throw at build time if `DATABASE_URL` is missing, but queries will fail at runtime until a real URL is set
- Write your schema and ingest scripts in `scripts/`

### Step 4 — Write a new CLAUDE.md

Replace this template notice section with your app's specifics:
- Production URL
- DB schema and table names
- API routes
- Page structure
- Domain rules

---

## Build Rules (learned the hard way)

### Every page that queries the DB must export `force-dynamic`

```ts
export const dynamic = 'force-dynamic'
```

Without this, Next.js tries to statically pre-render the page at build time and
hits the DB — which fails when `DATABASE_URL` isn't connected yet. All 10 DB
pages in this repo already have it. Any new page you add that calls `sql` needs it.

### Use `npm run build` (not `tsc --noEmit`) before pushing

The Vercel build catches things `tsc` doesn't. Always run `npm run build` locally
before pushing when you've made structural changes.

### `getAdjacentSlugs` is safe with empty `CHART_CONFIGS`

It returns `{ prevSlug: '', nextSlug: '' }` when the array is empty.

---

## What NOT to touch (reuse as-is)

| File | Why |
|------|-----|
| `src/components/AppLayout.tsx` | Reads entirely from app-config |
| `src/components/Sidebar.tsx` | Reads entirely from app-config |
| `src/components/AppPanel.tsx` | Generic shell |
| `src/components/PanelChart.tsx`, `PanelMap.tsx`, `PanelChat.tsx` | Generic panels |
| `src/components/MiniCharts.tsx` | Generic recharts wrappers |
| `src/components/CardCarousel.tsx`, `CardCarouselPortrait.tsx` | Generic carousels |
| `src/components/PlusMenu.tsx`, `ChatInput.tsx` | Generic input UI |
| `src/app/globals.css` | CSS vars and base styles |
| `src/lib/utils.ts` | `cn()` helper |
| `src/lib/ny-counties.ts` | GeoJSON county data for maps |

---

## File Map — Domain Content vs Reusable Shell

```
src/lib/
  app-config.ts          ← EDIT THIS (brand + nav)
  chart-configs.ts       ← REPLACE (your charts)
  glossary-terms.ts      ← REPLACE (your terms)
  launchpad-data.ts      ← REPLACE (your launchpad cards)
  dummy-locations.ts     ← REPLACE (your placeholder data)
  db.ts                  ← keep (just reads DATABASE_URL)
  utils.ts               ← keep
  ny-counties.ts         ← keep (or replace if not NY)

src/components/
  AppLogo.tsx            ← EDIT THIS (your icon)
  AppLayout.tsx          ← keep (reads app-config)
  Sidebar.tsx            ← keep (reads app-config)
  PanelChat.tsx          ← keep (reads app-config)
  everything else        ← keep

src/app/
  layout.tsx             ← keep (reads app-config)
  page.tsx               ← keep (reads app-config + AppLogo)
  chart/[slug]/page.tsx  ← REPLACE switch body (your DB queries)
  charts/page.tsx        ← keep (renders CHART_CONFIGS, empty = blank grid)
  glossary/page.tsx      ← keep (renders GLOSSARY_TERMS, empty = blank)
  launchpad/
    ProviderSection.tsx  ← keep (reads launchpad-data)
    page.tsx             ← keep
  county/, facility/, city/, zip/, zip-code/  ← REPLACE with your entity pages
  maps/page.tsx          ← REPLACE with your map data
```

---

## Database & API Infrastructure (SportsGPT)

### Neon Postgres
Connection via `DATABASE_URL` env var.
Client: `@neondatabase/serverless` — import `sql` from `@/lib/db`.

*DB schema and tables to be documented here once connected.*

### Google Maps
Requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local` and Vercel.

### GeoJSON
Map components fetch from `https://raw.githubusercontent.com/nyd-user-1/nyd-geojson/main/`:
- `us-counties.geojson` — all US counties, FIPS-keyed
- `us-states.geojson` — all 50 states + DC
- `ny-assembly-districts.geojson`, `ny-senate-districts.geojson`

---

## Naming Conventions (inherited from ChildcareGPT, adapt as needed)

### Components
| Name | Description |
|------|-------------|
| `AppLayout` | Root shell with sidebar + header |
| `AppPanel` | Slide-out panel shell (header, scrollable body, footer slot) |
| `PanelChart` / `PanelMap` / `PanelChat` | Panel implementations |
| `CardLandscape` / `CardLandscapeMini` | Gradient cards |
| `DataTable` | Sticky-column scrollable table (index pages) |
| `DataTableMini` | Compact zebra table (Launchpad) |
| `InfoTable[Entity]` | Accordion profile card on detail pages |
| `TabGroup` | Underline tab nav bar |
| `ButtonGroup` | Prev/Next/Chart/Map/Chat buttons on detail page headers |

### Pages
| Pattern | Route |
|---------|-------|
| `IndexPage[Entity]` | `/entity` |
| `DetailPage[Entity]` | `/entity/[slug]` |
| `DetailSlot[Entity]` | Parallel `@detail` slot on Launchpad |
