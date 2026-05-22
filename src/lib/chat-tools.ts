import { sql as sqlTag } from '@/lib/db'

// neon's runtime supports sql(string, params[]) but TypeScript types only expose
// the tagged-template signature — cast it so we can build dynamic WHERE clauses.
const sql = sqlTag as unknown as (
  query: string,
  params?: unknown[]
) => Promise<Record<string, unknown>[]>

// ── Tool definitions (Anthropic tool_use format) ──────────────────────────────

export const TOOLS = [
  {
    name: 'search_teams',
    description: 'Find Section XI teams by name. Returns school_slug values needed for all other tools. Always call this first when a team name is mentioned.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Team name to find, e.g. "William Floyd", "Floyd", "Ward Melville", "Hills East"' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_team_records',
    description: 'Get season-by-season win/loss records for a team. Season integers map to school years: 2025=2025-26 (current), 2024=2024-25, 2023=2023-24, 2022=2022-23, 2021=2021-22.',
    input_schema: {
      type: 'object' as const,
      properties: {
        school_slug: { type: 'string', description: 'From search_teams, e.g. "floyd", "ward-melville"' },
        season:      { type: 'number', description: 'Specific season integer 2021–2025. Omit for all seasons.' },
      },
      required: ['school_slug'],
    },
  },
  {
    name: 'get_top_players',
    description: 'Get top players ranked by stat category. Use for leaderboards, team stars, or player comparisons. Always specify stat_type.',
    input_schema: {
      type: 'object' as const,
      properties: {
        stat_type:   { type: 'string', enum: ['Passing', 'Rushing', 'Receiving'], description: 'Stat category' },
        school_slug: { type: 'string', description: 'Optional: limit to one team' },
        season:      { type: 'number', description: 'Optional: limit to one season (2021–2025)' },
        limit:       { type: 'number', description: 'Results to return, default 10, max 20' },
      },
      required: ['stat_type'],
    },
  },
  {
    name: 'get_team_games',
    description: 'Get week-by-week game results for a team in a specific season. Shows opponent, score, win/loss for every game.',
    input_schema: {
      type: 'object' as const,
      properties: {
        school_slug: { type: 'string', description: 'Team identifier, e.g. "floyd"' },
        season:      { type: 'number', description: 'Season integer 2021–2025' },
      },
      required: ['school_slug', 'season'],
    },
  },
  {
    name: 'get_standings',
    description: 'Get standings sorted by win percentage for a season, optionally filtered by division.',
    input_schema: {
      type: 'object' as const,
      properties: {
        season:   { type: 'number', description: 'Season integer 2021–2025. Use 2025 for the current 2025-26 season.' },
        division: { type: 'string', enum: ['I', 'II', 'III', 'IV'], description: 'Optional division filter' },
      },
      required: ['season'],
    },
  },
  {
    name: 'get_player_career',
    description: 'Get season-by-season stats for a specific player by name. Use to look up individual player stats, career totals, or multi-season trajectories.',
    input_schema: {
      type: 'object' as const,
      properties: {
        player_name: { type: 'string', description: 'Player name to find, e.g. "Colin Clark", "Patrick Coan"' },
        school_slug: { type: 'string', description: 'Optional: narrow search to a specific school' },
      },
      required: ['player_name'],
    },
  },
]

// ── Tool execution (DB queries) ───────────────────────────────────────────────

