/**
 * Flattens game_box_scores.player_stats JSON into a relational player_game_stats table.
 * Matches players by normalized name + school_slug.
 * Run: node --env-file=.env.local scripts/build-player-game-stats.mjs
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

// team_name (from box scores) → school_slug
const TEAM_NAME_TO_SLUG = {
  'Amityville': 'amityville',
  'Babylon': 'babylon',
  'Bay Shore': 'bay-shore',
  'Bayport-Blue Point': 'bayport-blue-point',
  'Bellport': 'bellport',
  'Brentwood': 'brentwood',
  'Center Moriches': 'center-moriches',
  'Centereach': 'centereach',
  'Central Islip': 'central-islip',
  'Commack': 'commack',
  'Comsewogue': 'comsewogue',
  'Connetquot': 'connetquot',
  'Copiague': 'copiague',
  'Deer Park': 'deer-park',
  'East Hampton / Bridgehampton': 'east-hampton-bridgehampton-pierson',
  'East Hampton / Bridgehampton / Pierson': 'east-hampton-bridgehampton-pierson',
  'East Hampton / Pierson': 'east-hampton-bridgehampton-pierson',
  'East Islip': 'east-islip',
  'Eastport-South Manor': 'eastport-south-manor',
  'Floyd': 'floyd',
  'Glenn': 'glenn',
  'Greenport / Southold / Mattituck': 'greenport-southold-mattituck',
  'Half Hollow Hills East': 'half-hollow-hills-east',
  'Half Hollow Hills West': 'half-hollow-hills-west',
  'Hampton Bays': 'hampton-bays',
  'Harborfields': 'harborfields',
  'Hauppauge': 'hauppauge',
  'Huntington': 'huntington',
  'Islip': 'islip',
  'Kings Park': 'kings-park',
  'Lindenhurst': 'lindenhurst',
  'Longwood': 'longwood',
  'Mattituck / Greenport / Southold': 'greenport-southold-mattituck',
  'Miller Place': 'miller-place',
  'Mt. Sinai': 'mt-sinai',
  'Newfield': 'newfield',
  'North Babylon': 'north-babylon',
  'Northport': 'northport',
  'Patchogue-Medford': 'patchogue-medford',
  'Port Jefferson': 'port-jefferson',
  'Riverhead': 'riverhead',
  'Rocky Point': 'rocky-point',
  'Sachem East': 'sachem-east',
  'Sachem North': 'sachem-north',
  'Sayville': 'sayville',
  'Shoreham-Wading River': 'shoreham-wading-river',
  'Smithtown East': 'smithtown-east',
  'Smithtown West': 'smithtown-west',
  'Ward Melville': 'ward-melville',
  'West Babylon': 'west-babylon',
  'West Islip': 'west-islip',
  'Westhampton': 'westhampton',
  'Whitman': 'whitman',
  'Wyandanch': 'wyandanch',
  // Nassau — no slug, these get null
  'Carey': null,
  'Garden City': null,
  'Massapequa': null,
  'South Side': null,
  'Wantagh': null,
}

function normalizeName(raw) {
  if (!raw) return ''
  let s = raw.trim().replace(/\s+/g, ' ')
  // ALL CAPS → Title Case
  if (s === s.toUpperCase()) {
    s = s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  }
  return s
}

async function main() {
  // 1. Create table
  console.log('Creating player_game_stats table...')
  await sql`DROP TABLE IF EXISTS player_game_stats`
  await sql`
    CREATE TABLE player_game_stats (
      id          SERIAL PRIMARY KEY,
      game_id     INTEGER NOT NULL REFERENCES games(id),
      season      INTEGER NOT NULL,
      player_slug TEXT,
      player_name TEXT NOT NULL,
      school_slug TEXT,
      team_name   TEXT NOT NULL,
      stat_type   TEXT NOT NULL,
      -- Rushing
      rush_att    INTEGER,
      rush_yds    INTEGER,
      rush_tds    INTEGER,
      -- Passing
      pass_comp   INTEGER,
      pass_att    INTEGER,
      pass_yds    INTEGER,
      pass_tds    INTEGER,
      pass_int    INTEGER,
      -- Receiving
      rec_rec     INTEGER,
      rec_yds     INTEGER,
      rec_tds     INTEGER,
      -- Kicking
      kick_pat    INTEGER,
      kick_fg     INTEGER,
      kick_points INTEGER,
      -- Defense
      def_int     INTEGER,
      def_sacks   INTEGER,
      def_fumbles INTEGER
    )
  `

  // 2. Build player lookup: normalized_name|school_slug → player_slug
  console.log('Building player lookup...')
  const players = await sql`SELECT slug, name, school_slug FROM players`
  const playerLookup = new Map()
  for (const p of players) {
    const key = `${normalizeName(p.name)}|${p.school_slug}`
    playerLookup.set(key, p.slug)
  }
  console.log(`  ${players.length} players indexed`)

  // 3. Fetch all box scores with game season
  console.log('Fetching box scores...')
  const boxScores = await sql`
    SELECT gbs.id, gbs.game_id, gbs.player_stats, g.season
    FROM game_box_scores gbs
    JOIN games g ON g.id = gbs.game_id
    WHERE gbs.player_stats IS NOT NULL
      AND jsonb_array_length(gbs.player_stats) > 0
  `
  console.log(`  ${boxScores.length} box scores to process`)

  // 4. Flatten and match
  let totalInserted = 0
  let totalUnmatched = 0
  const unmatchedNames = new Map() // name|team → count

  for (const bs of boxScores) {
    const entries = bs.player_stats
    const rows = []

    for (const entry of entries) {
      const rawName = entry.player
      const rawTeam = entry.team_name
      if (!rawName || !rawTeam) continue

      const playerName = normalizeName(rawName)
      const schoolSlug = TEAM_NAME_TO_SLUG[rawTeam] ?? null
      const lookupKey = `${playerName}|${schoolSlug}`
      const playerSlug = schoolSlug ? (playerLookup.get(lookupKey) ?? null) : null

      if (!playerSlug && schoolSlug) {
        const k = `${playerName}|${rawTeam}`
        unmatchedNames.set(k, (unmatchedNames.get(k) ?? 0) + 1)
        totalUnmatched++
      }

      const st = entry.stat_type

      rows.push({
        game_id: bs.game_id,
        season: bs.season,
        player_slug: playerSlug,
        player_name: playerName,
        school_slug: schoolSlug,
        team_name: rawTeam,
        stat_type: st,
        rush_att:    st === 'Rushing'   ? (entry.att   ?? null) : null,
        rush_yds:    st === 'Rushing'   ? (entry.yds   ?? null) : null,
        rush_tds:    st === 'Rushing'   ? (entry.tds   ?? null) : null,
        pass_comp:   st === 'Passing'   ? (entry.comp  ?? null) : null,
        pass_att:    st === 'Passing'   ? (entry.att   ?? null) : null,
        pass_yds:    st === 'Passing'   ? (entry.yds   ?? null) : null,
        pass_tds:    st === 'Passing'   ? (entry.tds   ?? null) : null,
        pass_int:    st === 'Passing'   ? (entry.int   ?? null) : null,
        rec_rec:     st === 'Receiving' ? (entry.rec   ?? null) : null,
        rec_yds:     st === 'Receiving' ? (entry.yds   ?? null) : null,
        rec_tds:     st === 'Receiving' ? (entry.tds   ?? null) : null,
        kick_pat:    st === 'Kicking'   ? (entry.pat   ?? null) : null,
        kick_fg:     st === 'Kicking'   ? (entry.fg    ?? null) : null,
        kick_points: st === 'Kicking'   ? (entry.points ?? null) : null,
        def_int:     st === 'Defense'   ? (entry.int   ?? null) : null,
        def_sacks:   st === 'Defense'   ? (entry.sacks ?? null) : null,
        def_fumbles: st === 'Defense'   ? (entry.fumbles ?? null) : null,
      })
    }

    if (rows.length === 0) continue

    // Batch insert
    for (const r of rows) {
      await sql`
        INSERT INTO player_game_stats (
          game_id, season, player_slug, player_name, school_slug, team_name, stat_type,
          rush_att, rush_yds, rush_tds,
          pass_comp, pass_att, pass_yds, pass_tds, pass_int,
          rec_rec, rec_yds, rec_tds,
          kick_pat, kick_fg, kick_points,
          def_int, def_sacks, def_fumbles
        ) VALUES (
          ${r.game_id}, ${r.season}, ${r.player_slug}, ${r.player_name}, ${r.school_slug}, ${r.team_name}, ${r.stat_type},
          ${r.rush_att}, ${r.rush_yds}, ${r.rush_tds},
          ${r.pass_comp}, ${r.pass_att}, ${r.pass_yds}, ${r.pass_tds}, ${r.pass_int},
          ${r.rec_rec}, ${r.rec_yds}, ${r.rec_tds},
          ${r.kick_pat}, ${r.kick_fg}, ${r.kick_points},
          ${r.def_int}, ${r.def_sacks}, ${r.def_fumbles}
        )
      `
      totalInserted++
    }
  }

  // 5. Add index for fast player page queries
  console.log('Adding indexes...')
  await sql`CREATE INDEX idx_pgs_player_slug ON player_game_stats(player_slug)`
  await sql`CREATE INDEX idx_pgs_game_id ON player_game_stats(game_id)`
  await sql`CREATE INDEX idx_pgs_school_season ON player_game_stats(school_slug, season)`

  // 6. Report
  console.log(`\n=== DONE ===`)
  console.log(`Inserted: ${totalInserted} rows`)
  console.log(`Unmatched (Suffolk schools, no player_slug): ${totalUnmatched}`)

  if (unmatchedNames.size > 0) {
    console.log(`\nTop unmatched players (name|team → count):`)
    const sorted = [...unmatchedNames.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)
    for (const [k, n] of sorted) console.log(`  ${n}x  ${k}`)
  }

  // 7. Match rate
  const matched = await sql`SELECT COUNT(*) FROM player_game_stats WHERE player_slug IS NOT NULL AND school_slug IS NOT NULL`
  const total = await sql`SELECT COUNT(*) FROM player_game_stats WHERE school_slug IS NOT NULL`
  console.log(`\nMatch rate (Suffolk only): ${matched[0].count} / ${total[0].count}`)
}

main().catch(err => { console.error(err); process.exit(1) })
