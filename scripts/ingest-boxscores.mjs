/**
 * Generalized box score ingest for any team's scraped JSON.
 *
 * Usage:
 *   node --env-file=.env.local scripts/ingest-boxscores.mjs <json-file> <db-team-slug> [season]
 *
 * Examples:
 *   node --env-file=.env.local scripts/ingest-boxscores.mjs scripts/scraped/longwood-2025.json longwood-varsity-football 2025
 *   node --env-file=.env.local scripts/ingest-boxscores.mjs scripts/scraped/floyd-2025.json floyd-varsity-football
 */

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('ERROR: DATABASE_URL not set'); process.exit(1) }

const jsonFile   = process.argv[2]
const teamSlug   = process.argv[3]
const season     = parseInt(process.argv[4] ?? '2025', 10)

if (!jsonFile || !teamSlug) {
  console.error('Usage: node --env-file=.env.local scripts/ingest-boxscores.mjs <json-file> <db-team-slug> [season]')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

function parseDate(mmddyyyy) {
  const [mm, dd, yyyy] = mmddyyyy.split('/')
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function normalizeOpponent(name) {
  return name.toLowerCase().replace(/\s+(high school|hs|varsity|football)$/i, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

function nameToWords(name) {
  return normalizeOpponent(name).split(/\s+/).filter(Boolean)
}

function toInt(v) {
  if (v === null || v === undefined || v === '') return 0
  const n = parseInt(v, 10)
  return isNaN(n) ? 0 : n
}

function resolveTeamSlug(teamName, slugA, slugB) {
  const words  = nameToWords(teamName)
  const scoreA = words.filter(w => slugA.includes(w)).length
  const scoreB = words.filter(w => slugB.includes(w)).length
  return scoreA >= scoreB ? slugA : slugB
}

async function ensureTable() {
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
}

async function findGame(entry) {
  const gameDate    = parseDate(entry.date)
  const oppWords    = nameToWords(entry.opponent)

  let candidates = await sql`
    SELECT id, home_team_slug, away_team_slug
    FROM games
    WHERE game_date::date = ${gameDate}::date
      AND season = ${season}
      AND (home_team_slug = ${teamSlug} OR away_team_slug = ${teamSlug})
  `

  // Fallback: ±2 day window (Newsday and MaxPreps sometimes differ by a day)
  if (candidates.length === 0) {
    candidates = await sql`
      SELECT id, home_team_slug, away_team_slug
      FROM games
      WHERE game_date::date BETWEEN (${gameDate}::date - interval '2 days') AND (${gameDate}::date + interval '2 days')
        AND season = ${season}
        AND (home_team_slug = ${teamSlug} OR away_team_slug = ${teamSlug})
    `
  }

  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  // Multiple games on same date — score by opponent word overlap
  const scored = candidates.map(row => {
    const oppSlug    = row.home_team_slug === teamSlug ? row.away_team_slug : row.home_team_slug
    const matchCount = oppWords.filter(w => oppSlug.includes(w)).length
    return { row, matchCount }
  })
  scored.sort((a, b) => b.matchCount - a.matchCount)
  if (scored[0].matchCount > 0) return scored[0].row

  console.warn(`  WARN: no opponent word match for "${entry.opponent}" on ${gameDate}`)
  return candidates[0]
}

function buildQuarterScores(quarterRows, homeSlug, awaySlug) {
  return quarterRows
    .filter(r => r.team !== 'Teams')
    .map(row => ({
      team_name: row.team,
      team_slug: resolveTeamSlug(row.team, homeSlug, awaySlug),
      q1:    toInt(row.q1),
      q2:    toInt(row.q2),
      q3:    toInt(row.q3),
      q4:    toInt(row.q4),
      ot1:   toInt(row.ot1),
      ot2:   toInt(row.ot2),
      ot3:   toInt(row.ot3),
      final: toInt(row.final),
    }))
}

function buildPlayerStats(stats) {
  const result = []
  const typeMap = { rushing: 'Rushing', passing: 'Passing', receiving: 'Receiving', kicking: 'Kicking', defense: 'Defense' }
  for (const [key, label] of Object.entries(typeMap)) {
    for (const item of (stats[key] ?? [])) {
      result.push({
        stat_type: label,
        team_name: item.team,
        player: item.player,
        ...Object.fromEntries(Object.entries(item).filter(([k]) => k !== 'team' && k !== 'player')),
      })
    }
  }
  return result
}

async function upsertBoxScore(gameRow, newsdayId, entry) {
  const { id: gameId, home_team_slug, away_team_slug } = gameRow
  const box = entry.box
  const quarterScores = buildQuarterScores(box.quarterRows, home_team_slug, away_team_slug)
  const playerStats   = buildPlayerStats(box.stats ?? {})

  await sql`
    INSERT INTO game_box_scores (game_id, newsday_id, top_performers, highlights, quarter_scores, player_stats)
    VALUES (
      ${gameId}, ${newsdayId},
      ${box.topPerformers ?? null},
      ${box.highlights ?? null},
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

async function main() {
  const scraped = JSON.parse(readFileSync(jsonFile, 'utf-8'))
  console.log(`\n=== Ingesting ${jsonFile} → ${teamSlug} (season ${season}) ===\n`)

  await ensureTable()

  let upserted = 0, skipped = 0, failed = 0
  const failures = []

  for (const entry of scraped) {
    if (!entry.date || !entry.gameId || !entry.box) { skipped++; continue }

    const gameRow = await findGame(entry)
    if (!gameRow) {
      failed++
      failures.push(`${entry.date} vs ${entry.opponent}`)
      console.warn(`  NO MATCH: ${entry.date} vs ${entry.opponent}`)
      continue
    }

    try {
      await upsertBoxScore(gameRow, parseInt(entry.gameId, 10), entry)
      upserted++
      console.log(`  OK: ${entry.date} vs ${entry.opponent} → games.id=${gameRow.id}`)
    } catch (err) {
      failed++
      failures.push(`${entry.date} vs ${entry.opponent} — ${err.message}`)
      console.error(`  ERROR: ${entry.date} vs ${entry.opponent} — ${err.message}`)
    }
  }

  console.log(`\n── Summary ──────────────────────`)
  console.log(`  Upserted : ${upserted}`)
  console.log(`  Skipped  : ${skipped}`)
  console.log(`  Failed   : ${failed}`)
  if (failures.length) failures.forEach(f => console.log(`    - ${f}`))
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
