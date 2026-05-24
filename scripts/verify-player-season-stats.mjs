#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────────
// scripts/verify-player-season-stats.mjs
//
// PURPOSE
// -------
// Compare the existing capped top-25 leaderboard rows in `player_season_stats`
// against what we'd get by aggregating `player_game_stats`. This is the
// READ-ONLY first step before any rebuild — if the aggregations don't match
// the official leaderboard numbers, we don't want to overwrite them.
//
// For each (player, season, stat_type) that exists in `player_season_stats`,
// we compute the corresponding aggregate from `player_game_stats` and report:
//
//   ✓ Exact match    — aggregate equals the leaderboard value
//   ≈ Near match     — within tolerance (small games_played gap or rounding)
//   ✗ Mismatch       — disagrees by more than tolerance — investigate
//   — No game data   — player exists in leaderboard but has no game rows
//
// Also reports "would-be-added" — players in `player_game_stats` who are NOT
// in the capped leaderboard (these are the ~3,000 missing rows we discussed).
//
// USAGE
// -----
//   node --env-file=.env.local scripts/verify-player-season-stats.mjs
//   node --env-file=.env.local scripts/verify-player-season-stats.mjs --details   # show every mismatch
//   node --env-file=.env.local scripts/verify-player-season-stats.mjs --season 2025
//
// This script never writes. Safe to run as often as you want.
// ──────────────────────────────────────────────────────────────────────────────

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const SHOW_DETAILS = process.argv.includes('--details')
const seasonArg = process.argv.indexOf('--season')
const FILTER_SEASON = seasonArg >= 0 ? Number(process.argv[seasonArg + 1]) : null

const SEASONS = FILTER_SEASON ? [FILTER_SEASON] : [2021, 2022, 2023, 2024, 2025]

// A value is a "near match" if the agg is within this many units of the
// leaderboard value, OR within this percent — whichever is larger.
const NEAR_ABS = 2     // ±2 yards / TDs / etc.
const NEAR_PCT = 0.02  // ±2%

function classify(leaderboard, aggregate) {
  if (aggregate === null || aggregate === undefined) return 'no-data'
  if (leaderboard === aggregate) return 'exact'
  const diff = Math.abs(leaderboard - aggregate)
  const tol = Math.max(NEAR_ABS, Math.abs(leaderboard) * NEAR_PCT)
  if (diff <= tol) return 'near'
  return 'mismatch'
}

function bar() { console.log('─'.repeat(76)) }

