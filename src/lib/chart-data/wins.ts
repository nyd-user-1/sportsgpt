/**
 * src/lib/chart-data/wins.ts
 *
 * Canonical SQL for all wins-metric charts.
 *
 * Charts covered:
 *   season-records    (metric: wins, entity: team)
 *   wins-by-school    (metric: wins, entity: team)  — dynasty view
 *   home-away-record  (metric: wins, entity: team)
 *   win-loss-division (metric: wins, entity: team)
 *   win-percentage    (metric: wins, entity: team)
 *   winning-streaks   (metric: wins, entity: team)
 *   losing-streaks    (metric: wins, entity: team)
 */

import { sql } from '@/lib/db'

export interface SeasonRecordRow {
  name:        string
  team_slug:   string
  school_slug: string
  wins:        number
  losses:      number
  ties:        number
  season:      number
}

export interface HomeAwayRow {
  name:       string
  school_slug: string
  home_wins:  number
  away_wins:  number
  season:     string
}

export interface WinLossDivisionRow {
  name:        string
  school_slug: string
  division:    string
  wins:        number
  losses:      number
  season:      string
}

export interface WinPercentageRow {
  name:        string
  school_slug: string
  value:       number
}

export interface StreakRow {
  name:        string
  school_slug: string
  value:       number
}

/**
 * Season-by-season W/L records for all teams.
 * Used for season-records and wins-by-school (dynasty) charts.
 */
export async function fetchSeasonRecords(seasons: number[]): Promise<SeasonRecordRow[]> {
  const rows = await sql`
    SELECT t.name, t.slug AS team_slug, t.school_slug,
      s.overall_wins AS wins, s.overall_losses AS losses,
      COALESCE(s.overall_ties, 0) AS ties, s.season
    FROM teams t
    JOIN team_season_stats s ON s.team_slug = t.slug
    WHERE s.season = ANY(${seasons})
    ORDER BY s.season, s.overall_wins DESC`
  return rows as SeasonRecordRow[]
}

/**
 * Home wins and away wins per team-season.
 */
export async function fetchHomeAwayRecord(seasons: number[]): Promise<HomeAwayRow[]> {
  const rows = await sql`
    WITH records AS (
      SELECT t.name, t.school_slug,
        COUNT(*) FILTER (WHERE g.home_team_slug = t.slug AND g.home_score > g.away_score)::int AS home_wins,
        COUNT(*) FILTER (WHERE g.away_team_slug = t.slug AND g.away_score > g.home_score)::int AS away_wins,
        g.season::text AS season
      FROM teams t
      JOIN games g ON (g.home_team_slug = t.slug OR g.away_team_slug = t.slug)
      WHERE g.home_score IS NOT NULL AND g.season = ANY(${seasons}) AND t.level = 'Varsity'
      GROUP BY t.name, t.school_slug, g.season
    )
    SELECT * FROM records WHERE home_wins + away_wins > 0
    ORDER BY season, home_wins + away_wins DESC`
  return rows as HomeAwayRow[]
}

/**
 * Win/loss record broken out by division per team-season.
 */
export async function fetchWinLossDivision(seasons: number[]): Promise<WinLossDivisionRow[]> {
  const rows = await sql`
    SELECT t.name, t.school_slug, t.division,
      ts.overall_wins::int AS wins, ts.overall_losses::int AS losses,
      ts.season::text AS season
    FROM team_season_stats ts JOIN teams t ON t.slug = ts.team_slug
    WHERE ts.season = ANY(${seasons}) AND t.level = 'Varsity'
    ORDER BY ts.season, t.division, ts.overall_wins DESC`
  return rows as WinLossDivisionRow[]
}

/**
 * All-time win percentage per team (minimum 10 games played).
 */
export async function fetchWinPercentage(): Promise<WinPercentageRow[]> {
  const rows = await sql`
    SELECT t.name, t.school_slug,
      ROUND(
        SUM(s.overall_wins)::numeric /
        NULLIF(SUM(s.overall_wins + s.overall_losses), 0) * 100,
        1
      )::float AS value
    FROM team_season_stats s
    JOIN teams t ON t.slug = s.team_slug
    WHERE t.level = 'Varsity'
    GROUP BY t.name, t.school_slug
    HAVING SUM(s.overall_wins + s.overall_losses) >= 10
    ORDER BY value DESC`
  return rows as WinPercentageRow[]
}

/** Streak helper — shared logic for winning-streaks and losing-streaks */
const streakSQL = (win: 0 | 1) => sql`
  WITH team_games AS (
    SELECT home_team_slug AS team_slug, game_date,
      CASE WHEN home_score > away_score THEN 1 ELSE 0 END AS win
    FROM games WHERE home_score IS NOT NULL AND away_score IS NOT NULL
    UNION ALL
    SELECT away_team_slug, game_date,
      CASE WHEN away_score > home_score THEN 1 ELSE 0 END AS win
    FROM games WHERE home_score IS NOT NULL AND away_score IS NOT NULL
  ),
  numbered AS (
    SELECT team_slug, game_date, win,
      ROW_NUMBER() OVER (PARTITION BY team_slug ORDER BY game_date) -
      ROW_NUMBER() OVER (PARTITION BY team_slug, win ORDER BY game_date) AS grp
    FROM team_games
  ),
  streaks AS (
    SELECT team_slug, win, COUNT(*) AS streak_len
    FROM numbered GROUP BY team_slug, win, grp
  ),
  best AS (
    SELECT team_slug, MAX(streak_len) AS value
    FROM streaks WHERE win = ${win} GROUP BY team_slug
  )
  SELECT t.name, t.school_slug, b.value::int AS value
  FROM best b JOIN teams t ON t.slug = b.team_slug
  WHERE t.level = 'Varsity'
  ORDER BY b.value DESC`

/**
 * Longest all-time winning streak per team.
 */
export async function fetchWinningStreaks(): Promise<StreakRow[]> {
  return (await streakSQL(1)) as StreakRow[]
}

/**
 * Longest all-time losing streak per team.
 */
export async function fetchLosingStreaks(): Promise<StreakRow[]> {
  return (await streakSQL(0)) as StreakRow[]
}
