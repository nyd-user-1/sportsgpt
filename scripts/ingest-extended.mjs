/**
 * ingest-extended.mjs — extends the SportsGPT DB with all newly found data.
 *
 * Stage 1 — Schema migrations (new columns + games table)
 * Stage 2 — School short descriptions
 * Stage 3 — Historical team_season_stats (2021-2023)
 * Stage 4 — Historical player stats
 *              Passing 2020-2023 (PASSING LEADERS AGAIN.csv)
 *              Rushing 2020-2022 (individual year files)
 *              Receiving 2023
 * Stage 5 — New stat types: Scoring, Touchdowns, Total Yards (2024)
 * Stage 6 — Games table (2024 game-by-game results, all teams)
 *
 * Usage: DATABASE_URL=<url> node scripts/ingest-extended.mjs
 */

import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { glob } from 'fs/promises'

const { Pool } = pg

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('Set DATABASE_URL'); process.exit(1) }

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

const CSV_DIR = path.resolve(process.env.HOME, 'Code/sports assets/1 Review Assets/CSV')

// ── helpers ───────────────────────────────────────────────────────────────────

function toInt(v) {
  if (v == null || v === '') return null
  const n = parseInt(String(v).replace(/,/g, ''), 10)
  return isNaN(n) ? null : n
}

function toFloat(v) {
  if (v == null || v === '') return null
  const n = parseFloat(String(v).replace(/,/g, ''))
  return isNaN(n) ? null : n
}

