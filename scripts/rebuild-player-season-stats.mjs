#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────────
// scripts/rebuild-player-season-stats.mjs
//
// PURPOSE — additive-only backfill
// --------------------------------
// `player_season_stats` is the Newsday top-25 leaderboard for each season —
// it's a blessed reference table, not a computed aggregate. Those rows MUST
// be preserved.
//
// Separately, `player_game_stats` has granular per-game player data scraped
// from box scores. Coverage is partial (not every game has a box score), but
// it contains thousands of players who never cracked the Newsday top-25 and
// therefore have no row in `player_season_stats`.
//
// This script ADDS those missing players. It never deletes, never updates
// existing rows. For each (player_name, school_slug, season, stat_type)
// combination present in game data but missing from the leaderboard, it
// inserts a single aggregated row.
//
// Re-runnability: safe to run any time. The NOT EXISTS guard ensures already-
// added (and already-present-in-leaderboard) rows are skipped on subsequent
// runs. If new box scores get ingested later, re-running adds the new players.
//
// Architectural note (future work)
// --------------------------------
// Conceptually we now have two distinct things in one table:
//   1. Newsday top-25 leaderboard (blessed, season totals from official source)
//   2. Game-aggregated rows for everyone else (potentially incomplete)
// A cleaner long-term schema would split these — e.g. rename the existing
// table to `player_season_leaderboard` and put aggregates in `player_season_aggregates`.
// For now they coexist in one table; chart queries treat them the same.
//
// USAGE
// -----
//   node --env-file=.env.local scripts/rebuild-player-season-stats.mjs           # dry run
//   node --env-file=.env.local scripts/rebuild-player-season-stats.mjs --apply   # write
// ──────────────────────────────────────────────────────────────────────────────

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const APPLY = process.argv.includes('--apply')

const SEASONS = [2021, 2022, 2023, 2024, 2025]

function bar() { console.log('─'.repeat(72)) }

async function snapshot(label) {
  const rows = await sql`
    SELECT season, stat_type, COUNT(*)::int AS n
    FROM player_season_stats
    WHERE season = ANY(${SEASONS}) AND stat_type IN ('Passing','Rushing','Receiving','Defense','Kicking')
    GROUP BY season, stat_type
    ORDER BY season, stat_type`
  console.log(`\n${label}`)
  let total = 0
  for (const r of rows) {
    total += r.n
    console.log(`  ${r.season}  ${r.stat_type.padEnd(12)} ${String(r.n).padStart(5)}`)
  }
  console.log(`  TOTAL: ${total}`)
}

