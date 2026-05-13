/**
 * Ingests Section XI football data from CSVs into Neon.
 *
 * Sources:
 *   Search NY Today - Schools (8).csv        → schools
 *   Search NY Today - Teams (6).csv          → teams
 *   Search NY Today - Team Season Stats (1).csv → team_season_stats
 *   *Player-season-stats-passing-utf-8-v3.csv → player_season_stats (Passing)
 *   *Player-season-stats-rushing-utf-8-v3.csv → player_season_stats (Rushing)
 *   *Player-season-stats-receiving-utf-8-v3.csv → player_season_stats (Receiving)
 *
 * Usage: DATABASE_URL=<url> node scripts/ingest-football.mjs
 */

import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const { Pool } = pg

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('Set DATABASE_URL'); process.exit(1) }

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

const CSV_DIR = path.resolve(
  process.env.HOME,
  'Documents/csv/*Football Data'
)

// ── helpers ──────────────────────────────────────────────────────────────────

function toInt(v) { const n = parseInt(v, 10); return isNaN(n) ? null : n }

function divRoman(raw) {
  if (!raw) return null
  const m = raw.toLowerCase().match(/division[- ](i{1,3}v?|iv|v?i*)/)
  if (!m) return null
  const map = { i:'I', ii:'II', iii:'III', iv:'IV', v:'V' }
  return map[m[1].toLowerCase()] ?? m[1].toUpperCase()
}

function playerSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function schoolSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function parseCSV(filepath) {
  const raw = fs.readFileSync(filepath, 'utf-8').replace(/^﻿/, '')
  const lines = raw.split('\n')
  const headers = parseCSVLine(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const vals = parseCSVLine(line)
    const obj = {}
    headers.forEach((h, j) => { obj[h.trim()] = (vals[j] ?? '').trim() })
    rows.push(obj)
  }
  return rows
}

function parseCSVLine(line) {
  const result = []
  let cur = '', inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      result.push(cur); cur = ''
    } else cur += ch
  }
  result.push(cur)
  return result
}

// ── ingest schools ────────────────────────────────────────────────────────────

async function ingestSchools(client) {
  const rows = parseCSV(path.join(CSV_DIR, 'Search NY Today - Schools (8).csv'))
  let count = 0
  for (const r of rows) {
    const slug = r['Slug'] || schoolSlug(r['Name'])
    const division = divRoman(r['Division'])
    if (!slug || !r['Name'] || !division) continue

    const satRaw = r['Average SAT Score']
    const sat = satRaw ? toInt(satRaw.replace(/[^0-9]/g, '')) : null

    await client.query(`
      INSERT INTO schools (slug, name, division, section, address, phone, email, website,
        enrollment, graduation_rate, avg_sat, ap_pass_rate, college_acceptance_rate, short_description)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (slug) DO UPDATE SET
        name=EXCLUDED.name, division=EXCLUDED.division, address=EXCLUDED.address,
        phone=EXCLUDED.phone, email=EXCLUDED.email, website=EXCLUDED.website,
        enrollment=EXCLUDED.enrollment, graduation_rate=EXCLUDED.graduation_rate,
        avg_sat=EXCLUDED.avg_sat, ap_pass_rate=EXCLUDED.ap_pass_rate,
        college_acceptance_rate=EXCLUDED.college_acceptance_rate,
        short_description=EXCLUDED.short_description
    `, [
      slug, r['Name'], division, 'XI',
      r['Address'] || null, r['Phone Number'] || null, r['Administrative Email'] || null,
      r['School Website'] || null,
      toInt(r['Enrollment']?.replace(/[^0-9]/g, '')),
      r['Graduation Rate'] || null,
      sat,
      r['AP Exam Pass Rate'] || null, r['College Acceptance Rate'] || null,
      r['Short Description'] || null,
    ])
    count++
  }
  console.log(`  schools: ${count} upserted`)
}

// ── ingest teams ─────────────────────────────────────────────────────────────

