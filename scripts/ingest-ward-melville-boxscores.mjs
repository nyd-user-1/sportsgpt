/**
 * Ingests Ward Melville 2025 box score data from scraped JSON into Neon Postgres.
 *
 * Creates game_box_scores table if it doesn't exist, then for each scraped game
 * with box data, matches it to a row in the games table and upserts the box score.
 *
 * Usage: node --env-file=.env.local scripts/ingest-ward-melville-boxscores.mjs
 */

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

// ── helpers ───────────────────────────────────────────────────────────────────

/** Convert "MM/DD/YYYY" → "YYYY-MM-DD" */
function parseDate(mmddyyyy) {
  const [mm, dd, yyyy] = mmddyyyy.split('/')
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

/** Normalize a team name to a slug-friendly string for loose matching */
function nameToSlugWords(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
}

/**
 * Given a team name from the box score (e.g. "Sachem North") and the two team
 * slugs from the matched game row, return whichever slug contains the most words
 * from the team name.
 */
function resolveTeamSlug(teamName, slugA, slugB) {
  const words = nameToSlugWords(teamName)
  const scoreA = words.filter(w => slugA.includes(w)).length
  const scoreB = words.filter(w => slugB.includes(w)).length
  if (scoreA >= scoreB) return slugA
  return slugB
}

/** Parse a quarter score value to integer (empty/null/non-numeric → 0) */
function toInt(v) {
  if (v === null || v === undefined || v === '') return 0
  const n = parseInt(v, 10)
  return isNaN(n) ? 0 : n
}

/**
 * Normalize a team name for opponent matching.
 * Strips common suffixes and returns lowercase words.
 */
function normalizeOpponentName(name) {
  return name
    .toLowerCase()
    .replace(/\s+(high school|hs|varsity|football)$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// ── create table ──────────────────────────────────────────────────────────────

async function createTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS game_box_scores (
      id             SERIAL PRIMARY KEY,
      game_id        INT UNIQUE REFERENCES games(id) ON DELETE CASCADE,
      newsday_id     INT UNIQUE,
      top_performers TEXT,
      highlights     TEXT,
      quarter_scores JSONB,
      player_stats   JSONB
    )
  `
  console.log('Table game_box_scores ready.')
}

// ── match game ────────────────────────────────────────────────────────────────

/**
 * Find the games row for a given scraped entry.
 * Strategy:
 *   1. Match by game_date, season=2025, and ward-melville slug.
 *   2. Among those candidates, further narrow by opponent slug containing
 *      words from the scraped opponent name.
 */
async function findGame(entry) {
  const gameDate = parseDate(entry.date)
  const opponentNorm = normalizeOpponentName(entry.opponent)
  const opponentWords = opponentNorm.split(/\s+/).filter(Boolean)

  // Fetch all games on this date for Ward Melville in 2025
  const candidates = await sql`
    SELECT id, home_team_slug, away_team_slug, home_score, away_score
    FROM games
    WHERE game_date::date = ${gameDate}::date
      AND season = 2025
      AND (
        home_team_slug ILIKE '%ward-melville%'
        OR away_team_slug ILIKE '%ward-melville%'
      )
  `

  if (candidates.length === 0) return null

  if (candidates.length === 1) return candidates[0]

  // Multiple candidates on same date — narrow by opponent name words
  const scored = candidates.map(row => {
    const oppSlug = row.home_team_slug.includes('ward-melville')
      ? row.away_team_slug
      : row.home_team_slug
    const matchCount = opponentWords.filter(w => oppSlug.includes(w)).length
    return { row, matchCount, oppSlug }
  })

  scored.sort((a, b) => b.matchCount - a.matchCount)

  // Return best match if at least one word matched
  if (scored[0].matchCount > 0) return scored[0].row

  // Fallback: return first candidate and warn
  console.warn(
    `  WARN: no opponent word match for "${entry.opponent}" on ${gameDate}. ` +
    `Candidates: ${candidates.map(c => `${c.home_team_slug} vs ${c.away_team_slug}`).join('; ')}. ` +
    `Using first.`
  )
  return candidates[0]
}

// ── build quarter_scores ──────────────────────────────────────────────────────

function buildQuarterScores(quarterRows, homeSlug, awaySlug) {
  // Skip the header row (where team = "Teams")
  const realRows = quarterRows.filter(r => r.team !== 'Teams')

  return realRows.map(row => {
    const slug = resolveTeamSlug(row.team, homeSlug, awaySlug)
    return {
      team_name: row.team,
      team_slug: slug,
      q1:    toInt(row.q1),
      q2:    toInt(row.q2),
      q3:    toInt(row.q3),
      q4:    toInt(row.q4),
      ot1:   toInt(row.ot1),
      ot2:   toInt(row.ot2),
      ot3:   toInt(row.ot3),
      final: toInt(row.final),
    }
  })
}

// ── build player_stats ────────────────────────────────────────────────────────

function buildPlayerStats(stats) {
  const result = []

  const statTypeMap = {
    rushing:   'Rushing',
    passing:   'Passing',
    receiving: 'Receiving',
    kicking:   'Kicking',
    defense:   'Defense',
  }

  for (const [key, label] of Object.entries(statTypeMap)) {
    const arr = stats[key] ?? []
    for (const item of arr) {
      result.push({
        stat_type: label,
        team_name: item.team,
        player:    item.player,
        // spread remaining stat fields (att, yds, tds, comp, int, rec, pat, fg, points, sacks, fumbles)
        ...Object.fromEntries(
          Object.entries(item).filter(([k]) => k !== 'team' && k !== 'player')
        ),
      })
    }
  }

  return result
}

// ── upsert box score ──────────────────────────────────────────────────────────

async function upsertBoxScore(gameId, newsdayId, entry) {
  const box = entry.box
  const game = await sql`SELECT id, home_team_slug, away_team_slug FROM games WHERE id = ${gameId}`
  const { home_team_slug, away_team_slug } = game[0]

  const quarterScores = buildQuarterScores(box.quarterRows, home_team_slug, away_team_slug)
  const playerStats   = buildPlayerStats(box.stats ?? {})
  const topPerformers = box.topPerformers ?? null
  const highlights    = box.highlights ?? null

  await sql`
    INSERT INTO game_box_scores (
      game_id, newsday_id, top_performers, highlights, quarter_scores, player_stats
    ) VALUES (
      ${gameId},
      ${newsdayId},
      ${topPerformers},
      ${highlights},
      ${JSON.stringify(quarterScores)},
      ${JSON.stringify(playerStats)}
    )
    ON CONFLICT (game_id) DO UPDATE SET
      newsday_id     = EXCLUDED.newsday_id,
      top_performers = EXCLUDED.top_performers,
      highlights     = EXCLUDED.highlights,
      quarter_scores = EXCLUDED.quarter_scores,
      player_stats   = EXCLUDED.player_stats
  `
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const jsonPath = path.resolve(__dirname, 'ward-melville-2025-test.json')
  const scraped = JSON.parse(readFileSync(jsonPath, 'utf-8'))

  await createTable()

  let matched   = 0
  let upserted  = 0
  let noBox     = 0
  let noMatch   = 0
  const failures = []

  for (const entry of scraped) {
    // Skip entries without a date or gameId (e.g. error rows)
    if (!entry.date || !entry.gameId) {
      noBox++
      continue
    }

    // Skip entries without box data
    if (!entry.box) {
      noBox++
      console.log(`  SKIP (no box): ${entry.date} vs ${entry.opponent}`)
      continue
    }

    const gameRow = await findGame(entry)

    if (!gameRow) {
      noMatch++
      const msg = `${entry.date} vs ${entry.opponent} (newsday gameId ${entry.gameId})`
      failures.push(msg)
      console.warn(`  NO MATCH: ${msg}`)
      continue
    }

    matched++

    try {
      const newsdayId = parseInt(entry.gameId, 10)
      await upsertBoxScore(gameRow.id, newsdayId, entry)
      upserted++
      console.log(
        `  OK: ${entry.date} vs ${entry.opponent} → games.id=${gameRow.id} ` +
        `(${gameRow.home_team_slug} vs ${gameRow.away_team_slug})`
      )
    } catch (err) {
      noMatch++
      const msg = `${entry.date} vs ${entry.opponent} — upsert error: ${err.message}`
      failures.push(msg)
      console.error(`  ERROR: ${msg}`)
    }
  }

  console.log('\n── Summary ──────────────────────────────────────────')
  console.log(`  Total scraped entries : ${scraped.length}`)
  console.log(`  Skipped (no box data) : ${noBox}`)
  console.log(`  Matched to games row  : ${matched}`)
  console.log(`  Inserted / updated    : ${upserted}`)
  console.log(`  Failed to match       : ${noMatch}`)

  if (failures.length > 0) {
    console.log('\n  Failures:')
    failures.forEach(f => console.log(`    - ${f}`))
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
