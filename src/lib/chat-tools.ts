import { sql } from '@/lib/db'

// ── Tool definitions ──────────────────────────────────────────────────────────

export const TOOLS = [
  {
    name: 'search_teams',
    description: 'Find Section XI teams by name. Returns school_slug values needed for all other tools. Always call this first when a team name is mentioned.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Team name, e.g. "William Floyd", "Ward Melville", "Hills East"' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_team_records',
    description: 'Get season-by-season win/loss records for a team. Season integers: 2025=2025-26 (current), 2024=2024-25, 2023=2023-24, 2022=2022-23, 2021=2021-22.',
    input_schema: {
      type: 'object' as const,
      properties: {
        school_slug: { type: 'string', description: 'From search_teams, e.g. "ward-melville"' },
        season:      { type: 'number', description: 'Specific season 2021-2025. Omit for all seasons.' },
      },
      required: ['school_slug'],
    },
  },
  {
    name: 'get_top_players',
    description: 'Get top players ranked by stat. Use for team stars, leaderboards, or player comparisons.',
    input_schema: {
      type: 'object' as const,
      properties: {
        stat_type:   { type: 'string', enum: ['Passing', 'Rushing', 'Receiving'], description: 'Stat category' },
        school_slug: { type: 'string', description: 'Optional: limit to one team' },
        season:      { type: 'number', description: 'Optional: limit to one season (2021-2025)' },
        limit:       { type: 'number', description: 'Results to return, default 10, max 20' },
      },
      required: ['stat_type'],
    },
  },
  {
    name: 'get_team_games',
    description: 'Get week-by-week game results for a team in a specific season.',
    input_schema: {
      type: 'object' as const,
      properties: {
        school_slug: { type: 'string', description: 'Team identifier, e.g. "ward-melville"' },
        season:      { type: 'number', description: 'Season integer 2021-2025' },
      },
      required: ['school_slug', 'season'],
    },
  },
  {
    name: 'get_standings',
    description: 'Get standings sorted by win percentage for a season.',
    input_schema: {
      type: 'object' as const,
      properties: {
        season:   { type: 'number', description: 'Season 2021-2025. Use 2025 for current 2025-26 season.' },
        division: { type: 'string', enum: ['I', 'II', 'III', 'IV'], description: 'Optional division filter' },
      },
      required: ['season'],
    },
  },
  {
    name: 'get_player_career',
    description: 'Get season-by-season stats for a specific player by name.',
    input_schema: {
      type: 'object' as const,
      properties: {
        player_name: { type: 'string', description: 'Player name, e.g. "Colin Clark"' },
        school_slug: { type: 'string', description: 'Optional: narrow to a specific school' },
      },
      required: ['player_name'],
    },
  },
]

// ── Tool execution (tagged template literals only — neon requires this) ────────

