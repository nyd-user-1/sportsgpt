/**
 * src/lib/chart-data/registry.ts
 *
 * Canonical mapping: chart slug → { metric, fetchFn }.
 *
 * Single source of truth for which lib function powers each chart.
 * The three chart consumers (API route, chart detail page, panel page)
 * can use this registry for slug validation and documentation.
 *
 * `fetchFn` signature uses `seasons?: number[]` so both seasonal functions
 * (most charts) and no-arg functions (win-percentage, streaks) fit the same
 * interface. No-arg functions ignore the argument; seasonal functions require it.
 *
 * Charts not in CHART_CONFIGS (win-pct-trend, win-pct-by-division,
 * schools-by-enrollment, team-scoring-avg) have inline SQL in the API route
 * and are intentionally omitted here.
 */

import type { ChartMetric } from '@/lib/chart-configs'

import {
  fetchPassingYardsLeaders,
  fetchPassingTdsLeaders,
  fetchSingleGamePassing,
  fetchPassingYardsByTeam,
} from '@/lib/chart-data/passing'

import {
  fetchRushingYardsLeaders,
  fetchRushingTdsLeaders,
  fetchSingleGameRushing,
  fetchRushingYardsByTeam,
} from '@/lib/chart-data/rushing'

import {
  fetchReceivingYardsLeaders,
  fetchReceivingTdsLeaders,
} from '@/lib/chart-data/receiving'

import {
  fetchTotalTdsLeaders,
  fetchTotalYardsLeaders,
  fetchTotalPointsLeaders,
} from '@/lib/chart-data/composite'

import {
  fetchPFPA,
  fetchPointDifferential,
  fetchScoringOffense,
  fetchScoringDefense,
  fetchTopScoringGames,
  fetchBiggestBlowouts,
  fetchPointsByQuarter,
} from '@/lib/chart-data/scoring'

import {
  fetchSeasonRecords,
  fetchHomeAwayRecord,
  fetchWinLossDivision,
  fetchWinPercentage,
  fetchWinningStreaks,
  fetchLosingStreaks,
} from '@/lib/chart-data/wins'

import { fetchStrengthOfSchedule } from '@/lib/chart-data/schedule'
import { fetchTurnovers }           from '@/lib/chart-data/defense'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FetchFn = (seasons: number[]) => Promise<any[]>

export interface DataSourceDef {
  /** Metric family — mirrors ChartConfig.metric and src/lib/chart-data/{metric}.ts */
  metric:  ChartMetric
  /** Canonical fetch function for this chart slug. */
  fetchFn: FetchFn
}

/**
 * Registry mapping each chart slug to its canonical data source.
 *
 * Used for:
 *   - Slug validation (is this slug data-backed?)
 *   - Tooling / chat context (which metric family does this slug belong to?)
 *   - Future generic chart loader (resolve fetchFn without a switch statement)
 */
export const CHART_DATA_SOURCES: Record<string, DataSourceDef> = {

  // ── Wins & Records ────────────────────────────────────────────────────────
  'home-away-record':         { metric: 'wins', fetchFn: fetchHomeAwayRecord },
  'win-loss-division':        { metric: 'wins', fetchFn: fetchWinLossDivision },
  'season-records':           { metric: 'wins', fetchFn: fetchSeasonRecords },
  // wins-by-school reuses fetchSeasonRecords; consumer passes [2020, ...AVAILABLE_SEASONS]
  'wins-by-school':           { metric: 'wins', fetchFn: fetchSeasonRecords },
  // No-arg functions — seasons argument is accepted but ignored
  'win-percentage':           { metric: 'wins', fetchFn: (_s: number[]) => fetchWinPercentage() },
  'winning-streaks':          { metric: 'wins', fetchFn: (_s: number[]) => fetchWinningStreaks() },
  'losing-streaks':           { metric: 'wins', fetchFn: (_s: number[]) => fetchLosingStreaks() },

  // ── Scoring ───────────────────────────────────────────────────────────────
  'pf-pa':                    { metric: 'scoring', fetchFn: fetchPFPA },
  'point-differential-leaders': { metric: 'scoring', fetchFn: fetchPointDifferential },
  'scoring-offense':          { metric: 'scoring', fetchFn: fetchScoringOffense },
  'scoring-defense':          { metric: 'scoring', fetchFn: fetchScoringDefense },
  'top-scoring-games':        { metric: 'scoring', fetchFn: fetchTopScoringGames },
  'biggest-blowouts':         { metric: 'scoring', fetchFn: fetchBiggestBlowouts },
  'points-by-quarter':        { metric: 'scoring', fetchFn: fetchPointsByQuarter },

  // ── Passing ───────────────────────────────────────────────────────────────
  'passing-yards-leaders':    { metric: 'passing', fetchFn: fetchPassingYardsLeaders },
  'passing-tds-leaders':      { metric: 'passing', fetchFn: fetchPassingTdsLeaders },
  'single-game-passing':      { metric: 'passing', fetchFn: fetchSingleGamePassing },
  'passing-yards-team':       { metric: 'passing', fetchFn: fetchPassingYardsByTeam },

  // ── Rushing ───────────────────────────────────────────────────────────────
  'rushing-yards-leaders':    { metric: 'rushing', fetchFn: fetchRushingYardsLeaders },
  'rushing-tds-leaders':      { metric: 'rushing', fetchFn: fetchRushingTdsLeaders },
  'single-game-rushing':      { metric: 'rushing', fetchFn: fetchSingleGameRushing },
  'rushing-yards-team':       { metric: 'rushing', fetchFn: fetchRushingYardsByTeam },

  // ── Receiving ─────────────────────────────────────────────────────────────
  'receiving-yards-leaders':  { metric: 'receiving', fetchFn: fetchReceivingYardsLeaders },
  'receiving-tds-leaders':    { metric: 'receiving', fetchFn: fetchReceivingTdsLeaders },

  // ── Composite (total offense) ─────────────────────────────────────────────
  'total-tds-leaders':        { metric: 'composite', fetchFn: fetchTotalTdsLeaders },
  'total-yards-leaders':      { metric: 'composite', fetchFn: fetchTotalYardsLeaders },
  'total-points-leaders':     { metric: 'composite', fetchFn: fetchTotalPointsLeaders },

  // ── Schedule ──────────────────────────────────────────────────────────────
  'strength-of-schedule':     { metric: 'schedule', fetchFn: fetchStrengthOfSchedule },

  // ── Defense ───────────────────────────────────────────────────────────────
  'turnovers':                { metric: 'defense', fetchFn: fetchTurnovers },
}

/**
 * Look up the data source for a chart slug.
 * Returns undefined for slugs not backed by a lib function
 * (e.g. API-only charts with inline SQL).
 */
export function getDataSource(slug: string): DataSourceDef | undefined {
  return CHART_DATA_SOURCES[slug]
}

/** True if the slug has a registered lib-backed data source. */
export function hasDataSource(slug: string): boolean {
  return slug in CHART_DATA_SOURCES
}
