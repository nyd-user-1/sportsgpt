import { CURRENT_SEASON } from '@/lib/season'

export type ChartType = 'bar' | 'area' | 'line' | 'scatter' | 'multi-bar' | 'line-multi' | 'pie-donut' | 'scatter-pfpa' | 'win-loss-h'
export type Period = 'weekly' | 'monthly' | 'annual'

// ── Chart taxonomy ────────────────────────────────────────────────────────────
//
// Every chart is a cell in a 4-D tensor:  { metric } × { entity } × { time } × { view }
// The 29 chart slugs we ship are 29 specific cells. Tagging each config with
// `metric` and `entity` lets the picker group related charts, lets the chat
// panel rank suggestions by relevance, and sets up the future "master chart
// with lenses" UI (e.g. one Touchdowns master with passing/rushing/receiving
// lenses + a carousel of derived views).
//
// `metric` corresponds 1:1 with src/lib/chart-data/{metric}.ts — the planned
// consolidation of 29 per-slug SQL files into ~8 per-metric modules.
// `entity` is the primary subject of each row in the chart.

export type ChartMetric =
  | 'passing'    // pass_yards, pass_tds
  | 'rushing'    // rush_yards, rush_tds
  | 'receiving'  // recv_yards, recv_tds
  | 'composite'  // total_yards, total_tds, total_points (derived from pass+rush+recv)
  | 'scoring'    // points scored/allowed, differentials, blowouts
  | 'wins'       // W-L records, streaks, win pct, division standings
  | 'schedule'   // strength of schedule
  | 'defense'    // turnovers, takeaways

export type ChartEntity =
  | 'player'     // one row per player
  | 'team'       // one row per team
  | 'game'       // one row per game

export interface SeriesDef {
  key: string
  color: string
  label: string
}

export interface FilterDef {
  key: string
  label: string
}

export interface ChartConfig {
  slug: string
  title: string
  description: string
  color: string
  chartType: ChartType
  kpiLabel: string
  nameLabel?: string
  valueLabel?: string
  /** Metric family — see ChartMetric. Maps to src/lib/chart-data/{metric}.ts */
  metric: ChartMetric
  /** Primary subject of each row in the chart. */
  entity: ChartEntity
  periodToggle?: boolean
  periodBase?: 'weekly' | 'annual'
  series?: SeriesDef[]
  filters?: FilterDef[]
  stacked?: boolean
  /** When true, lower values rank higher (e.g. fewest pts allowed = best). */
  ascending?: boolean
}