async function previewWouldAdd() {
  console.log('\nPlayers in game stats but missing from leaderboard (would be added)...')

  const passing = await sql`
    SELECT pgs.season, COUNT(DISTINCT (pgs.player_name, pgs.school_slug))::int AS n
    FROM player_game_stats pgs
    WHERE pgs.stat_type = 'Passing'
      AND pgs.season = ANY(${SEASONS})
      AND COALESCE(pgs.pass_yds, 0) > 0
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.stat_type = 'Passing' AND pss.season = pgs.season
          AND pss.school_slug = pgs.school_slug AND pss.player_name = pgs.player_name
      )
    GROUP BY pgs.season ORDER BY pgs.season`

  const rushing = await sql`
    SELECT pgs.season, COUNT(DISTINCT (pgs.player_name, pgs.school_slug))::int AS n
    FROM player_game_stats pgs
    WHERE pgs.stat_type = 'Rushing'
      AND pgs.season = ANY(${SEASONS})
      AND COALESCE(pgs.rush_yds, 0) > 0
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.stat_type = 'Rushing' AND pss.season = pgs.season
          AND pss.school_slug = pgs.school_slug AND pss.player_name = pgs.player_name
      )
    GROUP BY pgs.season ORDER BY pgs.season`

  const receiving = await sql`
    SELECT pgs.season, COUNT(DISTINCT (pgs.player_name, pgs.school_slug))::int AS n
    FROM player_game_stats pgs
    WHERE pgs.stat_type = 'Receiving'
      AND pgs.season = ANY(${SEASONS})
      AND COALESCE(pgs.rec_yds, 0) > 0
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.stat_type = 'Receiving' AND pss.season = pgs.season
          AND pss.school_slug = pgs.school_slug AND pss.player_name = pgs.player_name
      )
    GROUP BY pgs.season ORDER BY pgs.season`

  const defense = await sql`
    SELECT pgs.season, COUNT(DISTINCT (pgs.player_name, pgs.school_slug))::int AS n
    FROM player_game_stats pgs
    WHERE pgs.stat_type = 'Defense'
      AND pgs.season = ANY(${SEASONS})
      AND COALESCE(pgs.def_int, 0) + COALESCE(pgs.def_sacks, 0) + COALESCE(pgs.def_fumbles, 0) > 0
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.stat_type = 'Defense' AND pss.season = pgs.season
          AND pss.school_slug = pgs.school_slug AND pss.player_name = pgs.player_name
      )
    GROUP BY pgs.season ORDER BY pgs.season`

  const kicking = await sql`
    SELECT pgs.season, COUNT(DISTINCT (pgs.player_name, pgs.school_slug))::int AS n
    FROM player_game_stats pgs
    WHERE pgs.stat_type = 'Kicking'
      AND pgs.season = ANY(${SEASONS})
      AND COALESCE(pgs.kick_pat, 0) + COALESCE(pgs.kick_fg, 0) > 0
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.stat_type = 'Kicking' AND pss.season = pgs.season
          AND pss.school_slug = pgs.school_slug AND pss.player_name = pgs.player_name
      )
    GROUP BY pgs.season ORDER BY pgs.season`

  for (const [label, counts] of [['Passing', passing], ['Rushing', rushing], ['Receiving', receiving], ['Defense', defense], ['Kicking', kicking]]) {
    console.log(`\n  ${label}:`)
    let total = 0
    for (const r of counts) {
      console.log(`    ${r.season}: ${r.n} new players to add`)
      total += r.n
    }
    console.log(`    Total: ${total}`)
  }
}

// Aggregation design notes
// ------------------------
// 1. Slug derivation: when a game row has no player_slug, derive one from the
//    player_name using REGEXP. Mirrored from CLAUDE.md's `first-last` kebab format.
//
// 2. GROUP BY is (player_name, school_slug, season), NOT player_slug. Two reasons:
//    a) The same player can have multiple slug values across game rows
//       (e.g. AJ Cannet appears as both 'aj-cannet' and 'ajcannet'), so
//       grouping by slug would fragment them into duplicate aggregates.
//    b) The natural key for a player-season is (name, school, season).
//
// 3. NOT EXISTS dedup uses the same natural key. The leaderboard's UNIQUE
//    constraint on (player_slug, season, stat_type) is a stricter form of
//    the same idea — we skip earlier so we don't even attempt a conflicting
//    INSERT. (If our derived slug ever collides with a leaderboard slug for
//    a *different* player, the constraint catches it as a safety net.)