export async function executeToolCall(
  name: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  try {
    switch (name) {

      case 'search_teams': {
        const q = `%${String(input.query).toLowerCase().trim()}%`
        const rows = await sql`
          SELECT slug, school_slug, name, division
          FROM teams
          WHERE level = 'Varsity'
            AND (LOWER(name)        LIKE ${q}
              OR LOWER(school_slug) LIKE ${q}
              OR LOWER(REPLACE(school_slug, '-', ' ')) LIKE ${q})
          ORDER BY name LIMIT 5`
        return rows.length > 0 ? rows
          : { message: `No teams found matching "${input.query}". Try a shorter or different spelling.` }
      }

      case 'get_team_records': {
        const teamSlug = `${input.school_slug}-varsity-football`
        const season = (input.season as number | null) ?? null
        const rows = await sql`
          SELECT tss.season,
                 tss.overall_wins   AS wins,
                 tss.overall_losses AS losses,
                 tss.overall_ties   AS ties,
                 tss.conference_wins AS conf_wins,
                 tss.conference_losses AS conf_losses,
                 t.name, t.division,
                 CASE WHEN tss.overall_wins + tss.overall_losses = 0 THEN NULL
                      ELSE ROUND(tss.overall_wins::numeric /
                           (tss.overall_wins + tss.overall_losses) * 100, 1)
                 END AS win_pct
          FROM team_season_stats tss
          JOIN teams t ON t.slug = tss.team_slug
          WHERE tss.team_slug = ${teamSlug}
            AND (${season}::int IS NULL OR tss.season = ${season})
          ORDER BY tss.season DESC`
        return rows.length > 0 ? rows
          : { message: `No records found for ${input.school_slug}. Try search_teams first.` }
      }

      case 'get_top_players': {
        const statType   = String(input.stat_type)
        const schoolSlug = (input.school_slug as string | null) ?? null
        const season     = (input.season as number | null) ?? null
        const limit      = Math.min(Number(input.limit ?? 10), 20)

        if (statType === 'Passing') {
          return await sql`
            SELECT player_name, player_slug, school_name, school_slug, season,
                   pass_yards, pass_tds, interceptions, completions, attempts, games_played
            FROM player_season_stats
            WHERE stat_type = 'Passing'
              AND pass_yards IS NOT NULL AND pass_yards > 0
              AND (${schoolSlug}::text IS NULL OR school_slug = ${schoolSlug})
              AND (${season}::int IS NULL OR season = ${season})
            ORDER BY pass_yards DESC NULLS LAST
            LIMIT ${limit}`
        }
        if (statType === 'Rushing') {
          return await sql`
            SELECT player_name, player_slug, school_name, school_slug, season,
                   rush_yards, rush_tds, games_played
            FROM player_season_stats
            WHERE stat_type = 'Rushing'
              AND rush_yards IS NOT NULL AND rush_yards > 0
              AND (${schoolSlug}::text IS NULL OR school_slug = ${schoolSlug})
              AND (${season}::int IS NULL OR season = ${season})
            ORDER BY rush_yards DESC NULLS LAST
            LIMIT ${limit}`
        }
        // Receiving
        return await sql`
          SELECT player_name, player_slug, school_name, school_slug, season,
                 recv_yards, recv_tds, receptions, games_played
          FROM player_season_stats
          WHERE stat_type = 'Receiving'
            AND recv_yards IS NOT NULL AND recv_yards > 0
            AND (${schoolSlug}::text IS NULL OR school_slug = ${schoolSlug})
            AND (${season}::int IS NULL OR season = ${season})
          ORDER BY recv_yards DESC NULLS LAST
          LIMIT ${limit}`
      }

      case 'get_team_games': {
        const teamSlug = `${input.school_slug}-varsity-football`
        const season   = input.season as number
        const rows = await sql`
          SELECT g.game_number AS week,
                 g.game_date,
                 g.home_score, g.away_score,
                 CASE WHEN g.home_team_slug = ${teamSlug} THEN 'home' ELSE 'away' END AS side,
                 CASE WHEN g.home_team_slug = ${teamSlug} THEN g.home_score ELSE g.away_score END AS team_score,
                 CASE WHEN g.home_team_slug = ${teamSlug} THEN g.away_score ELSE g.home_score END AS opp_score,
                 CASE WHEN g.home_team_slug = ${teamSlug} THEN at2.name ELSE ht.name END AS opponent_name,
                 CASE WHEN g.home_team_slug = ${teamSlug} THEN at2.school_slug ELSE ht.school_slug END AS opp_school
          FROM games g
          JOIN teams ht  ON ht.slug  = g.home_team_slug
          JOIN teams at2 ON at2.slug = g.away_team_slug
          WHERE (g.home_team_slug = ${teamSlug} OR g.away_team_slug = ${teamSlug})
            AND g.season = ${season}
          ORDER BY g.game_number ASC NULLS LAST`
        return rows.length > 0 ? rows
          : { message: `No games found for ${input.school_slug} in season ${season}.` }
      }

      case 'get_standings': {
        const season   = input.season as number
        const division = (input.division as string | null) ?? null
        const rows = await sql`
          SELECT t.name, t.school_slug, t.slug AS team_slug, t.division,
                 tss.overall_wins AS wins, tss.overall_losses AS losses,
                 tss.conference_wins AS conf_wins, tss.conference_losses AS conf_losses,
                 CASE WHEN tss.overall_wins + tss.overall_losses = 0 THEN 0
                      ELSE ROUND(tss.overall_wins::numeric /
                           (tss.overall_wins + tss.overall_losses) * 100, 1)
                 END AS win_pct
          FROM team_season_stats tss
          JOIN teams t ON t.slug = tss.team_slug
          WHERE tss.season = ${season}
            AND t.level = 'Varsity'
            AND (${division}::text IS NULL OR t.division = ${division})
          ORDER BY win_pct DESC NULLS LAST, tss.overall_wins DESC, t.name`
        return rows.length > 0 ? rows
          : { message: `No standings found for season ${season}.` }
      }

      case 'get_player_career': {
        const namePat    = `%${String(input.player_name).toLowerCase().trim()}%`
        const schoolSlug = (input.school_slug as string | null) ?? null
        const rows = await sql`
          SELECT player_name, player_slug, school_name, school_slug, stat_type, season,
                 pass_yards, pass_tds, interceptions, completions, attempts,
                 rush_yards, rush_tds,
                 recv_yards, recv_tds, receptions,
                 total_yards, total_tds, games_played
          FROM player_season_stats
          WHERE LOWER(player_name) LIKE ${namePat}
            AND (${schoolSlug}::text IS NULL OR school_slug = ${schoolSlug})
          ORDER BY season DESC, stat_type`
        return rows.length > 0 ? rows
          : { message: `No player found matching "${input.player_name}". Try a shorter name.` }
      }

      default:
        return { error: `Unknown tool: ${name}` }
    }
  } catch (err) {
    console.error(`[tool:${name}]`, (err as Error).message)
    return { error: `Query failed: ${(err as Error).message}` }
  }
}