async function ingestTeams(client) {
  const rows = parseCSV(path.join(CSV_DIR, 'Search NY Today - Teams (6).csv'))
  let count = 0
  for (const r of rows) {
    const slug = r['Slug']
    const name = r['Name']
    const division = divRoman(r['Division'])
    const schoolSlugVal = r['School'] || schoolSlug(name.replace(/\s+varsity\s+football/i, ''))

    if (!slug || !name || !division) continue

    await client.query(`
      INSERT INTO teams (slug, name, school_slug, division, section, sport, level, gender,
        logo_url, large_image_url, team_article, home_page_sub_header)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (slug) DO UPDATE SET
        name=EXCLUDED.name, school_slug=EXCLUDED.school_slug, division=EXCLUDED.division,
        logo_url=EXCLUDED.logo_url, large_image_url=EXCLUDED.large_image_url,
        team_article=EXCLUDED.team_article, home_page_sub_header=EXCLUDED.home_page_sub_header
    `, [
      slug, name, schoolSlugVal, division, 'XI', 'Football', 'Varsity', 'Boys',
      r['Small Logo'] || null, r['Large Image'] || null,
      r['Team Page Article'] || null, r['Home Page Sub-Header'] || null,
    ])
    count++
  }
  console.log(`  teams: ${count} upserted`)
}

// ── ingest team_season_stats ──────────────────────────────────────────────────

async function ingestTeamSeasonStats(client) {
  const rows = parseCSV(path.join(CSV_DIR, 'Search NY Today - Team Season Stats (1).csv'))
  let count = 0
  for (const r of rows) {
    const teamSlug = r['Team']
    const schoolSlugVal = r['School']
    const season = toInt(r['Season'])
    const division = divRoman(r['Division'])
    if (!teamSlug || !season || !division) continue

    await client.query(`
      INSERT INTO team_season_stats (
        team_slug, school_slug, season, division, section,
        conference_wins, conference_losses, conference_ties,
        overall_wins, overall_losses, overall_ties)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (team_slug, season) DO UPDATE SET
        conference_wins=EXCLUDED.conference_wins, conference_losses=EXCLUDED.conference_losses,
        conference_ties=EXCLUDED.conference_ties, overall_wins=EXCLUDED.overall_wins,
        overall_losses=EXCLUDED.overall_losses, overall_ties=EXCLUDED.overall_ties,
        division=EXCLUDED.division
    `, [
      teamSlug, schoolSlugVal || null, season, division, 'XI',
      toInt(r['Conference Wins']) ?? 0, toInt(r['Conference Losses']) ?? 0,
      toInt(r['Conference Ties']) ?? 0,
      toInt(r['Overall Wins']) ?? 0, toInt(r['Overall Losses']) ?? 0,
      toInt(r['Overall Ties']) ?? 0,
    ])
    count++
  }
  console.log(`  team_season_stats: ${count} upserted`)
}

// ── ingest player season stats (passing) ──────────────────────────────────────

async function ingestPassing(client) {
  const rows = parseCSV(path.join(CSV_DIR, '*Player-season-stats-passing-utf-8-v3.csv'))
  let count = 0
  const seen = new Set()
  for (const r of rows) {
    const playerName = r['Player']
    const school = r['School']
    const season = toInt(r['Season'])
    if (!playerName || !season) continue

    const slug = playerSlug(playerName)
    const sSlug = schoolSlug(school)
    const key = `${slug}|${season}|Passing`
    if (seen.has(key)) continue
    seen.add(key)

    // Ensure player row exists
    await client.query(`
      INSERT INTO players (slug, name, school_slug, position)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, school_slug=EXCLUDED.school_slug
    `, [slug, playerName, sSlug || null, 'QB'])

    await client.query(`
      INSERT INTO player_season_stats (
        player_slug, player_name, school_slug, school_name, season, stat_type, section,
        completions, attempts, pass_yards, pass_tds, interceptions)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (player_slug, season, stat_type) DO UPDATE SET
        completions=EXCLUDED.completions, attempts=EXCLUDED.attempts,
        pass_yards=EXCLUDED.pass_yards, pass_tds=EXCLUDED.pass_tds,
        interceptions=EXCLUDED.interceptions
    `, [
      slug, playerName, sSlug || null, school, season, 'Passing', 'XI',
      toInt(r['COMPS']), toInt(r['ATT']),
      toInt(r['YDS']?.replace(/,/g, '')),
      toInt(r['TD']), toInt(r['INTS']),
    ])
    count++
  }
  console.log(`  passing stats: ${count} upserted`)
}

