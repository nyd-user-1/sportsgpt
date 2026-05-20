/**
 * Ingest a scraped roster JSON into the DB.
 *
 * Usage:
 *   node --env-file=.env.local scripts/ingest-rosters.mjs <json-file> <db-school-slug>
 *
 * Examples:
 *   node --env-file=.env.local scripts/ingest-rosters.mjs scripts/scraped/rosters/east-islip-2025.json east-islip
 */

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('ERROR: DATABASE_URL not set'); process.exit(1) }

const jsonFile   = process.argv[2]
const schoolSlug = process.argv[3]

if (!jsonFile || !schoolSlug) {
  console.error('Usage: node --env-file=.env.local scripts/ingest-rosters.mjs <json-file> <db-school-slug>')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

function nameToSlug(name) {
  return name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS player_rosters (
      id               SERIAL PRIMARY KEY,
      school_slug      TEXT NOT NULL,
      season           INT  NOT NULL,
      player_name      TEXT NOT NULL,
      player_slug      TEXT NOT NULL,
      position         TEXT,
      jersey_number    INT,
      class            TEXT,
      newsday_entry_id INT,
      UNIQUE (school_slug, season, player_slug)
    )
  `
}

async function main() {
  const data    = JSON.parse(readFileSync(jsonFile, 'utf8'))
  const season  = data.season
  const players = data.players

  console.log(`\n=== Ingesting ${jsonFile} → school:${schoolSlug} season:${season} ===\n`)

  await ensureTable()

  let upserted = 0
  let newPlayers = 0

  for (const p of players) {
    const slug = nameToSlug(p.name)

    // Ensure player exists in players table
    const existing = await sql`
      SELECT id FROM players WHERE slug = ${slug} AND school_slug = ${schoolSlug}
    `
    if (existing.length === 0) {
      await sql`
        INSERT INTO players (slug, name, school_slug, position)
        VALUES (${slug}, ${p.name}, ${schoolSlug}, ${p.position ?? null})
        ON CONFLICT (slug) DO NOTHING
      `
      newPlayers++
      console.log(`  + New player: ${p.name} (${slug})`)
    }

    // Upsert roster row
    await sql`
      INSERT INTO player_rosters (school_slug, season, player_name, player_slug, position, jersey_number, class, newsday_entry_id)
      VALUES (
        ${schoolSlug}, ${season}, ${p.name}, ${slug},
        ${p.position ?? null}, ${p.jersey_number ?? null},
        ${p.class ?? null}, ${p.newsday_entry_id ?? null}
      )
      ON CONFLICT (school_slug, season, player_slug) DO UPDATE SET
        player_name       = EXCLUDED.player_name,
        position          = EXCLUDED.position,
        jersey_number     = EXCLUDED.jersey_number,
        class             = EXCLUDED.class,
        newsday_entry_id = EXCLUDED.newsday_entry_id
    `
    upserted++
  }

  console.log(`\n── Summary ${'─'.repeat(32)}`)
  console.log(`  Upserted     : ${upserted}`)
  console.log(`  New players  : ${newPlayers}`)
}

main().catch(err => { console.error(err); process.exit(1) })
