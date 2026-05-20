/**
 * Ingest all-time roster text (pasted from source) into player_rosters + players.
 *
 * Usage:
 *   node --env-file=.env.local scripts/ingest-alltime-roster.mjs <school-slug> <text-file>
 *
 * Text file format:
 *   2025-26(19 players)
 *   Head Coach: Sal Ciampi
 *   Simmons, Jake(Sr.)
 *   Fragala, Joe
 *   ...
 */

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('ERROR: DATABASE_URL not set'); process.exit(1) }

const schoolSlug = process.argv[2]
const textFile   = process.argv[3]

if (!schoolSlug || !textFile) {
  console.error('Usage: node --env-file=.env.local scripts/ingest-alltime-roster.mjs <school-slug> <text-file>')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

function nameToSlug(name) {
  return name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function capitalize(s) {
  return s.replace(/\b\w/g, c => c.toUpperCase())
}

function parseSeason(header) {
  // "2025-26(19 players)" → 2025
  const m = header.match(/^(\d{4})-\d{2}/)
  return m ? parseInt(m[1]) : null
}

function parsePlayer(line) {
  // "Simmons, Jake(Sr.)" or "Fragala, Joe" or "belsito, john(Jr.)"
  // "Whitten Garcia Foreman, Andrew(So.)"
  const commaIdx = line.indexOf(',')
  if (commaIdx === -1) return null

  const rawLast = line.slice(0, commaIdx).trim()
  let   rest    = line.slice(commaIdx + 1).trim()

  // Extract class
  const classMatch = rest.match(/\(([A-Za-z]+\.?)\)\s*$/)
  const cls  = classMatch ? classMatch[1].replace('.', '') : null
  const rawFirst = classMatch ? rest.slice(0, classMatch.index).trim() : rest.trim()

  if (!rawFirst) return null

  const first = capitalize(rawFirst)
  const last  = capitalize(rawLast)
  const name  = `${first} ${last}`
  const slug  = nameToSlug(name)

  return { name, slug, class: cls, position: null }
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS player_rosters (
      id                SERIAL PRIMARY KEY,
      school_slug       TEXT NOT NULL,
      season            INT  NOT NULL,
      player_name       TEXT NOT NULL,
      player_slug       TEXT NOT NULL,
      position          TEXT,
      jersey_number     INT,
      class             TEXT,
      newsday_entry_id  INT,
      UNIQUE (school_slug, season, player_slug)
    )
  `
}

async function main() {
  await ensureTable()

  const text  = readFileSync(textFile, 'utf8')
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  let currentSeason = null
  let totalUpserted = 0
  let totalNew = 0
  const seasonCounts = {}

  for (const line of lines) {
    // Season header
    if (/^\d{4}-\d{2}\(\d+ players\)/.test(line)) {
      currentSeason = parseSeason(line)
      if (currentSeason) seasonCounts[currentSeason] = 0
      continue
    }
    // Skip coach lines and empty/metadata
    if (line.startsWith('Head Coach:') || line.startsWith('Previous Seasons') || /Football History/.test(line)) continue
    // Skip if no season set yet
    if (!currentSeason) continue

    const player = parsePlayer(line)
    if (!player) continue

    // Ensure player exists
    const existing = await sql`
      SELECT id FROM players WHERE slug = ${player.slug} AND school_slug = ${schoolSlug}
    `
    if (existing.length === 0) {
      await sql`
        INSERT INTO players (slug, name, school_slug, position)
        VALUES (${player.slug}, ${player.name}, ${schoolSlug}, null)
        ON CONFLICT (slug) DO NOTHING
      `
      totalNew++
    }

    // Upsert roster row — preserve jersey_number and newsday_entry_id if already set
    await sql`
      INSERT INTO player_rosters (school_slug, season, player_name, player_slug, class, position, jersey_number, newsday_entry_id)
      VALUES (${schoolSlug}, ${currentSeason}, ${player.name}, ${player.slug}, ${player.class}, null, null, null)
      ON CONFLICT (school_slug, season, player_slug) DO UPDATE SET
        player_name = EXCLUDED.player_name,
        class       = COALESCE(EXCLUDED.class, player_rosters.class)
    `
    totalUpserted++
    seasonCounts[currentSeason] = (seasonCounts[currentSeason] ?? 0) + 1
  }

  console.log(`\n${schoolSlug} — all-time roster ingest`)
  console.log('─'.repeat(40))
  for (const [season, count] of Object.entries(seasonCounts).sort()) {
    console.log(`  ${season}-${String(parseInt(season)+1).slice(2)}: ${count} players`)
  }
  console.log('─'.repeat(40))
  console.log(`  Total upserted : ${totalUpserted}`)
  console.log(`  New players    : ${totalNew}`)
}

main().catch(console.error)