async function addPassing() {
  const inserted = await sql`
    WITH labeled AS (
      SELECT
        COALESCE(
          pgs.player_slug,
          -- Derive a kebab-case slug from player_name when null. Uses POSIX
          -- character classes ([[:space:]]) instead of \\s — JS template
          -- literals would eat a single \\, producing buggy regexes.
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(pgs.player_name), '[^A-Za-z0-9[:space:]]', '', 'g'), '[[:space:]]+', '-', 'g'))
        ) AS player_slug,
        pgs.player_name,
        pgs.school_slug,
        pgs.season,
        pgs.pass_comp, pgs.pass_att, pgs.pass_yds, pgs.pass_tds, pgs.pass_int
      FROM player_game_stats pgs
      WHERE pgs.stat_type = 'Passing'
        AND pgs.season = ANY(${SEASONS})
        AND COALESCE(pgs.pass_yds, 0) > 0
    ),
    agg AS (
      SELECT
        player_name,
        school_slug,
        season,
        -- Same player can have multiple slugs across game rows; pick one
        -- canonical slug (most common form).
        (array_agg(player_slug ORDER BY player_slug))[1]    AS player_slug,
        SUM(COALESCE(pass_comp, 0))::int                    AS completions,
        SUM(COALESCE(pass_att, 0))::int                     AS attempts,
        SUM(COALESCE(pass_yds, 0))::int                     AS pass_yards,
        SUM(COALESCE(pass_tds, 0))::int                     AS pass_tds,
        SUM(COALESCE(pass_int, 0))::int                     AS interceptions,
        COUNT(*)::int                                       AS games_played
      FROM labeled
      -- Group by name+school (not by slug) because the same player can have
      -- multiple slug values across game rows. The natural key for a player-
      -- season row is (player_name, school_slug, season).
      GROUP BY player_name, school_slug, season
    )
    INSERT INTO player_season_stats (
      player_slug, player_name, school_slug, school_name, season, stat_type, section,
      completions, attempts, pass_yards, pass_tds, interceptions,
      games_played, comp_pct, ypa, td_rate, int_rate
    )
    SELECT
      agg.player_slug,
      agg.player_name,
      agg.school_slug,
      (SELECT name FROM teams WHERE school_slug = agg.school_slug AND level = 'Varsity' LIMIT 1) AS school_name,
      agg.season,
      'Passing',
      'XI',
      agg.completions,
      agg.attempts,
      agg.pass_yards,
      agg.pass_tds,
      agg.interceptions,
      agg.games_played,
      CASE WHEN agg.attempts > 0 THEN ROUND(agg.completions::numeric / agg.attempts * 100, 2) END AS comp_pct,
      CASE WHEN agg.attempts > 0 THEN ROUND(agg.pass_yards::numeric / agg.attempts, 2)         END AS ypa,
      CASE WHEN agg.attempts > 0 THEN ROUND(agg.pass_tds::numeric / agg.attempts * 100, 2)     END AS td_rate,
      CASE WHEN agg.attempts > 0 THEN ROUND(agg.interceptions::numeric / agg.attempts * 100, 2) END AS int_rate
    FROM agg
    WHERE agg.school_slug IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE LOWER(REGEXP_REPLACE(TRIM(pss.player_name), '[[:space:]]+', ' ', 'g')) =
              LOWER(REGEXP_REPLACE(TRIM(agg.player_name), '[[:space:]]+', ' ', 'g'))
          AND pss.school_slug = agg.school_slug
          AND pss.season = agg.season
          AND pss.stat_type = 'Passing'
      )
      -- Also skip if our derived slug would collide with an existing row at a
      -- different school (the unique constraint is on slug+season+stat_type
      -- only — same slug can't exist twice across schools). Rare but real:
      -- e.g., two different "Max Ferraro" players at different schools.
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.player_slug = agg.player_slug
          AND pss.season = agg.season
          AND pss.stat_type = 'Passing'
      )
    RETURNING 1`
  return inserted.length
}