export async function executeToolCall(
  name: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  try {
    switch (name) {

      case 'search_teams': {
        const q = `%${String(input.query).toLowerCase().trim()}%`
        const rows = await sql(
          `SELECT slug, school_slug, name, division
           FROM teams
           WHERE level = 'Varsity'
             AND (LOWER(name) LIKE $1
                  OR LOWER(school_slug) LIKE $1
                  OR LOWER(REPLACE(school_slug, '-', ' ')) LIKE $1)
           ORDER BY name
           LIMIT 5`,
          [q],
        )
        return rows.length > 0
          ? rows
          : { message: `No teams found matching "${input.query}". Try the school name or a shorter version of it.` }
      }

      case 'get_team_records': {
        const teamSlug = `${input.school_slug}-varsity-football`
        const params: unknown[] = [teamSlug]
        let query = `
          SELECT tss.season, tss.overall_wins AS wins, tss.overall_losses AS losses,
                 tss.overall_ties AS ties,
                 tss.conference_wins AS conf_wins, tss.conference_losses AS conf_losses,
                 t.name, t.division,
                 CASE WHEN tss.overall_wins + tss.overall_losses = 0 THEN NULL
                      ELSE ROUND(tss.overall_wins::numeric / (tss.overall_wins + tss.overall_losses) * 100, 1)
                 END AS win_pct
          FROM team_season_stats tss
          JOIN teams t ON t.slug = tss.team_slug
          WHERE tss.team_slug = $1`
        if (input.season) {
          query += ` AND tss.season = $2`
          params.push(input.season)
        }
        query += ` ORDER BY tss.season DESC`
        const rows = await sql(query, params)
        return rows.length > 0
          ? rows
          : { message: `No records found for ${input.school_slug}. Verify the school_slug from search_teams.` }
      }

      case 'get_top_players': {
        const statType = String(input.stat_type)
        const limit    = Math.min(Number(input.limit ?? 10), 20)

        let orderCol: string
        let statCols: string
        if (statType === 'Passing') {
          orderCol = 'pass_yards'
          statCols = 'pass_yards, pass_tds, interceptions, completions, attempts, games_played'
        } else if (statType === 'Rushing') {
          orderCol = 'rush_yards'
          statCols = 'rush_yards, rush_tds, games_played'
        } else {
          orderCol = 'recv_yards'
          statCols = 'recv_yards, recv_tds, receptions, games_played'
        }

        const conditions: string[] = [`stat_type = $1`, `${orderCol} IS NOT NULL`, `${orderCol} > 0`]
        const params: unknown[] = [statType]
        let idx = 2

        if (input.school_slug) {
          conditions.push(`school_slug = $${idx++}`)
          params.push(input.school_slug)
        }
        if (input.season) {
          conditions.push(`season = $${idx++}`)
          params.push(input.season)
        }
        params.push(limit)

        const rows = await sql(
          `SELECT player_name, player_slug, school_name, school_slug, season, ${statCols}
           FROM player_season_stats
           WHERE ${conditions.join(' AND ')}
           ORDER BY ${orderCol} DESC NULLS LAST
           LIMIT $${idx}`,
          params,
        )
        return rows.length > 0 ? rows : { message: `No ${statType} stats found for the given filters.` }
      }

      case 'get_team_games': {
        const teamSlug = `${input.school_slug}-varsity-football`
        const rows = await sql(
          `SELECT g.game_number AS week, g.game_date, g.season,
                  g.home_score, g.away_score,
                  g.home_team_slug, g.away_team_slug,
                  ht.name AS home_name, ht.school_slug AS home_school,
                  at2.name AS away_name, at2.school_slug AS away_school,
                  CASE WHEN g.home_team_slug = $1 THEN 'home' ELSE 'away' END AS side,
                  CASE WHEN g.home_team_slug = $1 THEN g.home_score ELSE g.away_score END AS team_score,
                  CASE WHEN g.home_team_slug = $1 THEN g.away_score ELSE g.home_score END AS opp_score,
                  CASE WHEN g.home_team_slug = $1 THEN ht.school_slug ELSE at2.school_slug END AS team_school,
                  CASE WHEN g.home_team_slug = $1 THEN at2.name ELSE ht.name END AS opponent_name,
                  CASE WHEN g.home_team_slug = $1 THEN at2.school_slug ELSE ht.school_slug END AS opp_school
           FROM games g
           JOIN teams ht  ON ht.slug  = g.home_team_slug
           JOIN teams at2 ON at2.slug = g.away_team_slug
           WHERE (g.home_team_slug = $1 OR g.away_team_slug = $1)
             AND g.season = $2
           ORDER BY g.game_number ASC NULLS LAST`,
          [teamSlug, input.season],
        )
        return rows.length > 0
          ? rows
          : { message: `No games found for ${input.school_slug} in season ${input.season}.` }
      }

      case 'get_standings': {
        const params: unknown[] = [input.season]
        let divFilter = ''
        if (input.division) {
          divFilter = `AND t.division = $2`
          params.push(input.division)
        }
        const rows = await sql(
          `SELECT t.name, t.school_slug, t.slug AS team_slug, t.division,
                  tss.overall_wins AS wins, tss.overall_losses AS losses,
                  tss.conference_wins AS conf_wins, tss.conference_losses AS conf_losses,
                  CASE WHEN tss.overall_wins + tss.overall_losses = 0 THEN 0
                       ELSE ROUND(tss.overall_wins::numeric / (tss.overall_wins + tss.overall_losses) * 100, 1)
                  END AS win_pct
           FROM team_season_stats tss
           JOIN teams t ON t.slug = tss.team_slug
           WHERE tss.season = $1 AND t.level = 'Varsity' ${divFilter}
           ORDER BY win_pct DESC NULLS LAST, tss.overall_wins DESC, t.name`,
          params,
        )
        return rows.length > 0 ? rows : { message: `No standings found for season ${input.season}.` }
      }

      case 'get_player_career': {
        const namePat = `%${String(input.player_name).toLowerCase().trim()}%`
        const params: unknown[] = [namePat]
        let schoolFilter = ''
        if (input.school_slug) {
          schoolFilter = `AND school_slug = $2`
          params.push(input.school_slug)
        }
        const rows = await sql(
          `SELECT player_name, player_slug, school_name, school_slug, stat_type, season,
                  pass_yards, pass_tds, interceptions, completions, attempts,
                  rush_yards, rush_tds,
                  recv_yards, recv_tds, receptions,
                  total_yards, total_tds, games_played
           FROM player_season_stats
           WHERE LOWER(player_name) LIKE $1 ${schoolFilter}
           ORDER BY season DESC, stat_type`,
          params,
        )
        return rows.length > 0
          ? rows
          : { message: `No player found matching "${input.player_name}". Try a shorter name or check spelling.` }
      }

      default:
        return { error: `Unknown tool: ${name}` }
    }
  } catch (err) {
    console.error(`[tool:${name}] error:`, (err as Error).message)
    return { error: `Tool execution failed: ${(err as Error).message}` }
  }
}