// ── ingest player season stats (rushing) ──────────────────────────────────────

async function ingestRushing(client) {
  const rows = parseCSV(path.join(CSV_DIR, '*Player-season-stats-rushing-utf-8-v3.csv'))
  let count = 0
  const seen = new Set()
  for (const r of rows) {
    const playerName = r['Player']
    const school = r['School']
    const season = toInt(r['Season'])
    if (!playerName || !season) continue

    const slug = playerSlug(playerName)
    const sSlug = schoolSlug(school)
    const key = `${slug}|${season}|Rushing`
    if (seen.has(key)) continue
    seen.add(key)

    await client.query(`
      INSERT INTO players (slug, name, school_slug, position)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name
    `, [slug, playerName, sSlug || null, 'RB'])

    await client.query(`
      INSERT INTO player_season_stats (
        player_slug, player_name, school_slug, school_name, team_name, season, stat_type, section,
        rush_attempts, rush_yards, rush_tds)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (player_slug, season, stat_type) DO UPDATE SET
        rush_attempts=EXCLUDED.rush_attempts, rush_yards=EXCLUDED.rush_yards,
        rush_tds=EXCLUDED.rush_tds
    `, [
      slug, playerName, sSlug || null, school, r['Team'] || null, season, 'Rushing', 'XI',
      toInt(r['ATT']), toInt(r['YDS']?.replace(/,/g, '')), toInt(r['TD']),
    ])
    count++
  }
  console.log(`  rushing stats: ${count} upserted`)
}

// ── ingest player season stats (receiving) ────────────────────────────────────

async function ingestReceiving(client) {
  const rows = parseCSV(path.join(CSV_DIR, '*Player-season-stats-receiving-utf-8-v3.csv'))
  let count = 0
  const seen = new Set()
  for (const r of rows) {
    const playerName = r['Player']
    const school = r['School']
    const season = toInt(r['Season'])
    if (!playerName || !season) continue

    const slug = playerSlug(playerName)
    const sSlug = schoolSlug(school)
    const key = `${slug}|${season}|Receiving`
    if (seen.has(key)) continue
    seen.add(key)

    await client.query(`
      INSERT INTO players (slug, name, school_slug, position)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name
    `, [slug, playerName, sSlug || null, 'WR'])

    await client.query(`
      INSERT INTO player_season_stats (
        player_slug, player_name, school_slug, school_name, team_name, season, stat_type, section,
        receptions, recv_yards, recv_tds, pat)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (player_slug, season, stat_type) DO UPDATE SET
        receptions=EXCLUDED.receptions, recv_yards=EXCLUDED.recv_yards,
        recv_tds=EXCLUDED.recv_tds, pat=EXCLUDED.pat
    `, [
      slug, playerName, sSlug || null, school, r['Team'] || null, season, 'Receiving', 'XI',
      toInt(r['RECS']), toInt(r['YDS']?.replace(/,/g, '')),
      toInt(r['TDS']), toInt(r['PATS']),
    ])
    count++
  }
  console.log(`  receiving stats: ${count} upserted`)
}

// ── main ──────────────────────────────────────────────────────────────────────

const client = await pool.connect()
try {
  await client.query('BEGIN')
  console.log('Ingesting schools...')
  await ingestSchools(client)
  console.log('Ingesting teams...')
  await ingestTeams(client)
  console.log('Ingesting team season stats...')
  await ingestTeamSeasonStats(client)
  console.log('Ingesting passing stats...')
  await ingestPassing(client)
  console.log('Ingesting rushing stats...')
  await ingestRushing(client)
  console.log('Ingesting receiving stats...')
  await ingestReceiving(client)
  await client.query('COMMIT')
  console.log('\n✅ Ingest complete')
} catch (err) {
  await client.query('ROLLBACK')
  console.error('❌ Ingest failed:', err.message)
  process.exit(1)
} finally {
  client.release()
  await pool.end()
}