async function addRushing() {
  const inserted = await sql`
    WITH labeled AS (
      SELECT
        COALESCE(
          pgs.player_slug,
          -- Derive a kebab-case slug from player_name when null. Uses POSIX
          -- character classes ([[:space:]]) instead of \\s — JS template
          -- literals would eat a single \\, producing buggy regexes.
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(pgs.player_name), '[^A-Za-z0-9[:space:]]', '', 'g'), '[[:space:]]+', '-', 'g'))
        ) AS player_slug,
        pgs.player_name, pgs.school_slug, pgs.season,
        pgs.rush_att, pgs.rush_yds, pgs.rush_tds
      FROM player_game_stats pgs
      WHERE pgs.stat_type = 'Rushing'
        AND pgs.season = ANY(${SEASONS})
        AND COALESCE(pgs.rush_yds, 0) > 0
    ),
    agg AS (
      SELECT
        player_name, school_slug, season,
        (array_agg(player_slug ORDER BY player_slug))[1]    AS player_slug,
        SUM(COALESCE(rush_att, 0))::int                     AS rush_attempts,
        SUM(COALESCE(rush_yds, 0))::int                     AS rush_yards,
        SUM(COALESCE(rush_tds, 0))::int                     AS rush_tds,
        COUNT(*)::int                                       AS games_played
      FROM labeled
      -- Group by name+school (not by slug) — same player can have multiple
      -- slug values across game rows. Natural key is (player_name, school_slug, season).
      GROUP BY player_name, school_slug, season
    )
    INSERT INTO player_season_stats (
      player_slug, player_name, school_slug, school_name, season, stat_type, section,
      rush_attempts, rush_yards, rush_tds, games_played, ypc
    )
    SELECT
      agg.player_slug,
      agg.player_name,
      agg.school_slug,
      (SELECT name FROM teams WHERE school_slug = agg.school_slug AND level = 'Varsity' LIMIT 1) AS school_name,
      agg.season,
      'Rushing',
      'XI',
      agg.rush_attempts,
      agg.rush_yards,
      agg.rush_tds,
      agg.games_played,
      CASE WHEN agg.rush_attempts > 0 THEN ROUND(agg.rush_yards::numeric / agg.rush_attempts, 2) END AS ypc
    FROM agg
    WHERE agg.school_slug IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE LOWER(REGEXP_REPLACE(TRIM(pss.player_name), '[[:space:]]+', ' ', 'g')) =
              LOWER(REGEXP_REPLACE(TRIM(agg.player_name), '[[:space:]]+', ' ', 'g'))
          AND pss.school_slug = agg.school_slug
          AND pss.season = agg.season
          AND pss.stat_type = 'Rushing'
      )
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.player_slug = agg.player_slug
          AND pss.season = agg.season
          AND pss.stat_type = 'Rushing'
      )
    RETURNING 1`
  return inserted.length
}

async function addReceiving() {
  const inserted = await sql`
    WITH labeled AS (
      SELECT
        COALESCE(
          pgs.player_slug,
          -- Derive a kebab-case slug from player_name when null. Uses POSIX
          -- character classes ([[:space:]]) instead of \\s — JS template
          -- literals would eat a single \\, producing buggy regexes.
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(pgs.player_name), '[^A-Za-z0-9[:space:]]', '', 'g'), '[[:space:]]+', '-', 'g'))
        ) AS player_slug,
        pgs.player_name, pgs.school_slug, pgs.season,
        pgs.rec_rec, pgs.rec_yds, pgs.rec_tds
      FROM player_game_stats pgs
      WHERE pgs.stat_type = 'Receiving'
        AND pgs.season = ANY(${SEASONS})
        AND COALESCE(pgs.rec_yds, 0) > 0
    ),
    agg AS (
      SELECT
        player_name, school_slug, season,
        (array_agg(player_slug ORDER BY player_slug))[1]    AS player_slug,
        SUM(COALESCE(rec_rec, 0))::int                      AS receptions,
        SUM(COALESCE(rec_yds, 0))::int                      AS recv_yards,
        SUM(COALESCE(rec_tds, 0))::int                      AS recv_tds,
        COUNT(*)::int                                       AS games_played
      FROM labeled
      -- Group by name+school (not by slug) — same player can have multiple
      -- slug values across game rows. Natural key is (player_name, school_slug, season).
      GROUP BY player_name, school_slug, season
    )
    INSERT INTO player_season_stats (
      player_slug, player_name, school_slug, school_name, season, stat_type, section,
      receptions, recv_yards, recv_tds, games_played, ypc
    )
    SELECT
      agg.player_slug,
      agg.player_name,
      agg.school_slug,
      (SELECT name FROM teams WHERE school_slug = agg.school_slug AND level = 'Varsity' LIMIT 1) AS school_name,
      agg.season,
      'Receiving',
      'XI',
      agg.receptions,
      agg.recv_yards,
      agg.recv_tds,
      agg.games_played,
      CASE WHEN agg.receptions > 0 THEN ROUND(agg.recv_yards::numeric / agg.receptions, 2) END AS ypc
    FROM agg
    WHERE agg.school_slug IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE LOWER(REGEXP_REPLACE(TRIM(pss.player_name), '[[:space:]]+', ' ', 'g')) =
              LOWER(REGEXP_REPLACE(TRIM(agg.player_name), '[[:space:]]+', ' ', 'g'))
          AND pss.school_slug = agg.school_slug
          AND pss.season = agg.season
          AND pss.stat_type = 'Receiving'
      )
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.player_slug = agg.player_slug
          AND pss.season = agg.season
          AND pss.stat_type = 'Receiving'
      )
    RETURNING 1`
  return inserted.length
}

