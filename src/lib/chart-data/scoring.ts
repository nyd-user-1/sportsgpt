/**
 * src/lib/chart-data/scoring.ts
 *
 * Canonical SQL for all scoring-metric charts.
 *
 * Charts covered:
 *   pf-pa                     (metric: scoring, entity: team)
 *   point-differential-leaders (metric: scoring, entity: team)
 *   scoring-offense            (metric: scoring, entity: team)
 *   scoring-defense            (metric: scoring, entity: team)
 *   top-scoring-games          (metric: scoring, entity: game)
 *   biggest-blowouts           (metric: scoring, entity: game)
 *   points-by-quarter          (metric: scoring, entity: team)
 */

import { sql } from '@/lib/db'

export interface PFPARow {
  name:           string
  school_slug:    string
  season:         string
  pf:             number
  pa:             number
  wins:           number
}

export interface TeamScoringRow {
  name:        string
  school_slug: string
  season:      string
  value:       number
}

export interface TeamDifferentialRow {
  name:           string
  school_slug:    string
  season:         number
  overall_wins:   number | null
  overall_losses: number | null
  value:          number
}

export interface ScoringGameRow {
  id:           number
  home:         string
  away:         string
  home_school:  string
  away_school:  string
  home_score:   number
  away_score:   number
  total:        number
  season:       string
}

export interface BlowoutRow {
  id:            number
  winner:        string
  loser:         string
  winner_school: string
  loser_school:  string
  winner_score:  number
  loser_score:   number
  margin:        number
  season:        string
}

export interface PointsByQuarterRow {
  name:        string
  school_slug: string
  season:      string
  value:       number
}

/**
 * Points for / points against per team-season.
 * Used for the PF-PA scatter chart.
 */
export async function fetchPFPA(seasons: number[]): Promise<PFPARow[]> {
  const rows = await sql`
    WITH scored AS (
      SELECT home_team_slug AS ts, home_score AS pf, away_score AS pa, season
      FROM games WHERE home_score IS NOT NULL AND season = ANY(${seasons})
      UNION ALL
      SELECT away_team_slug, away_score, home_score, season
      FROM games WHERE home_score IS NOT NULL AND season = ANY(${seasons})
    )
    SELECT t.name, t.school_slug, s.season::text AS season,
      SUM(pf)::int AS pf, SUM(pa)::int AS pa, ts2.overall_wins::int AS wins
    FROM scored s JOIN teams t ON t.slug = s.ts
    JOIN team_season_stats ts2 ON ts2.team_slug = t.slug AND ts2.season = s.season
    WHERE t.level = 'Varsity'
    GROUP BY t.name, t.school_slug, s.season, ts2.overall_wins
    ORDER BY s.season, pf DESC`
  return rows as PFPARow[]
}

/**
 * Net point differential per team-season (PF − PA summed across all games).
 */
export async function fetchPointDifferential(seasons: number[]): Promise<TeamDifferentialRow[]> {
  const rows = await sql`
    SELECT
      t.name,
      t.school_slug,
      s.season,
      s.overall_wins,
      s.overall_losses,
      (
        SUM(CASE WHEN g.home_team_slug = t.slug THEN g.home_score ELSE g.away_score END)
        - SUM(CASE WHEN g.home_team_slug = t.slug THEN g.away_score ELSE g.home_score END)
      )::int AS value
    FROM teams t
    JOIN team_season_stats s ON s.team_slug = t.slug
    JOIN games g ON (g.home_team_slug = t.slug OR g.away_team_slug = t.slug)
      AND g.season = s.season
      AND g.home_score IS NOT NULL
    WHERE s.season = ANY(${seasons})
    GROUP BY t.name, t.school_slug, s.season, s.overall_wins, s.overall_losses
    ORDER BY s.season, value DESC`
  return rows as TeamDifferentialRow[]
}

/**
 * Average points scored per game per team-season.
 */
export async function fetchScoringOffense(seasons: number[]): Promise<TeamScoringRow[]> {
  const rows = await sql`
    WITH tg AS (
      SELECT home_team_slug AS team_slug, home_score AS score, season
      FROM games WHERE home_score IS NOT NULL AND season = ANY(${seasons})
      UNION ALL
      SELECT away_team_slug, away_score, season
      FROM games WHERE away_score IS NOT NULL AND season = ANY(${seasons})
    )
    SELECT t.name, t.school_slug, ROUND(AVG(tg.score)::numeric, 1) AS value, tg.season::text AS season
    FROM tg JOIN teams t ON t.slug = tg.team_slug
    WHERE t.level = 'Varsity'
    GROUP BY t.name, t.school_slug, tg.season
    ORDER BY tg.season, value DESC`
  return rows as TeamScoringRow[]
}

