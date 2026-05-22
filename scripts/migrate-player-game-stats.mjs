/**
 * Migrates player stats from game_box_scores.player_stats JSONB
 * into the normalized player_game_stats table.
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-player-game-stats.mjs
 *
 * Safe to re-run — skips games already fully migrated.
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('ERROR: DATABASE_URL not set'); process.exit(1) }

const sql = neon(DATABASE_URL)

async function main() {
  // Ensure table exists with all expected columns
  await sql`
    CREATE TABLE IF NOT EXISTS player_game_stats (
      id          SERIAL PRIMARY KEY,
      game_id     INT REFERENCES games(id) ON DELETE CASCADE,
      player_name TEXT,
      player_slug TEXT,
      school_slug TEXT,
      team_name   TEXT,
      stat_type   TEXT,
      rush_att    INT,
      rush_yds    INT,
      rush_tds    INT,
      pass_comp   INT,
      pass_att    INT,
      pass_yds    INT,
      pass_tds    INT,
      pass_int    INT,
      rec_rec     INT,
      rec_yds     INT,
      rec_tds     INT,
      def_int     INT,
      def_fumbles INT
    )
  `

  // Find all box scores that have player_stats JSONB but are NOT yet in player_game_stats
  const pending = await sql`
    SELECT bs.game_id, bs.player_stats, g.season
    FROM game_box_scores bs
    JOIN games g ON g.id = bs.game_id
    WHERE bs.player_stats IS NOT NULL
      AND jsonb_array_length(bs.player_stats) > 0
      AND NOT EXISTS (
        SELECT 1 FROM player_game_stats pgs WHERE pgs.game_id = bs.game_id
      )
    ORDER BY bs.game_id
  `

  console.log(`\nFound ${pending.length} games to migrate\n`)

  // Build player name → slug lookup
  const playerRows = await sql`SELECT slug, name FROM players`
  const playerMap = new Map()
  for (const p of playerRows) {
    playerMap.set(p.name.toLowerCase().trim(), p.slug)
  }

  // Build team name → school_slug lookup
  const teamRows = await sql`SELECT name, school_slug FROM teams WHERE level = 'Varsity'`
  const teamMap = new Map()
  for (const t of teamRows) {
    teamMap.set(t.name.toLowerCase().trim(), t.school_slug)
  }

  let inserted = 0
  let skipped  = 0
  let failed   = 0

  for (const row of pending) {
    const stats = row.player_stats
    if (!Array.isArray(stats)) { skipped++; continue }

    const toInsert = stats.filter(s =>
      ['Passing', 'Rushing', 'Receiving'].includes(s.stat_type) && s.player
    )

    if (toInsert.length === 0) { skipped++; continue }

    for (const s of toInsert) {
      const playerName = (s.player ?? '').trim()
      const teamName   = (s.team_name ?? '').trim()
      const statType   = s.stat_type

      const playerSlug = playerMap.get(playerName.toLowerCase()) ?? null
      const schoolSlug = teamMap.get(teamName.toLowerCase()) ?? null

      const toInt = (v) => {
        const n = parseInt(v, 10)
        return isNaN(n) ? null : n
      }

      try {
        await sql`
          INSERT INTO player_game_stats (
            game_id, season, player_name, player_slug, school_slug, team_name, stat_type,
            rush_att, rush_yds, rush_tds,
            pass_comp, pass_att, pass_yds, pass_tds, pass_int,
            rec_rec, rec_yds, rec_tds
          ) VALUES (
            ${row.game_id},
            ${row.season},
            ${playerName},
            ${playerSlug},
            ${schoolSlug},
            ${teamName},
            ${statType},
            ${statType === 'Rushing'   ? toInt(s.att)  : null},
            ${statType === 'Rushing'   ? toInt(s.yds)  : null},
            ${statType === 'Rushing'   ? toInt(s.tds)  : null},
            ${statType === 'Passing'   ? toInt(s.comp) : null},
            ${statType === 'Passing'   ? toInt(s.att)  : null},
            ${statType === 'Passing'   ? toInt(s.yds)  : null},
            ${statType === 'Passing'   ? toInt(s.tds)  : null},
            ${statType === 'Passing'   ? toInt(s.int)  : null},
            ${statType === 'Receiving' ? toInt(s.rec)  : null},
            ${statType === 'Receiving' ? toInt(s.yds)  : null},
            ${statType === 'Receiving' ? toInt(s.tds)  : null}
          )
        `
        inserted++
      } catch (err) {
        failed++
        console.error(`  ERROR game ${row.game_id} / ${playerName} / ${statType}: ${err.message}`)
      }
    }

    console.log(`  game ${row.game_id}: inserted ${toInsert.length} rows`)
  }

  console.log(`\n── Summary ─────────────────────`)
  console.log(`  Inserted : ${inserted}`)
  console.log(`  Skipped  : ${skipped} games (no eligible stats)`)
  console.log(`  Errors   : ${failed}`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
