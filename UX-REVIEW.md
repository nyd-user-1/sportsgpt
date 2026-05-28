# SportsGPT — UX & Value Review

_Overnight review + two new designed features. Prioritized: **[Quick]** = hours, **[Med]** = a day-ish, **[Big]** = multi-session._

---

## Built tonight (in the editorial paper-palette system)

### 1. The Sideline — on-every-page chat widget
`src/components/SidelineChat.tsx`, mounted globally in `src/app/layout.tsx` (next to `CommandPalette`).
- Floating launcher (bottom-right) with a live pulse dot → expands to a compact community chat panel (seeded messages + composer, Escape to close).
- Fraunces names, DM Sans meta, mono timestamps, hairline rules — fits the system.
- **Prototype:** messages append locally only. To go live: a `messages` table (or a realtime service) + sign-in (next-auth is already in place). Optional: an "Ask AI" toggle that routes the same composer to `/api/chat` so the widget is both community + assistant.

### 2. The Press Box — discussion board
`src/app/board/` (`page.tsx` + `Board.tsx`) + `src/lib/board-data.ts`. Reachable at **`/board`**.
- Editorial thread list (pinned + tag filters: Game Day, Division I, Rankings, History, Recruiting), thread opens in an `AppPanel` (the app's stay-on-page pattern) with OP + replies + reply composer, plus a "Start a discussion" composer.
- **Prototype:** seeded threads, session-local. To go live: `board_threads` / `board_posts` tables keyed to a signed-in user, plus moderation basics. Add `/board` to the sidebar (`SIDEBAR_NAV_MORE` in `app-config.ts`) and a `PATH_TITLE` entry when you're ready to surface it.

---

## Chat — the biggest opportunity (you flagged it, and I agree)

The `/chat` AI assistant is solid (streaming, tool loops, model fallbacks) but ephemeral and disconnected from the rest of the app. Highest-leverage upgrades:

- **[Quick] Persist conversations.** Right now a refresh wipes the thread. Save to `localStorage` first (history list + "new chat"), then a DB table for signed-in users.
- **[Quick] Page-aware context.** When on `/team/floyd-...` or a player page, seed the chat with that entity ("Ask about Floyd"). Pass the current route's entity into the system prompt so "how'd they do last year?" just works.
- **[Med] Rich inline answers, not markdown tables.** You already ship `recharts` + editorial tables. Have tool results render as real mini-tables / a small bar chart / a team card instead of a markdown table — far more on-brand and legible.
- **[Med] Citations that link back.** When the model cites a stat, link the number to the page/table it came from (`/team/...`, `/leaderboard`). Builds trust and drives navigation.
- **[Quick] Answer actions.** Copy, regenerate, "continue in the Press Box," and 👍/👎 feedback (capture to improve prompts).
- **[Med] Tool transparency.** A subtle chip ("ran get_standings · Division II") so users see the assistant is querying real data, not hallucinating.
- **[Big] Compare via chat.** "Compare Floyd 2024 vs Sayville 2022" → render the same head-to-head diff we just built for the team Versus panel. Chat becomes a front door to every feature.
- **[Quick] Bridge the two chats.** The Sideline widget + `/chat` should share a visual language and let users hop between "ask the AI" and "ask the section."

---

## Table downloads (you flagged this)

A reusable export affordance on every data table. There's already a `DownloadMenu` on `/leaderboard` (per project notes) — extract and standardize it.

- **[Quick] Extract `DownloadMenu`** to `src/components/` and drop it on every table: Leaderboard, Team Season Index, Player index, Division standings, team schedule, game stat tabs.
- **[Quick] CSV of the *current view*.** Export must respect the active filters/sort/search/season — export what the user sees, not the raw dump.
- **[Quick] "Copy as Markdown"** for pasting into Slack/Notes/forums (pairs nicely with the Press Box).
- **[Med] Share-card PNG.** Render a comparison (Versus panel, a team-season, the honeycomb) to a branded image for sharing — high virality for a HS-sports community.

---

## Broader UX audit

- **[Quick] Make Team Versus shareable.** The leaderboard Versus uses `?a=&b=` URL params (shareable); the new team Versus uses client state. Move it to URL params so "look at this matchup" links work.
- **[Quick] Respect `prefers-reduced-motion`.** `RevealFx` + the gallery view-transition ripple should no-op for users who opt out (accessibility + less jank on low-end devices).
- **[Quick] Stat-color accessibility.** Green/red for win/loss differential relies on color alone — add a sign/glyph or weight so it reads for colorblind users (the diff already uses +/−; extend that everywhere).
- **[Med] Loading skeletons everywhere.** The launchpad season-swap got a skeleton; standardize a skeleton for every `force-dynamic` table so first paint isn't a blank tablet.
- **[Med] Data-freshness signal.** A small "updated {date}" or "2025-26 season · in progress" marker so users trust currency (you ingest box scores continually).
- **[Med] Mobile pass on dense tables + the Versus chips.** Confirm the assign chips and the honeycomb behave at 390px; the desktop-only `sm:` toggles (launchpad view cycle) need a mobile affordance.
- **[Big] Onboarding / "what is this".** A first-run pass (or a `/about` almanac page) explaining Section XI, the divisions, and what the indices mean — the editorial voice is perfect for it.
- **[Big] Accounts → personalization.** With sign-in: favorite teams, a personalized home, notify on game results, and it unlocks the Sideline + Press Box for real.

---

## Suggested order

1. **[Quick] this week:** extract `DownloadMenu` + CSV-of-current-view across tables; persist chat to localStorage; page-aware chat context; team-Versus URL params; reduced-motion guard.
2. **[Med] next:** rich inline chat answers + citations; share-card PNG export; loading skeletons; freshness markers.
3. **[Big] the bets:** accounts/personalization, the live Press Box + Sideline backend, and "compare via chat."

_Both features built tonight are committed and live on the dev server — `/board` and the floating Sideline on every page. Eyeball them and tell me which to make real first._