function slugify(name) {
  if (!name) return ''
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Map display name variants found in CSV files → canonical school slug in DB
const SCHOOL_SLUG_OVERRIDES = {
  'east hampton': 'east-hampton-bridgehampton-pierson',
  'east hampton/bridgehampton/pierson': 'east-hampton-bridgehampton-pierson',
  'east hampton / bridgehampton / pierson': 'east-hampton-bridgehampton-pierson',
  'east hampton / bridgehampton / pierson football': 'east-hampton-bridgehampton-pierson',
  'easthampton': 'east-hampton-bridgehampton-pierson',
  'eastport': 'eastport-south-manor',
  'hills east': 'half-hollow-hills-east',
  'hills west': 'half-hollow-hills-west',
  'hhhe': 'half-hollow-hills-east',
  'hhhw': 'half-hollow-hills-west',
  'half hollow hills e': 'half-hollow-hills-east',
  'half hollow hills w': 'half-hollow-hills-west',
  'greenport': 'greenport-southold-mattituck',
  'greenport/southold/mattituck': 'greenport-southold-mattituck',
  'greenport / southold / mattituck': 'greenport-southold-mattituck',
  'pat-med': 'patchogue-medford',
  'patchogue medford': 'patchogue-medford',
  'swr': 'shoreham-wading-river',
  'shoreham wading river': 'shoreham-wading-river',
}

function schoolNameToSlug(name) {
  if (!name) return ''
  const key = name.toLowerCase().trim()
  return SCHOOL_SLUG_OVERRIDES[key] ?? slugify(name)
}

function teamSlug(schoolName) {
  return schoolNameToSlug(schoolName) + '-varsity-football'
}

function parseDate(raw) {
  if (!raw) return null
  raw = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const parts = raw.split('/')
  if (parts.length === 3) {
    let [m, d, y] = parts
    if (y.length === 2) y = '20' + y
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return null
}

// Proper CSV parser that handles quoted fields with embedded newlines
function parseCSV(filepath) {
  const raw = fs.readFileSync(filepath, 'utf-8').replace(/^﻿/, '')
  const rows = []
  let pos = 0

  function readField() {
    if (pos >= raw.length) return ''
    if (raw[pos] !== '"') {
      const start = pos
      while (pos < raw.length && raw[pos] !== ',' && raw[pos] !== '\n' && raw[pos] !== '\r') pos++
      return raw.slice(start, pos).trim()
    }
    pos++ // skip opening quote
    let field = ''
    while (pos < raw.length) {
      if (raw[pos] === '"' && raw[pos + 1] === '"') { field += '"'; pos += 2 }
      else if (raw[pos] === '"') { pos++; break }
      else field += raw[pos++]
    }
    return field
  }

  function readRecord() {
    const fields = []
    while (pos < raw.length) {
      fields.push(readField())
      if (pos >= raw.length || raw[pos] === '\n' || raw[pos] === '\r') break
      if (raw[pos] === ',') pos++
    }
    if (pos < raw.length && raw[pos] === '\r') pos++
    if (pos < raw.length && raw[pos] === '\n') pos++
    return fields
  }

  const headers = readRecord().map(h => h.trim())
  while (pos < raw.length) {
    if (raw[pos] === '\r' || raw[pos] === '\n') { pos++; continue }
    const fields = readRecord()
    if (fields.every(f => !f)) continue
    const obj = {}
    headers.forEach((h, j) => { obj[h] = (fields[j] ?? '').trim() })
    rows.push(obj)
  }
  return rows
}

// Parses NAME field from Scoring/Touchdowns/Total Yards CSVs
// Format: "PlayerNamePOS\nSchoolAbbrev (Town)"
// All valid school slugs in the DB — used to guard FK constraints
const VALID_SCHOOL_SLUGS = new Set([
  'amityville','babylon','bay-shore','bayport-blue-point','bellport','brentwood',
  'center-moriches','centereach','central-islip','commack','comsewogue','connetquot',
  'copiague','deer-park','east-hampton-bridgehampton-pierson','east-islip',
  'eastport-south-manor','floyd','glenn','greenport-southold-mattituck',
  'half-hollow-hills-east','half-hollow-hills-west','hampton-bays','harborfields',
  'hauppauge','huntington','islip','kings-park','lindenhurst','longwood',
  'miller-place','mt-sinai','newfield','north-babylon','northport',
  'patchogue-medford','port-jefferson','riverhead','rocky-point',
  'sachem-east','sachem-north','sayville','shoreham-wading-river',
  'smithtown-east','smithtown-west','southampton','ward-melville',
  'west-babylon','west-islip','westhampton','whitman','wyandanch',
])

function safeSchoolSlug(slug) {
  if (!slug) return null
  return VALID_SCHOOL_SLUGS.has(slug) ? slug : null
}

const SCHOOL_ABBREV = {
  'WMHS': 'ward-melville',
  'HHHW': 'half-hollow-hills-west',
  'WFHS': 'floyd',             // William Floyd High School → DB slug is 'floyd'
  'SWRHS': 'shoreham-wading-river',
}

function parseStatName(raw) {
  const parts = raw.split('\n')
  const nameLine = parts[0].trim()
  const schoolLine = (parts[1] ?? '').trim()

  // Separate player name from trailing position codes (e.g. "BurgosQB" → "Burgos", "QB")
  const m = nameLine.match(/^(.*[a-z'])((?:[A-Z]{1,3}[,\s]*)+)$/)
  const playerName = (m ? m[1] : nameLine).trim()
  const position = m ? m[2].replace(/,\s*/g, ', ').trim() : null

  let schoolSlugVal = null
  let schoolName = null
  if (schoolLine) {
    const abbrev = schoolLine.replace(/\s*\(.*\)$/, '').trim()
    schoolName = abbrev
    const resolved = SCHOOL_ABBREV[abbrev] ?? slugify(abbrev)
    schoolSlugVal = safeSchoolSlug(resolved)
  }

  return { playerName, position, schoolSlugVal, schoolName }
}

function divRoman(raw) {
  if (!raw) return null
  const m = raw.toLowerCase().match(/division[- ](i{1,3}v?|iv|v?i*)/i)
  if (!m) {
    // bare roman numeral
    const bare = { i: 'I', ii: 'II', iii: 'III', iv: 'IV' }
    return bare[raw.toLowerCase().trim()] ?? null
  }
  const map = { i: 'I', ii: 'II', iii: 'III', iv: 'IV' }
  return map[m[1].toLowerCase()] ?? m[1].toUpperCase()
}

// ── Stage 1: Schema migrations ────────────────────────────────────────────────

async function migrateSchema(client) {
  // New columns on player_season_stats
  const newCols = [
    'games_played INT',
    'season_rank INT',
    'total_yards INT',
    'yards_per_game NUMERIC',
    'total_tds INT',
    'tds_per_game NUMERIC',
    'fumble_return_tds INT',
    'int_return_tds INT',
    'punt_return_tds INT',
    'kickoff_return_tds INT',
    'points INT',
    'points_per_game NUMERIC',
    'fg INT',
    'safeties INT',
  ]
  for (const col of newCols) {
    const colName = col.split(' ')[0]
    await client.query(`ALTER TABLE player_season_stats ADD COLUMN IF NOT EXISTS ${colName} ${col.split(' ').slice(1).join(' ')}`)
  }

  // games table
  await client.query(`
    CREATE TABLE IF NOT EXISTS games (
      id           SERIAL PRIMARY KEY,
      game_name    TEXT,
      game_date    DATE,
      season       INT NOT NULL,
      home_team_slug TEXT NOT NULL,
      away_team_slug TEXT NOT NULL,
      home_score   INT,
      away_score   INT,
      is_division_game BOOL,
      game_number  INT,
      section      TEXT DEFAULT 'XI',
      UNIQUE (game_date, home_team_slug, away_team_slug)
    )
  `)

  console.log('  schema migrations applied')
}

// ── Stage 2: School short descriptions ───────────────────────────────────────

async function ingestSchoolDescriptions(client) {
  const rows = parseCSV(path.join(CSV_DIR, 'schoosl with address and description.csv'))
  let count = 0
  for (const r of rows) {
    const slug = r['Slug'] || slugify(r['Name'])
    const desc = r['Short Description']
    if (!slug || !desc) continue
    await client.query(`
      UPDATE schools SET short_description = $1 WHERE slug = $2
    `, [desc, slug])
    count++
  }
  console.log(`  school descriptions: ${count} updated`)
}

// ── Stage 3: Historical team_season_stats (2021–2023) ────────────────────────

// All historical standings files use one of two layouts; normalise here
function normaliseStandingsRow(r) {
  const schoolName =
    r['School Name'] || r['School'] || r['Name'] || ''
  const divisionRaw =
    r['Division Name'] || r['Division'] || ''
  const seasonRaw =
    r['Season Name'] || r['Season'] || r['SEASON'] || ''
  return {
    schoolName: schoolName.trim(),
    division: divRoman(divisionRaw),
    season: toInt(seasonRaw) || toInt(divisionRaw.replace(/\D/g, '')),
    conf_w: toInt(r['Conference Wins']) ?? 0,
    conf_l: toInt(r['Conference Losses']) ?? 0,
    conf_t: toInt(r['Conference Ties']) ?? 0,
    ov_w:   toInt(r['Overall Wins']) ?? 0,
    ov_l:   toInt(r['Overall Losses']) ?? 0,
    ov_t:   toInt(r['Overall Ties']) ?? 0,
  }
}

const STANDINGS_FILES = [
  '2021_Standings_D1_D2.csv',
  '2021_Standings_D3_D4.csv',
  'standings_2022_corrected.csv',
  'standings_2022_div3_div4_corrected.csv',
  'standings_division1_2023.csv',
  'standings_division2_2023.csv',
  'standings_division3_4_2023.csv',
]

async function ingestHistoricalStandings(client) {
  let total = 0
  for (const fname of STANDINGS_FILES) {
    const fpath = path.join(CSV_DIR, fname)
    if (!fs.existsSync(fpath)) { console.warn(`  WARN: ${fname} not found, skipping`); continue }
    const rows = parseCSV(fpath)
    let count = 0
    for (const r of rows) {
      const n = normaliseStandingsRow(r)
      if (!n.schoolName || !n.division || !n.season) continue
      const sSlug = schoolNameToSlug(n.schoolName)
      const tSlug = teamSlug(n.schoolName)
      await client.query(`
        INSERT INTO team_season_stats (
          team_slug, school_slug, season, division, section,
          conference_wins, conference_losses, conference_ties,
          overall_wins, overall_losses, overall_ties)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (team_slug, season) DO UPDATE SET
          conference_wins=EXCLUDED.conference_wins,
          conference_losses=EXCLUDED.conference_losses,
          conference_ties=EXCLUDED.conference_ties,
          overall_wins=EXCLUDED.overall_wins,
          overall_losses=EXCLUDED.overall_losses,
          overall_ties=EXCLUDED.overall_ties,
          division=EXCLUDED.division
      `, [
        tSlug, sSlug, n.season, n.division, 'XI',
        n.conf_w, n.conf_l, n.conf_t,
        n.ov_w, n.ov_l, n.ov_t,
      ])
      count++
    }
    total += count
    console.log(`  ${fname}: ${count} rows`)
  }
  console.log(`  historical standings total: ${total} upserted`)
}

// ── Stage 4: Historical player stats ─────────────────────────────────────────

async function upsertPlayer(client, slug, name, schoolSlugVal, position) {
  const sSlug = safeSchoolSlug(schoolSlugVal)
  await client.query(`
    INSERT INTO players (slug, name, school_slug, position)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name
  `, [slug, name, sSlug, position])
}

// Passing 2020-2023 — PASSING LEADERS AGAIN.csv (Rank, Season, Player, School, COMP, ATT, YDS, TD, INTS)
async function ingestHistoricalPassing(client) {
  const fpath = path.join(CSV_DIR, 'PASSING LEADERS AGAIN.csv')
  const rows = parseCSV(fpath)
  const seen = new Set()
  let count = 0
  for (const r of rows) {
    const playerName = r['Player']
    const school = r['School']
    const season = toInt(r['Season'])
    if (!playerName || !season) continue
    const slug = slugify(playerName)
    const sSlugRaw = slugify(school)
    const sSlug = safeSchoolSlug(sSlugRaw)
    const key = `${slug}|${season}|Passing`
    if (seen.has(key)) continue
    seen.add(key)
    await upsertPlayer(client, slug, playerName, sSlug, 'QB')
    await client.query(`
      INSERT INTO player_season_stats (
        player_slug, player_name, school_slug, school_name, season, stat_type, section,
        season_rank, completions, attempts, pass_yards, pass_tds, interceptions)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (player_slug, season, stat_type) DO UPDATE SET
        season_rank=EXCLUDED.season_rank,
        completions=EXCLUDED.completions, attempts=EXCLUDED.attempts,
        pass_yards=EXCLUDED.pass_yards, pass_tds=EXCLUDED.pass_tds,
        interceptions=EXCLUDED.interceptions
    `, [
      slug, playerName, sSlug, school, season, 'Passing', 'XI',
      toInt(r['Rank']),
      toInt(r['COMP']), toInt(r['ATT']),
      toInt(r['YDS']), toInt(r['TD']), toInt(r['INTS']),
    ])
    count++
  }
  console.log(`  historical passing 2020-2023: ${count} upserted`)
}

// Rushing 2020-2022 — SEASON, SEASON RANK, PLAYER SEASON, SCHOOL, ATT, YDS, TD
const RUSHING_FILES = [
  { file: '2020 RUSHING LEADERS.csv', season: 2020 },
  { file: '2021 RUSHING LEADERS.csv', season: 2021 },
  { file: '2022 RUSHING LEADERS.csv', season: 2022 },
]

async function ingestHistoricalRushing(client) {
  let total = 0
  for (const { file, season } of RUSHING_FILES) {
    const fpath = path.join(CSV_DIR, file)
    if (!fs.existsSync(fpath)) { console.warn(`  WARN: ${file} not found`); continue }
    const rows = parseCSV(fpath)
    const seen = new Set()
    let count = 0
    for (const r of rows) {
      const playerName = (r['PLAYER SEASON'] || r['Player'] || '').trim()
      const school = (r['SCHOOL'] || r['School'] || '').trim()
      const rowSeason = toInt(r['SEASON'] || r['Season']) ?? season
      if (!playerName) continue
      const slug = slugify(playerName)
      const sSlug = safeSchoolSlug(slugify(school))
      const key = `${slug}|${rowSeason}|Rushing`
      if (seen.has(key)) continue
      seen.add(key)
      await upsertPlayer(client, slug, playerName, sSlug, 'RB')
      await client.query(`
        INSERT INTO player_season_stats (
          player_slug, player_name, school_slug, school_name, season, stat_type, section,
          season_rank, rush_attempts, rush_yards, rush_tds)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (player_slug, season, stat_type) DO UPDATE SET
          season_rank=EXCLUDED.season_rank,
          rush_attempts=EXCLUDED.rush_attempts,
          rush_yards=EXCLUDED.rush_yards,
          rush_tds=EXCLUDED.rush_tds
      `, [
        slug, playerName, sSlug, school, rowSeason, 'Rushing', 'XI',
        toInt(r['SEASON RANK'] || r['Rank']),
        toInt(r['ATT']), toInt(r['YDS']), toInt(r['TD']),
      ])
      count++
    }
    total += count
    console.log(`  ${file}: ${count} rows`)
  }
  console.log(`  historical rushing total: ${total} upserted`)
}

// Receiving 2023 — Rank, Player, School, RECS, YDS, TDS, PATS
async function ingestHistoricalReceiving(client) {
  const fpath = path.join(CSV_DIR, 'Seasons/2023/Section XI/Receiving Leaders/2023 Receiving Leaders.csv')
  if (!fs.existsSync(fpath)) { console.warn('  WARN: 2023 receiving file not found'); return }
  const rows = parseCSV(fpath)
  const seen = new Set()
  let count = 0
  for (const r of rows) {
    const playerName = (r['Player'] || '').trim()
    const school = (r['School'] || '').trim()
    if (!playerName) continue
    const slug = slugify(playerName)
    const sSlug = safeSchoolSlug(slugify(school))
    const key = `${slug}|2023|Receiving`
    if (seen.has(key)) continue
    seen.add(key)
    await upsertPlayer(client, slug, playerName, sSlug, 'WR')
    await client.query(`
      INSERT INTO player_season_stats (
        player_slug, player_name, school_slug, school_name, season, stat_type, section,
        season_rank, receptions, recv_yards, recv_tds, pat)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (player_slug, season, stat_type) DO UPDATE SET
        season_rank=EXCLUDED.season_rank,
        receptions=EXCLUDED.receptions,
        recv_yards=EXCLUDED.recv_yards,
        recv_tds=EXCLUDED.recv_tds,
        pat=EXCLUDED.pat
    `, [
      slug, playerName, sSlug, school, 2023, 'Receiving', 'XI',
      toInt(r['Rank']),
      toInt(r['RECS']), toInt(r['YDS']), toInt(r['TDS']), toInt(r['PATS']),
    ])
    count++
  }
  console.log(`  2023 receiving: ${count} upserted`)
}

// ── Stage 5: New stat types (2024) ────────────────────────────────────────────

// Scoring — #, NAME, PTS, PTS/G, TD, FG, PAT, S, GP
async function ingestScoring(client) {
  const fpath = path.join(CSV_DIR, 'Scoring-Scoring.csv')
  const rows = parseCSV(fpath)
  const seen = new Set()
  let count = 0
  for (const r of rows) {
    if (!r['NAME']) continue
    const { playerName, position, schoolSlugVal, schoolName } = parseStatName(r['NAME'])
    if (!playerName) continue
    const slug = slugify(playerName)
    const key = `${slug}|2024|Scoring`
    if (seen.has(key)) continue
    seen.add(key)
    const rank = toInt(r['#'])
    await upsertPlayer(client, slug, playerName, schoolSlugVal, position ?? 'ATH')
    await client.query(`
      INSERT INTO player_season_stats (
        player_slug, player_name, school_slug, school_name, season, stat_type, section,
        season_rank, points, points_per_game, total_tds, fg, pat, safeties, games_played)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      ON CONFLICT (player_slug, season, stat_type) DO UPDATE SET
        season_rank=EXCLUDED.season_rank,
        points=EXCLUDED.points, points_per_game=EXCLUDED.points_per_game,
        total_tds=EXCLUDED.total_tds, fg=EXCLUDED.fg, pat=EXCLUDED.pat,
        safeties=EXCLUDED.safeties, games_played=EXCLUDED.games_played
    `, [
      slug, playerName, schoolSlugVal || null, schoolName, 2024, 'Scoring', 'XI',
      rank,
      toInt(r['PTS']), toFloat(r['PTS/G']),
      toInt(r['TD']), toInt(r['FG']), toInt(r['PAT']), toInt(r['S']),
      toInt(r['GP']),
    ])
    count++
  }
  console.log(`  scoring 2024: ${count} upserted`)
}

// Touchdowns — #, NAME, TOT TDS, RUS, REC, FR, IR, PR, KOR, TDS/G, GP
async function ingestTouchdowns(client) {
  const fpath = path.join(CSV_DIR, 'Touchdowns-Touchdowns.csv')
  const rows = parseCSV(fpath)
  const seen = new Set()
  let count = 0
  for (const r of rows) {
    if (!r['NAME']) continue
    const { playerName, position, schoolSlugVal, schoolName } = parseStatName(r['NAME'])
    if (!playerName) continue
    const slug = slugify(playerName)
    const key = `${slug}|2024|Touchdowns`
    if (seen.has(key)) continue
    seen.add(key)
    const rank = toInt(r['#'])
    await upsertPlayer(client, slug, playerName, schoolSlugVal, position ?? 'ATH')
    await client.query(`
      INSERT INTO player_season_stats (
        player_slug, player_name, school_slug, school_name, season, stat_type, section,
        season_rank, total_tds, rush_tds, recv_tds,
        fumble_return_tds, int_return_tds, punt_return_tds, kickoff_return_tds,
        tds_per_game, games_played)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      ON CONFLICT (player_slug, season, stat_type) DO UPDATE SET
        season_rank=EXCLUDED.season_rank,
        total_tds=EXCLUDED.total_tds, rush_tds=EXCLUDED.rush_tds, recv_tds=EXCLUDED.recv_tds,
        fumble_return_tds=EXCLUDED.fumble_return_tds,
        int_return_tds=EXCLUDED.int_return_tds,
        punt_return_tds=EXCLUDED.punt_return_tds,
        kickoff_return_tds=EXCLUDED.kickoff_return_tds,
        tds_per_game=EXCLUDED.tds_per_game, games_played=EXCLUDED.games_played
    `, [
      slug, playerName, schoolSlugVal || null, schoolName, 2024, 'Touchdowns', 'XI',
      rank,
      toInt(r['TOT TDS']), toInt(r['RUS']), toInt(r['REC']),
      toInt(r['FR']), toInt(r['IR']), toInt(r['PR']), toInt(r['KOR']),
      toFloat(r['TDS/G']), toInt(r['GP']),
    ])
    count++
  }
  console.log(`  touchdowns 2024: ${count} upserted`)
}

// Total Yards — #, NAME, TOT YDS, YDS/G, PASS, RUSH, REC, GP
async function ingestTotalYards(client) {
  const fpath = path.join(CSV_DIR, 'Total Yards-Total Yards.csv')
  const rows = parseCSV(fpath)
  const seen = new Set()
  let count = 0
  for (const r of rows) {
    if (!r['NAME']) continue
    const { playerName, position, schoolSlugVal, schoolName } = parseStatName(r['NAME'])
    if (!playerName) continue
    const slug = slugify(playerName)
    const key = `${slug}|2024|Total Yards`
    if (seen.has(key)) continue
    seen.add(key)
    const rank = toInt(r['#'])
    await upsertPlayer(client, slug, playerName, schoolSlugVal, position ?? 'ATH')
    await client.query(`
      INSERT INTO player_season_stats (
        player_slug, player_name, school_slug, school_name, season, stat_type, section,
        season_rank, total_yards, yards_per_game, pass_yards, rush_yards, recv_yards, games_played)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (player_slug, season, stat_type) DO UPDATE SET
        season_rank=EXCLUDED.season_rank,
        total_yards=EXCLUDED.total_yards, yards_per_game=EXCLUDED.yards_per_game,
        pass_yards=EXCLUDED.pass_yards, rush_yards=EXCLUDED.rush_yards,
        recv_yards=EXCLUDED.recv_yards, games_played=EXCLUDED.games_played
    `, [
      slug, playerName, schoolSlugVal || null, schoolName, 2024, 'Total Yards', 'XI',
      rank,
      toInt(r['TOT YDS']), toFloat(r['YDS/G']),
      toInt(r['PASS']), toInt(r['RUSH']), toInt(r['REC']),
      toInt(r['GP']),
    ])
    count++
  }
  console.log(`  total yards 2024: ${count} upserted`)
}

// ── Stage 6: Games table ──────────────────────────────────────────────────────

const GAME_FILES = [
  // Per-team canonical files
  'Bay_Shore_2024_Team_Results.csv',
  'Brentwood_2024_Team_Results.csv',
  'Central_Islip_2024_Team_Results.csv',
  'Commack_2024_Team_Results.csv',
  'Connetquot_2024_Team_Results.csv',
  'East_Islip_2024_Team_Results_Cleaned.csv',
  'Lindenhurst_2024_Team_Results.csv',
  'Patchogue_Medford_2024_Team_Results.csv',
  'Riverhead_2024_Team_Results.csv',
  'Sachem_East_2024_Team_Results.csv',
  'Sachem_North_2024_Team_Results.csv',
  'Ward_Melville_2024_Team_Results.csv',
  'Whitman_2024_Team_Results.csv',
  // Multi-team numbered files (covers all remaining teams)
  'Team_Results_Cleaned (1).csv',
  'Team_Results_Cleaned (2).csv',
  'Team_Results_Cleaned (3).csv',
  'Team_Results_Cleaned (4).csv',
  'Team_Results_Cleaned (5).csv',
  'Team_Results_Cleaned (6).csv',
  'Team_Results_Cleaned (7).csv',
  'Team_Results_Cleaned (8).csv',
  'Team_Results_Cleaned (9).csv',
  'Team_Results_Cleaned (10).csv',
  'Team_Results_Cleaned (11).csv',
  'Team_Results_Cleaned (12).csv',
  'Team_Results_Cleaned (13).csv',
  'Team_Results_Cleaned (14).csv',
  'Team_Results_Cleaned (15).csv',
  'Div 3-2024Team_Results_Cleaned (2).csv',
]

async function ingestGames(client) {
  let total = 0
  let skipped = 0

  for (const fname of GAME_FILES) {
    const fpath = path.join(CSV_DIR, fname)
    if (!fs.existsSync(fpath)) { console.warn(`  WARN: ${fname} not found, skipping`); continue }
    const rows = parseCSV(fpath)
    let count = 0

    for (const r of rows) {
      const homeTeamName = r['Home Team Name'] || ''
      const awayTeamName = r['Away Team Name'] || ''
      if (!homeTeamName || !awayTeamName) continue

      const gameDate = parseDate(r['Date'] || r['date'])
      if (!gameDate) { skipped++; continue }

      const season = toInt(r['Season Name'] || r['Season'] || '2024') ?? 2024
      const homeSlug = teamSlug(homeTeamName)
      const awaySlug = teamSlug(awayTeamName)

      const homeScore = toInt(r['Home Score'])
      const awayScore = toInt(r['Away Score'])
      const gameNum = toInt(r['Game #'] || r['game_number'])
      const isDivision = r['Is Division Game?']
        ? r['Is Division Game?'].toLowerCase() === 'true'
        : null
      const gameName = r['Game Name'] || `${homeTeamName} vs. ${awayTeamName}`

      try {
        await client.query(`
          INSERT INTO games (
            game_name, game_date, season,
            home_team_slug, away_team_slug,
            home_score, away_score,
            is_division_game, game_number, section)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT (game_date, home_team_slug, away_team_slug) DO NOTHING
        `, [
          gameName, gameDate, season,
          homeSlug, awaySlug,
          homeScore, awayScore,
          isDivision, gameNum, 'XI',
        ])
        count++
      } catch (e) {
        skipped++
      }
    }
    if (count > 0) console.log(`  ${fname}: ${count} rows`)
    total += count
  }
  console.log(`  games total: ${total} upserted, ${skipped} skipped`)
}

// ── main ──────────────────────────────────────────────────────────────────────

const client = await pool.connect()
try {
  await client.query('BEGIN')

  console.log('\n[Stage 1] Schema migrations...')
  await migrateSchema(client)

  console.log('\n[Stage 2] School descriptions...')
  await ingestSchoolDescriptions(client)

  console.log('\n[Stage 3] Historical team standings (2021-2023)...')
  await ingestHistoricalStandings(client)

  console.log('\n[Stage 4] Historical player stats...')
  await ingestHistoricalPassing(client)
  await ingestHistoricalRushing(client)
  await ingestHistoricalReceiving(client)

  console.log('\n[Stage 5] New stat types (2024)...')
  await ingestScoring(client)
  await ingestTouchdowns(client)
  await ingestTotalYards(client)

  console.log('\n[Stage 6] Games (2024)...')
  await ingestGames(client)

  await client.query('COMMIT')
  console.log('\n✅ Extended ingest complete')
} catch (err) {
  await client.query('ROLLBACK')
  console.error('\n❌ Ingest failed:', err.message)
  console.error(err.stack)
  process.exit(1)
} finally {
  client.release()
  await pool.end()
}