export const CHART_CONFIGS: ChartConfig[] = [
  // ── Wins & Records ───────────────────────────────────────────────────────────
  {
    slug: 'home-away-record',
    title: 'Home vs. Away Record',
    description: `Home wins vs. away wins per team · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'bar', kpiLabel: 'home wins',
    nameLabel: 'Team', valueLabel: 'Home Wins',
    metric: 'wins', entity: 'team',
  },
  {
    slug: 'win-loss-division',
    title: 'Win/Loss by Division',
    description: `Team wins and losses by division · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'win-loss-h', kpiLabel: 'teams tracked',
    nameLabel: 'Team', valueLabel: 'Record',
    metric: 'wins', entity: 'team',
  },
  {
    slug: 'season-records',
    title: 'Season Records',
    description: 'Section XI team records by season — wins and losses',
    color: '#033882', chartType: 'bar', kpiLabel: 'teams tracked',
    nameLabel: 'Team', valueLabel: 'Wins',
    metric: 'wins', entity: 'team',
  },
  {
    slug: 'wins-by-school',
    title: 'Current Dynasty',
    description: `Combined wins per school across the last 3 seasons (${CURRENT_SEASON - 2}–${CURRENT_SEASON})`,
    color: '#033882', chartType: 'bar', kpiLabel: 'most wins',
    nameLabel: 'Team', valueLabel: '3YR Wins',
    metric: 'wins', entity: 'team',
  },
  { slug: 'win-percentage',  title: 'Win %',           description: 'All-time win percentage by team (min. 10 games)', color: '#033882', chartType: 'bar', kpiLabel: 'win pct',     nameLabel: 'Team', valueLabel: 'Win %',        metric: 'wins', entity: 'team' },
  { slug: 'winning-streaks', title: 'Winning Streaks', description: 'Longest all-time winning streaks by team',       color: '#033882', chartType: 'bar', kpiLabel: 'game streak', nameLabel: 'Team', valueLabel: 'Win Streak',   metric: 'wins', entity: 'team' },
  { slug: 'losing-streaks',  title: 'Losing Streaks',  description: 'Longest all-time losing streaks by team',        color: '#ef4444', chartType: 'bar', kpiLabel: 'game streak', nameLabel: 'Team', valueLabel: 'Loss Streak',  metric: 'wins', entity: 'team' },

  // ── Scoring ──────────────────────────────────────────────────────────────────
  {
    slug: 'pf-pa',
    title: 'PF vs. PA',
    description: `Points for vs. points against by team · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'scatter-pfpa', kpiLabel: 'most points scored',
    nameLabel: 'Team', valueLabel: 'Points',
    metric: 'scoring', entity: 'team',
  },
  {
    slug: 'point-differential-leaders',
    title: 'Point Differential Leaders',
    description: 'Teams ranked by scoring margin (PF minus PA) · per season',
    color: '#033882', chartType: 'bar', kpiLabel: 'best differential',
    nameLabel: 'Team', valueLabel: 'Differential',
    metric: 'scoring', entity: 'team',
  },
  {
    slug: 'scoring-offense',
    title: 'Scoring Offense',
    description: 'Average points scored per game by team — season by season',
    color: '#033882', chartType: 'bar', kpiLabel: 'avg pts/game',
    nameLabel: 'Team', valueLabel: 'Pts/Game',
    metric: 'scoring', entity: 'team',
  },
  {
    slug: 'scoring-defense',
    title: 'Avg. Pts Allowed',
    description: 'Average points allowed per game by team — fewest is best',
    color: '#10b981', chartType: 'bar', kpiLabel: 'fewest pts allowed',
    nameLabel: 'Team', valueLabel: 'Avg. Pts Allowed',
    metric: 'scoring', entity: 'team',
    ascending: true,
  },
  {
    slug: 'top-scoring-games',
    title: 'Highest Scoring Games',
    description: 'Games with the most combined points scored — seasons with box scores',
    color: '#033882', chartType: 'bar', kpiLabel: 'pts combined',
    nameLabel: 'Game', valueLabel: 'Combined Pts',
    metric: 'scoring', entity: 'game',
  },
  {
    slug: 'biggest-blowouts',
    title: 'Biggest Blowouts',
    description: 'Largest margins of victory — seasons with box scores',
    color: '#033882', chartType: 'bar', kpiLabel: 'point margin',
    nameLabel: 'Game', valueLabel: 'Margin',
    metric: 'scoring', entity: 'game',
  },
  { slug: 'points-by-quarter', title: 'Points by Quarter', description: 'Team Q4 scoring leaders · per season', color: '#033882', chartType: 'bar', kpiLabel: 'Q4 pts', nameLabel: 'Team', valueLabel: 'Q4 Pts', metric: 'scoring', entity: 'team' },

  // ── Passing ──────────────────────────────────────────────────────────────────
  {
    slug: 'passing-yards-leaders',
    title: 'Passing Yards Leaders',
    description: `Top quarterbacks by passing yards · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'bar', kpiLabel: 'most pass yds',
    nameLabel: 'Player', valueLabel: 'Pass Yds',
    metric: 'passing', entity: 'player',
  },
  {
    slug: 'passing-tds-leaders',
    title: 'Passing TD Leaders',
    description: `Top quarterbacks by touchdown passes · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'bar', kpiLabel: 'most pass TDs',
    nameLabel: 'Player', valueLabel: 'Pass TDs',
    metric: 'passing', entity: 'player',
  },
  {
    slug: 'single-game-passing',
    title: 'Single-Game Passing',
    description: 'Top single-game passing performances — seasons with box scores',
    color: '#033882', chartType: 'bar', kpiLabel: 'pass yds in one game',
    nameLabel: 'Player', valueLabel: 'Pass Yds',
    metric: 'passing', entity: 'player',
  },
  { slug: 'passing-yards-team', title: 'Passing Yards by Team', description: 'Total team passing yards · per season', color: '#033882', chartType: 'bar', kpiLabel: 'pass yds', nameLabel: 'Team', valueLabel: 'Pass Yds', metric: 'passing', entity: 'team' },

  // ── Rushing ──────────────────────────────────────────────────────────────────
  {
    slug: 'rushing-yards-leaders',
    title: 'Rushing Yards Leaders',
    description: `Top ball carriers by rushing yards · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'bar', kpiLabel: 'most rush yds',
    nameLabel: 'Player', valueLabel: 'Rush Yds',
    metric: 'rushing', entity: 'player',
  },
  {
    slug: 'rushing-tds-leaders',
    title: 'Rushing TD Leaders',
    description: `Top ball carriers by rushing touchdowns · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'bar', kpiLabel: 'most rush TDs',
    nameLabel: 'Player', valueLabel: 'Rush TDs',
    metric: 'rushing', entity: 'player',
  },
  {
    slug: 'single-game-rushing',
    title: 'Single-Game Rushing',
    description: 'Top single-game rushing performances — seasons with box scores',
    color: '#033882', chartType: 'bar', kpiLabel: 'rush yds in one game',
    nameLabel: 'Player', valueLabel: 'Rush Yds',
    metric: 'rushing', entity: 'player',
  },
  { slug: 'rushing-yards-team', title: 'Rushing Yards by Team', description: 'Total team rushing yards · per season', color: '#033882', chartType: 'bar', kpiLabel: 'rush yds', nameLabel: 'Team', valueLabel: 'Rush Yds', metric: 'rushing', entity: 'team' },

  // ── Receiving ────────────────────────────────────────────────────────────────
  {
    slug: 'receiving-yards-leaders',
    title: 'Receiving Yards Leaders',
    description: `Top receivers by receiving yards · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'bar', kpiLabel: 'most recv yds',
    nameLabel: 'Player', valueLabel: 'Recv Yds',
    metric: 'receiving', entity: 'player',
  },
  {
    slug: 'receiving-tds-leaders',
    title: 'Receiving TD Leaders',
    description: `Top receivers by touchdown catches · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'bar', kpiLabel: 'most recv TDs',
    nameLabel: 'Player', valueLabel: 'Recv TDs',
    metric: 'receiving', entity: 'player',
  },

  // ── Composite (multi-stat) ───────────────────────────────────────────────────
  {
    slug: 'total-tds-leaders',
    title: 'Total TD Leaders',
    description: `Top scorers by combined rushing + receiving touchdowns · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)}`,
    color: '#033882', chartType: 'multi-bar', kpiLabel: 'most total TDs',
    nameLabel: 'Player', valueLabel: 'Total TDs',
    metric: 'composite', entity: 'player',
  },
  {
    slug: 'total-yards-leaders',
    title: 'Total Yards Leaders',
    description: `Top offensive players by combined pass + rush + receiving yards · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)}`,
    color: '#033882', chartType: 'multi-bar', kpiLabel: 'most total yds',
    stacked: true,
    nameLabel: 'Player', valueLabel: 'Total Yds',
    metric: 'composite', entity: 'player',
  },
  {
    slug: 'total-points-leaders',
    title: 'Total Points Leaders',
    description: `Top scorers by total points including TDs, FGs, and PATs · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)}`,
    color: '#033882', chartType: 'bar', kpiLabel: 'most points',
    nameLabel: 'Player', valueLabel: 'Points',
    metric: 'composite', entity: 'player',
  },

  // ── Schedule ─────────────────────────────────────────────────────────────────
  {
    slug: 'strength-of-schedule',
    title: 'Strength of Schedule',
    description: `Average opponent win rate by team · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'bar', kpiLabel: 'toughest schedule',
    nameLabel: 'Team', valueLabel: 'SoS',
    metric: 'schedule', entity: 'team',
  },

  // ── Defense ──────────────────────────────────────────────────────────────────
  { slug: 'turnovers', title: 'Turnovers', description: 'Defensive takeaways (INT + fumble recoveries) · per season', color: '#033882', chartType: 'bar', kpiLabel: 'takeaways', nameLabel: 'Team', valueLabel: 'Takeaways', metric: 'defense', entity: 'team' },

]

