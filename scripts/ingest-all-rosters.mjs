/**
 * Batch roster ingest — all scraped roster JSON files.
 * Run: node --env-file=.env.local scripts/ingest-all-rosters.mjs
 */

import { neon } from '@neondatabase/serverless'
import { readFileSync, readdirSync, existsSync } from 'fs'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('ERROR: DATABASE_URL not set'); process.exit(1) }

const sql = neon(DATABASE_URL)

// newsday-slug → school-slug
const SCHOOL_MAP = {
  'bay-shore': 'bay-shore', 'brentwood': 'brentwood', 'central-islip': 'central-islip',
  'commack': 'commack', 'connetquot': 'connetquot', 'floyd': 'floyd',
  'lindenhurst': 'lindenhurst', 'longwood': 'longwood', 'patchogue-medford': 'patchogue-medford',
  'riverhead': 'riverhead', 'sachem-east': 'sachem-east', 'sachem-north': 'sachem-north',
  'ward-melville': 'ward-melville', 'whitman': 'whitman',
  'bellport': 'bellport', 'centereach': 'centereach', 'copiague': 'copiague',
  'deer-park': 'deer-park', 'east-islip': 'east-islip',
  'half-hollow-hills-east': 'half-hollow-hills-east', 'huntington': 'huntington',
  'newfield': 'newfield', 'north-babylon': 'north-babylon', 'northport': 'northport',
  'smithtown-east': 'smithtown-east', 'smithtown-west': 'smithtown-west',
  'west-babylon': 'west-babylon', 'west-islip': 'west-islip',
  'amityville': 'amityville', 'comsewogue': 'comsewogue',
  'east-hampton': 'east-hampton-bridgehampton-pierson',
  'eastport-south-manor': 'eastport-south-manor', 'harborfields': 'harborfields',
  'hauppauge': 'hauppauge', 'half-hollow-hills-west': 'half-hollow-hills-west',
  'islip': 'islip', 'kings-park': 'kings-park', 'rocky-point': 'rocky-point',
  'sayville': 'sayville', 'westhampton': 'westhampton',
  'babylon': 'babylon', 'bayport-blue-point': 'bayport-blue-point',
  'center-moriches': 'center-moriches', 'glenn': 'glenn',
  'greenport-southold-mattituck': 'greenport-southold-mattituck',
  'hampton-bays': 'hampton-bays', 'miller-place': 'miller-place',
  'mt-sinai': 'mt-sinai', 'port-jefferson': 'port-jefferson',
  'shoreham-wading-river': 'shoreham-wading-river', 'southampton': 'southampton',
  'wyandanch': 'wyandanch',
}

function nameToSlug(name) {
  return name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
      newsday_entry_id INT,
      UNIQUE (school_slug, season, player_slug)
    )
  `
}

async function ingestFile(filePath, schoolSlug) {
  const data    = JSON.parse(readFileSync(filePath, 'utf8'))
  const season  = data.season
  const players = data.players
  if (!players?.length) return { upserted: 0, newPlayers: 0 }

  let upserted = 0, newPlayers = 0

  for (const p of players) {
    const slug = nameToSlug(p.name)

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
    }

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

  return { upserted, newPlayers }
}

async function main() {
  await ensureTable()

  const dir = './scripts/scraped/rosters'
  if (!existsSync(dir)) { console.error('No rosters directory found — run scrape-all-rosters.mjs first'); process.exit(1) }

  const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort()
  console.log(`\nIngesting ${files.length} roster files...\n`)

  let totalUpserted = 0, totalNew = 0, errors = 0

  for (const file of files) {
    const match = file.match(/^(.+)-(\d{4})\.json$/)
    if (!match) continue
    const [, newsday, season] = match
    const schoolSlug = SCHOOL_MAP[newsday]
    if (!schoolSlug) { console.log(`  SKIP ${file} — no school mapping`); continue }

    process.stdout.write(`  ${file} ... `)
    try {
      const { upserted, newPlayers } = await ingestFile(`${dir}/${file}`, schoolSlug)
      process.stdout.write(`${upserted} players${newPlayers ? ` (+${newPlayers} new)` : ''}\n`)
      totalUpserted += upserted
      totalNew      += newPlayers
    } catch (e) {
      process.stdout.write(`ERROR: ${e.message}\n`)
      errors++
    }
  }

  console.log(`\n── Summary ${'─'.repeat(32)}`)
  console.log(`  Files processed : ${files.length - errors}`)
  console.log(`  Total upserted  : ${totalUpserted}`)
  console.log(`  New players     : ${totalNew}`)
  console.log(`  Errors          : ${errors}`)
}

main().catch(console.error)