async function verifyStatType(statType) {
  bar()
  console.log(`Verifying stat_type = '${statType}'  ·  seasons ${SEASONS.join(',')}`)
  bar()

  // 1) The blessed leaderboard rows
  let leaderboard
  if (statType === 'Passing') {
    leaderboard = await sql`
      SELECT player_name, school_slug, season,
             pass_yards AS value, pass_tds AS tds
      FROM player_season_stats
      WHERE stat_type = 'Passing' AND season = ANY(${SEASONS})`
  } else if (statType === 'Rushing') {
    leaderboard = await sql`
      SELECT player_name, school_slug, season,
             rush_yards AS value, rush_tds AS tds
      FROM player_season_stats
      WHERE stat_type = 'Rushing' AND season = ANY(${SEASONS})`
  } else {
    leaderboard = await sql`
      SELECT player_name, school_slug, season,
             recv_yards AS value, recv_tds AS tds
      FROM player_season_stats
      WHERE stat_type = 'Receiving' AND season = ANY(${SEASONS})`
  }

  // 2) Aggregate from game_stats — keyed the same way
  let aggregated
  if (statType === 'Passing') {
    aggregated = await sql`
      SELECT player_name, school_slug, season,
             SUM(COALESCE(pass_yds, 0))::int AS value,
             SUM(COALESCE(pass_tds, 0))::int AS tds,
             COUNT(*)::int AS games
      FROM player_game_stats
      WHERE stat_type = 'Passing' AND season = ANY(${SEASONS})
        AND COALESCE(pass_yds, 0) > 0
      GROUP BY player_name, school_slug, season`
  } else if (statType === 'Rushing') {
    aggregated = await sql`
      SELECT player_name, school_slug, season,
             SUM(COALESCE(rush_yds, 0))::int AS value,
             SUM(COALESCE(rush_tds, 0))::int AS tds,
             COUNT(*)::int AS games
      FROM player_game_stats
      WHERE stat_type = 'Rushing' AND season = ANY(${SEASONS})
        AND COALESCE(rush_yds, 0) > 0
      GROUP BY player_name, school_slug, season`
  } else {
    aggregated = await sql`
      SELECT player_name, school_slug, season,
             SUM(COALESCE(rec_yds, 0))::int AS value,
             SUM(COALESCE(rec_tds, 0))::int AS tds,
             COUNT(*)::int AS games
      FROM player_game_stats
      WHERE stat_type = 'Receiving' AND season = ANY(${SEASONS})
        AND COALESCE(rec_yds, 0) > 0
      GROUP BY player_name, school_slug, season`
  }

  // 3) Index aggregated by natural key
  const aggKey = (r) => `${r.season}|${r.school_slug}|${r.player_name}`
  const aggMap = new Map(aggregated.map(r => [aggKey(r), r]))

  // 4) Walk the leaderboard, classify each row
  const buckets = { exact: [], near: [], mismatch: [], 'no-data': [] }
  for (const lb of leaderboard) {
    const agg = aggMap.get(aggKey(lb))
    const cls = classify(Number(lb.value), agg ? Number(agg.value) : null)
    buckets[cls].push({ lb, agg })
    if (agg) aggMap.delete(aggKey(lb))  // remove so what's left = would-be-added
  }
  const wouldBeAdded = [...aggMap.values()]

  const lbCount = leaderboard.length
  console.log(`\n  ${lbCount} leaderboard rows compared against ${aggregated.length} aggregated rows`)
  console.log(`    ✓ Exact match:   ${buckets.exact.length}`)
  console.log(`    ≈ Near match:    ${buckets.near.length}  (within ±${NEAR_ABS} or ±${(NEAR_PCT * 100).toFixed(0)}%)`)
  console.log(`    ✗ Mismatch:      ${buckets.mismatch.length}`)
  console.log(`    — No game data:  ${buckets['no-data'].length}`)
  console.log(`    + Would-be-added: ${wouldBeAdded.length} new players from game-level aggregates`)

  // 5) Mismatches always shown (most important signal)
  if (buckets.mismatch.length > 0) {
    console.log(`\n  ✗ MISMATCHES (leaderboard says X, aggregate says Y):`)
    for (const { lb, agg } of buckets.mismatch.slice(0, SHOW_DETAILS ? 200 : 15)) {
      const diff = Number(agg.value) - Number(lb.value)
      const sign = diff > 0 ? '+' : ''
      console.log(
        `    ${lb.season}  ${lb.school_slug.padEnd(22)}  ${lb.player_name.padEnd(28)}  ` +
        `lb=${String(lb.value).padStart(5)}  agg=${String(agg.value).padStart(5)} (${sign}${diff})  ` +
        `games=${agg.games}`
      )
    }
    if (!SHOW_DETAILS && buckets.mismatch.length > 15) {
      console.log(`    ... and ${buckets.mismatch.length - 15} more (use --details to see all)`)
    }
  }

  // 6) No-data cases (leaderboard says X but we have 0 games for them)
  if (buckets['no-data'].length > 0) {
    console.log(`\n  — NO GAME DATA (leaderboard has them, player_game_stats does not):`)
    for (const { lb } of buckets['no-data'].slice(0, SHOW_DETAILS ? 200 : 10)) {
      console.log(`    ${lb.season}  ${lb.school_slug.padEnd(22)}  ${lb.player_name.padEnd(28)}  lb=${lb.value}`)
    }
    if (!SHOW_DETAILS && buckets['no-data'].length > 10) {
      console.log(`    ... and ${buckets['no-data'].length - 10} more`)
    }
  }

  // 7) Sample some near-matches and would-be-added for spot-check
  if (SHOW_DETAILS) {
    if (buckets.near.length > 0) {
      console.log(`\n  ≈ NEAR MATCHES (sample):`)
      for (const { lb, agg } of buckets.near.slice(0, 10)) {
        console.log(`    ${lb.season}  ${lb.player_name.padEnd(28)}  lb=${lb.value}  agg=${agg.value}`)
      }
    }
    if (wouldBeAdded.length > 0) {
      console.log(`\n  + WOULD BE ADDED (sample — top 10 by value):`)
      const top = [...wouldBeAdded].sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 10)
      for (const a of top) {
        console.log(`    ${a.season}  ${a.school_slug.padEnd(22)}  ${a.player_name.padEnd(28)}  agg=${a.value}  games=${a.games}`)
      }
    }
  }

  return {
    statType,
    counts: {
      exact: buckets.exact.length,
      near: buckets.near.length,
      mismatch: buckets.mismatch.length,
      noData: buckets['no-data'].length,
      wouldBeAdded: wouldBeAdded.length,
    },
  }
}

async function main() {
  console.log('player_season_stats verification — read-only')
  if (FILTER_SEASON) console.log(`(filtered to season ${FILTER_SEASON})`)
  if (SHOW_DETAILS) console.log('(showing details for every bucket)')

  const results = []
  for (const st of ['Passing', 'Rushing', 'Receiving']) {
    results.push(await verifyStatType(st))
  }

  bar()
  console.log('SUMMARY')
  bar()
  let allClean = true
  for (const r of results) {
    const verdict =
      r.counts.mismatch === 0 && r.counts.noData === 0 ? '✓ safe to rebuild' :
      r.counts.mismatch > 0 ? '✗ investigate mismatches first' :
      '⚠ some leaderboard rows have no game data'
    if (r.counts.mismatch > 0 || r.counts.noData > 0) allClean = false
    console.log(
      `  ${r.statType.padEnd(10)}  ` +
      `exact=${r.counts.exact}  near=${r.counts.near}  mismatch=${r.counts.mismatch}  ` +
      `no-data=${r.counts.noData}  would-add=${r.counts.wouldBeAdded}  ${verdict}`
    )
  }
  console.log('')
  if (allClean) {
    console.log('✓ All leaderboard rows reproduced from game aggregates within tolerance.')
    console.log('  Safe to proceed with scripts/rebuild-player-season-stats.mjs --apply')
  } else {
    console.log('✗ Verification flagged issues. Investigate before rebuilding.')
    console.log('  Re-run with --details to see every mismatch.')
  }
}

main().catch(err => {
  console.error('\nVerification script failed:', err.message)
  console.error(err.stack)
  process.exit(1)
})