/**
 * Average points allowed per game per team-season.
 * Note: ordered ASC so lowest is best.
 */
export async function fetchScoringDefense(seasons: number[]): Promise<TeamScoringRow[]> {
  const rows = await sql`
    WITH tg AS (
      SELECT home_team_slug AS team_slug, away_score AS allowed, season
      FROM games WHERE home_score IS NOT NULL AND season = ANY(${seasons})
      UNION ALL
      SELECT away_team_slug, home_score AS allowed, season
      FROM games WHERE home_score IS NOT NULL AND season = ANY(${seasons})
    )
    SELECT t.name, t.school_slug, ROUND(AVG(tg.allowed)::numeric, 1) AS value, tg.season::text AS season
    FROM tg JOIN teams t ON t.slug = tg.team_slug
    WHERE t.level = 'Varsity'
    GROUP BY t.name, t.school_slug, tg.season
    ORDER BY tg.season, value ASC`
  return rows as TeamScoringRow[]
}

/**
 * Highest combined-score games (requires box score data).
 */
export async function fetchTopScoringGames(seasons: number[]): Promise<ScoringGameRow[]> {
  const rows = await sql`
    SELECT g.id, ht.name AS home, at2.name AS away,
      ht.school_slug AS home_school, at2.school_slug AS away_school,
      g.home_score, g.away_score, (g.home_score + g.away_score) AS total,
      g.season::text AS season
    FROM games g
    JOIN game_box_scores bs ON bs.game_id = g.id
    JOIN teams ht ON ht.slug = g.home_team_slug
    JOIN teams at2 ON at2.slug = g.away_team_slug
    WHERE g.home_score IS NOT NULL AND g.season = ANY(${seasons})
    ORDER BY g.season, total DESC`
  return rows as ScoringGameRow[]
}

/**
 * Largest winning margins (requires box score data).
 */
export async function fetchBiggestBlowouts(seasons: number[]): Promise<BlowoutRow[]> {
  const rows = await sql`
    SELECT g.id,
      ABS(g.home_score - g.away_score) AS margin,
      CASE WHEN g.home_score > g.away_score THEN ht.name ELSE at2.name END AS winner,
      CASE WHEN g.home_score > g.away_score THEN at2.name ELSE ht.name END AS loser,
      CASE WHEN g.home_score > g.away_score THEN ht.school_slug ELSE at2.school_slug END AS winner_school,
      CASE WHEN g.home_score > g.away_score THEN at2.school_slug ELSE ht.school_slug END AS loser_school,
      CASE WHEN g.home_score > g.away_score THEN g.home_score ELSE g.away_score END AS winner_score,
      CASE WHEN g.home_score > g.away_score THEN g.away_score ELSE g.home_score END AS loser_score,
      g.season::text AS season
    FROM games g
    JOIN game_box_scores bs ON bs.game_id = g.id
    JOIN teams ht ON ht.slug = g.home_team_slug
    JOIN teams at2 ON at2.slug = g.away_team_slug
    WHERE g.home_score IS NOT NULL AND g.season = ANY(${seasons})
    ORDER BY g.season, margin DESC`
  return rows as BlowoutRow[]
}

/**
 * Q4 points total per team-season (requires box score quarter_scores JSONB).
 */
export async function fetchPointsByQuarter(seasons: number[]): Promise<PointsByQuarterRow[]> {
  const rows = await sql`
    SELECT t.name, t.school_slug, g.season::text AS season,
      SUM((elem->>'q4')::int) AS value
    FROM game_box_scores b
    CROSS JOIN LATERAL jsonb_array_elements(b.quarter_scores) AS elem
    JOIN games g ON g.id = b.game_id
    JOIN teams t ON t.slug = (elem->>'team_slug')
    WHERE (elem->>'q4') IS NOT NULL
      AND t.level = 'Varsity'
      AND g.season = ANY(${seasons})
    GROUP BY t.name, t.school_slug, g.season
    ORDER BY g.season, value DESC`
  return rows as PointsByQuarterRow[]
}