/**
 * Ensure player_season_stats has the defense columns.
 * Safe to call every run — ADD COLUMN IF NOT EXISTS is idempotent.
 */
async function migrateDefenseCols() {
  // Columns are hardcoded — safe to interpolate directly into tagged template.
  // POSIX DDL cannot use $1 params; three explicit statements are clearest.
  await sql`ALTER TABLE player_season_stats ADD COLUMN IF NOT EXISTS def_int     INT`
  await sql`ALTER TABLE player_season_stats ADD COLUMN IF NOT EXISTS def_sacks   INT`
  await sql`ALTER TABLE player_season_stats ADD COLUMN IF NOT EXISTS def_fumbles INT`
}

async function addDefense() {
  await migrateDefenseCols()
  const inserted = await sql`
    WITH labeled AS (
      SELECT
        COALESCE(
          pgs.player_slug,
          -- Derive a kebab-case slug from player_name when null. Uses POSIX
          -- character classes ([[:space:]]) instead of \\s — JS template
          -- literals would eat a single \\, producing buggy regexes.
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(pgs.player_name), '[^A-Za-z0-9[:space:]]', '', 'g'), '[[:space:]]+', '-', 'g'))
        ) AS player_slug,
        pgs.player_name, pgs.school_slug, pgs.season,
        pgs.def_int, pgs.def_sacks, pgs.def_fumbles
      FROM player_game_stats pgs
      WHERE pgs.stat_type = 'Defense'
        AND pgs.season = ANY(${SEASONS})
        AND COALESCE(pgs.def_int, 0) + COALESCE(pgs.def_sacks, 0) + COALESCE(pgs.def_fumbles, 0) > 0
    ),
    agg AS (
      SELECT
        player_name, school_slug, season,
        (array_agg(player_slug ORDER BY player_slug))[1]    AS player_slug,
        SUM(COALESCE(def_int, 0))::int                      AS def_int,
        SUM(COALESCE(def_sacks, 0))::int                    AS def_sacks,
        SUM(COALESCE(def_fumbles, 0))::int                  AS def_fumbles,
        COUNT(*)::int                                       AS games_played
      FROM labeled
      -- Group by name+school (not by slug) — same player can have multiple
      -- slug values across game rows. Natural key is (player_name, school_slug, season).
      GROUP BY player_name, school_slug, season
    )
    INSERT INTO player_season_stats (
      player_slug, player_name, school_slug, school_name, season, stat_type, section,
      def_int, def_sacks, def_fumbles, games_played
    )
    SELECT
      agg.player_slug,
      agg.player_name,
      agg.school_slug,
      (SELECT name FROM teams WHERE school_slug = agg.school_slug AND level = 'Varsity' LIMIT 1) AS school_name,
      agg.season,
      'Defense',
      'XI',
      agg.def_int,
      agg.def_sacks,
      agg.def_fumbles,
      agg.games_played
    FROM agg
    WHERE agg.school_slug IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE LOWER(REGEXP_REPLACE(TRIM(pss.player_name), '[[:space:]]+', ' ', 'g')) =
              LOWER(REGEXP_REPLACE(TRIM(agg.player_name), '[[:space:]]+', ' ', 'g'))
          AND pss.school_slug = agg.school_slug
          AND pss.season = agg.season
          AND pss.stat_type = 'Defense'
      )
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.player_slug = agg.player_slug
          AND pss.season = agg.season
          AND pss.stat_type = 'Defense'
      )
    ON CONFLICT (player_slug, season, stat_type) DO NOTHING
    RETURNING 1`
  return inserted.length
}