export const CHART_SLUGS_AZ: string[] = [...CHART_CONFIGS]
  .sort((a, b) => a.title.localeCompare(b.title))
  .map(c => c.slug)

export function getChartConfig(slug: string): ChartConfig | undefined {
  return CHART_CONFIGS.find((c) => c.slug === slug)
}

/** Charts grouped by metric family — for the picker grid and chat suggestions. */
export function chartsByMetric(): Record<ChartMetric, ChartConfig[]> {
  const out = {
    passing: [], rushing: [], receiving: [], composite: [],
    scoring: [], wins: [], schedule: [], defense: [],
  } as Record<ChartMetric, ChartConfig[]>
  for (const c of CHART_CONFIGS) out[c.metric].push(c)
  return out
}

/** All charts in the same metric family, excluding self. */
export function siblingChartsByMetric(slug: string): ChartConfig[] {
  const cfg = getChartConfig(slug)
  if (!cfg) return []
  return CHART_CONFIGS.filter(c => c.metric === cfg.metric && c.slug !== slug)
}

/** All charts whose primary entity matches (player / team / game). */
export function chartsByEntity(entity: ChartEntity): ChartConfig[] {
  return CHART_CONFIGS.filter(c => c.entity === entity)
}

/** Human-readable labels for each metric family. */
export const METRIC_LABELS: Record<ChartMetric, string> = {
  passing:   'Passing',
  rushing:   'Rushing',
  receiving: 'Receiving',
  composite: 'Total Offense',
  scoring:   'Scoring',
  wins:      'Wins & Records',
  schedule:  'Schedule',
  defense:   'Defense',
}

export function getAdjacentSlugs(slug: string): { prevSlug: string; nextSlug: string } {
  const n = CHART_CONFIGS.length
  if (n === 0) return { prevSlug: '', nextSlug: '' }
  const idx = CHART_CONFIGS.findIndex((c) => c.slug === slug)
  return {
    prevSlug: CHART_CONFIGS[(idx - 1 + n) % n].slug,
    nextSlug: CHART_CONFIGS[(idx + 1) % n].slug,
  }
}

export function applyPeriod(value: number, base: 'weekly' | 'annual', period: Period): number {
  if (base === 'weekly') {
    if (period === 'monthly') return value * (52 / 12)
    if (period === 'annual') return value * 52
    return value
  } else {
    if (period === 'monthly') return value / 12
    if (period === 'weekly') return value / 52
    return value
  }
}

export function fmtPeriodLabel(period: Period): string {
  if (period === 'weekly') return '/wk'
  if (period === 'monthly') return '/mo'
  return '/yr'
}
