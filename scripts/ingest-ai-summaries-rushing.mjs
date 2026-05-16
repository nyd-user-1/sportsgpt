/**
 * Ingests AI summaries from the 2024 Rushing Leaders CSV into player_season_stats.
 * Also fixes the Joseph Filardi row where the player name field contains a URL.
 *
 * Usage: node --env-file=.env.local scripts/ingest-ai-summaries-rushing.mjs
 */

import { neon } from '@neondatabase/serverless'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'

const CSV = '/Users/brendanstanton/code/sports assets/1 Review Assets/CSV/** 2024 Rushing.csv'

function toSlug(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function readCSV(path) {
  const rows = []
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity })
  let header = null
  for await (const line of rl) {
    const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim())
    if (!header) { header = cols; continue }
    const row = {}
    header.forEach((h, i) => row[h] = cols[i] ?? '')
    rows.push(row)
  }
  return rows
}

async function main() {
  const sql = neon(process.env.DATABASE_URL)

  // Read full file as text to handle commas inside quoted fields properly
  const { readFileSync } = await import('fs')
  const raw = readFileSync(CSV, 'utf-8')
  const lines = raw.split('\n').filter(l => l.trim())

  // Parse with proper CSV handling (quoted fields may contain commas)
  function parseLine(line) {
    const result = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    result.push(cur.trim())
    return result
  }

  const header = parseLine(lines[0])
  const playerIdx  = header.indexOf('PLAYER')
  const schoolIdx  = header.indexOf('SCHOOL')
  const summaryIdx = header.indexOf('AI summary')
  const yearIdx    = header.indexOf('YEAR')

  console.log('Headers:', header)
  console.log(`Player:${playerIdx} School:${schoolIdx} Summary:${summaryIdx} Year:${yearIdx}`)

  let updated = 0, skipped = 0, notFound = 0

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i])
    let playerName = cols[playerIdx]?.trim()
    const school   = cols[schoolIdx]?.trim()
    const summary  = cols[summaryIdx]?.trim()
    const year     = parseInt(cols[yearIdx]?.trim())

    if (!summary || !year) { skipped++; continue }

    // Fix: row where player name is a URL (Joseph Filardi, Half Hollow Hills West)
    if (playerName && playerName.startsWith('http')) {
      console.log(`  Row ${i}: URL in PLAYER field → fixing as Joseph Filardi (${school})`)
      playerName = 'Joseph Filardi'
    }

    if (!playerName) { skipped++; continue }

    const playerSlug = toSlug(playerName)

    const rows = await sql`
      UPDATE player_season_stats
      SET ai_summary = ${summary}
      WHERE player_slug = ${playerSlug}
        AND season = ${year}
        AND stat_type = 'Rushing'
      RETURNING player_slug
    `

    if (rows.length > 0) {
      console.log(`  ✓ ${playerName} (${playerSlug}) ${year}`)
      updated++
    } else {
      console.log(`  ✗ Not found: ${playerName} → ${playerSlug} (${school}, ${year})`)
      notFound++
    }
  }

  console.log(`\nDone. Updated: ${updated}, Not found: ${notFound}, Skipped: ${skipped}`)
}

main().catch(err => { console.error(err); process.exit(1) })