async function addKicking() {
  // Kicking rows use existing columns: pat, fg, points
  const inserted = await sql`
    WITH labeled AS (
      SELECT
        COALESCE(
          pgs.player_slug,
          -- Derive a kebab-case slug from player_name when null. Uses POSIX
          -- character classes ([[:space:]]) instead of \\s — JS template
          -- literals would eat a single \\, producing buggy regexes.
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(pgs.player_name), '[^A-Za-z0-9[:space:]]', '', 'g'), '[[:space:]]+', '-', 'g'))
        ) AS player_slug,
        pgs.player_name, pgs.school_slug, pgs.season,
        pgs.kick_pat, pgs.kick_fg, pgs.kick_points
      FROM player_game_stats pgs
      WHERE pgs.stat_type = 'Kicking'
        AND pgs.season = ANY(${SEASONS})
        AND COALESCE(pgs.kick_pat, 0) + COALESCE(pgs.kick_fg, 0) > 0
    ),
    agg AS (
      SELECT
        player_name, school_slug, season,
        (array_agg(player_slug ORDER BY player_slug))[1]    AS player_slug,
        SUM(COALESCE(kick_pat, 0))::int                     AS pat,
        SUM(COALESCE(kick_fg, 0))::int                      AS fg,
        SUM(COALESCE(kick_points, 0))::int                  AS points,
        COUNT(*)::int                                       AS games_played
      FROM labeled
      -- Group by name+school (not by slug) — same player can have multiple
      -- slug values across game rows. Natural key is (player_name, school_slug, season).
      GROUP BY player_name, school_slug, season
    )
    INSERT INTO player_season_stats (
      player_slug, player_name, school_slug, school_name, season, stat_type, section,
      pat, fg, points, games_played
    )
    SELECT
      agg.player_slug,
      agg.player_name,
      agg.school_slug,
      (SELECT name FROM teams WHERE school_slug = agg.school_slug AND level = 'Varsity' LIMIT 1) AS school_name,
      agg.season,
      'Kicking',
      'XI',
      agg.pat,
      agg.fg,
      agg.points,
      agg.games_played
    FROM agg
    WHERE agg.school_slug IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE LOWER(REGEXP_REPLACE(TRIM(pss.player_name), '[[:space:]]+', ' ', 'g')) =
              LOWER(REGEXP_REPLACE(TRIM(agg.player_name), '[[:space:]]+', ' ', 'g'))
          AND pss.school_slug = agg.school_slug
          AND pss.season = agg.season
          AND pss.stat_type = 'Kicking'
      )
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.player_slug = agg.player_slug
          AND pss.season = agg.season
          AND pss.stat_type = 'Kicking'
      )
    ON CONFLICT (player_slug, season, stat_type) DO NOTHING
    RETURNING 1`
  return inserted.length
}

async function main() {
  bar()
  console.log(`player_season_stats backfill — additive only  (${APPLY ? 'APPLY MODE' : 'DRY RUN'})`)
  bar()
  console.log('Newsday top-25 leaderboard rows are NEVER deleted or updated.')
  console.log('Only adds players from game stats who are not already in the leaderboard.')

  await snapshot('BEFORE')
  await previewWouldAdd()

  if (!APPLY) {
    console.log('\n──────')
    console.log('DRY RUN — no changes made.')
    console.log('Re-run with --apply to insert the new aggregated rows.')
    console.log('──────')
    return
  }

  bar()
  console.log('Applying...')
  bar()

  console.log('\nInserting aggregated rows (leaderboard rows untouched)...')
  const passing = await addPassing()
  console.log(`  Added ${passing} Passing rows`)
  const rushing = await addRushing()
  console.log(`  Added ${rushing} Rushing rows`)
  const receiving = await addReceiving()
  console.log(`  Added ${receiving} Receiving rows`)
  const defense = await addDefense()
  console.log(`  Added ${defense} Defense rows`)
  const kicking = await addKicking()
  console.log(`  Added ${kicking} Kicking rows`)

  await snapshot('AFTER')

  bar()
  console.log('✓ Backfill complete')
  bar()
}

main().catch(err => {
  console.error('\n✗ Backfill failed:', err.message)
  console.error(err.stack)
  process.exit(1)
})
