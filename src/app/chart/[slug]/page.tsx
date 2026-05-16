import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { getChartConfig, getAdjacentSlugs } from '@/lib/chart-configs'
import { ChartDetailPage, type StdRow, type MultiRow, type SubRow, type SubRowMap } from '@/components/ChartDetailPage'
import { SportsBarChart } from '@/components/charts/SportsBarChart'
import { SportsBarChartMulti } from '@/components/charts/SportsBarChartMulti'
import { SportsBarChartInteractive, type SeasonBars } from '@/components/charts/SportsBarChartInteractive'
import { SportsBarChartStackedInteractive, type StackedSeasonBars } from '@/components/charts/SportsBarChartStackedInteractive'
import { SportsBarChartDynasty, type DynastyBar, type DynastyWindow } from '@/components/charts/SportsBarChartDynasty'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { CURRENT_SEASON, AVAILABLE_SEASONS } from '@/lib/season'

export const dynamic = 'force-dynamic'

const DIV_COLORS: Record<string, string> = {
  I:   '#033882',
  II:  '#4338ca',
  III: '#0ea5e9',
  IV:  '#10b981',
}

function buildSeasonBars(
  rows: { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[],
  seasons: string[],
  limit = 50
): SeasonBars[] {
  return seasons.map(yr => {
    const yrows = rows
      .filter(r => String(r.season) === yr)
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, limit)
      .map(r => ({
        name: String(r.name),
        value: Number(r.value),
        logoUrl: r.school_slug ? (SCHOOL_LOGOS[String(r.school_slug)] ?? '') : '',
      }))
    const topValue = yrows[0]?.value ?? 0
    return { season: yr, topValue, bars: yrows }
  })
}

export default async function ChartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const config = getChartConfig(slug)
  if (!config) notFound()

  const { prevSlug, nextSlug } = getAdjacentSlugs(slug)

  let tableRows: StdRow[] = []
  let multiPoints: MultiRow[] = []
  let kpiValue = 0
  let chartChild: React.ReactNode = null
  let seasonFilters: string[] | undefined = undefined
  let seasonRows: Record<string, StdRow[]> | undefined = undefined
  const ALL_SEASONS  = AVAILABLE_SEASONS.map(String)
  const LAST3_SEASONS = ALL_SEASONS.slice(-3)
  const SEASON_FILTER_MAP: Record<string, string[]> = {
    'season-records':             ALL_SEASONS,
    'wins-by-school':             LAST3_SEASONS, // overridden in case block
    'point-differential-leaders': LAST3_SEASONS,
    'passing-yards-leaders':      ALL_SEASONS,
    'passing-tds-leaders':        ALL_SEASONS,
    'rushing-yards-leaders':      ALL_SEASONS,
    'rushing-tds-leaders':        ALL_SEASONS,
    'receiving-yards-leaders':    ALL_SEASONS,
    'receiving-tds-leaders':      ALL_SEASONS,
    'total-tds-leaders':          ALL_SEASONS,
    'total-yards-leaders':        ALL_SEASONS,
    'total-points-leaders':       ALL_SEASONS,
  }
  seasonFilters = SEASON_FILTER_MAP[slug]
  let subRows: SubRowMap | undefined = undefined
  let rowLinks: Record<string, string> | undefined = undefined

  switch (slug) {

    // ── season-records ─────────────────────────────────────────────────────────
    case 'season-records': {
      const recordRows = await sql`
        SELECT t.name, t.slug AS team_slug, t.school_slug, s.overall_wins AS wins, s.overall_losses AS losses, s.season
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug
        WHERE s.season IN (2021, 2022, 2023, 2024, 2025)
        ORDER BY s.season, s.overall_wins DESC`

      const stackedSeasonBars: StackedSeasonBars[] = ALL_SEASONS.map(yr => ({
        season: yr,
        bars: recordRows
          .filter(r => String(r.season) === yr)
          .sort((a, b) => Number(b.wins) - Number(a.wins))
          .map(r => ({
            name: r.name as string,
            wins: Number(r.wins),
            losses: Number(r.losses),
            logoUrl: SCHOOL_LOGOS[r.school_slug as string] ?? '',
          })),
      }))

      seasonRows = {}
      for (const bar of stackedSeasonBars) {
        seasonRows[bar.season] = bar.bars.map(b => ({
          name: b.name,
          value: b.wins,
          logoUrl: b.logoUrl,
        }))
      }
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? []
      kpiValue = tableRows.length

      rowLinks = Object.fromEntries(
        recordRows.map(r => [r.name as string, `/team/${r.team_slug as string}`])
      )

      chartChild = (
        <SportsBarChartStackedInteractive
          seasons={stackedSeasonBars}
          color={config.color}
        />
      )
      break
    }

    // ── wins-by-school (Current Dynasty) ──────────────────────────────────────
    case 'wins-by-school': {
      const rows = await sql`
        SELECT t.name, t.slug AS team_slug, t.school_slug, s.season,
          s.overall_wins, s.overall_losses, COALESCE(s.overall_ties, 0) AS overall_ties
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug
        WHERE s.season IN (2020, 2021, 2022, 2023, 2024, 2025)
        ORDER BY t.name, s.season`

      // Index wins/losses/ties per team per season
      const byTeam: Record<string, Record<string, { w: number; l: number; t: number }>> = {}
      const schoolSlugs: Record<string, string> = {}
      const teamSlugs: Record<string, string> = {}
      for (const r of rows) {
        const name = r.name as string
        const season = String(r.season)
        if (!byTeam[name]) byTeam[name] = {}
        byTeam[name][season] = { w: Number(r.overall_wins), l: Number(r.overall_losses), t: Number(r.overall_ties) }
        schoolSlugs[name] = r.school_slug as string
        teamSlugs[name] = r.team_slug as string
      }
      const teamNames = Object.keys(byTeam)

      const buildDynastyWindow = (endYear: number): DynastyWindow => {
        const [y1, y2, y3] = [String(endYear - 2), String(endYear - 1), String(endYear)]
        const bars: DynastyBar[] = teamNames
          .map(name => {
            const s = byTeam[name]
            const w1 = s[y1]?.w ?? 0, w2 = s[y2]?.w ?? 0, w3 = s[y3]?.w ?? 0
            const games = (s[y1] ? s[y1].w + s[y1].l + s[y1].t : 0)
                        + (s[y2] ? s[y2].w + s[y2].l + s[y2].t : 0)
                        + (s[y3] ? s[y3].w + s[y3].l + s[y3].t : 0)
            return { name, logoUrl: SCHOOL_LOGOS[schoolSlugs[name]] ?? '',
              yr1: w1, yr1Label: y1, yr2: w2, yr2Label: y2, yr3: w3, yr3Label: y3, totalGames: games }
          })
          .filter(b => b.yr1 + b.yr2 + b.yr3 > 0)
          .sort((a, b) => (b.yr1 + b.yr2 + b.yr3) - (a.yr1 + a.yr2 + a.yr3))
        return { filterYear: String(endYear), bars }
      }

      const has2020 = rows.some(r => String(r.season) === '2020')
      const dynastyWindows: DynastyWindow[] = [
        ...(has2020 ? [buildDynastyWindow(2022)] : []),
        buildDynastyWindow(2023),
        buildDynastyWindow(2024),
        buildDynastyWindow(CURRENT_SEASON),
      ]

      seasonRows = {}
      for (const w of dynastyWindows) {
        seasonRows[w.filterYear] = w.bars.map(b => {
          const total = b.yr1 + b.yr2 + b.yr3
          return {
            name: b.name,
            value: total,
            logoUrl: b.logoUrl,
            winPct: b.totalGames > 0 ? (total / b.totalGames) * 100 : 0,
          }
        })
      }
      rowLinks = Object.fromEntries(
        teamNames.map(name => [name, `/team/${teamSlugs[name]}`])
      )
      const win2025 = dynastyWindows.find(w => w.filterYear === String(CURRENT_SEASON))
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? (win2025?.bars ?? []).map(b => ({
        name: b.name, value: b.yr1 + b.yr2 + b.yr3, logoUrl: b.logoUrl,
      }))
      kpiValue = tableRows[0]?.value ?? 0
      seasonFilters = dynastyWindows.map(w => w.filterYear)

      chartChild = <SportsBarChartDynasty windows={dynastyWindows} />
      break
    }

    // ── point-differential-leaders ────────────────────────────────────────────
    case 'point-differential-leaders': {
      const rows = await sql`
        SELECT
          t.name,
          t.school_slug,
          s.season,
          (
            SUM(CASE WHEN g.home_team_slug = t.slug THEN g.home_score ELSE g.away_score END)
            - SUM(CASE WHEN g.home_team_slug = t.slug THEN g.away_score ELSE g.home_score END)
          )::int AS value
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug
        JOIN games g ON (g.home_team_slug = t.slug OR g.away_team_slug = t.slug)
          AND g.season = s.season
          AND g.home_score IS NOT NULL
        WHERE s.season IN (2023, 2024, 2025)
        GROUP BY t.name, t.school_slug, s.season
        ORDER BY s.season, value DESC`

      const seasonBars = buildSeasonBars(
        rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[],
        LAST3_SEASONS,
        52
      )
      tableRows = seasonBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          color={config.color}
          valueLabel="Differential"
        />
      )
      break
    }

    // ── passing-yards-leaders ──────────────────────────────────────────────────
    case 'passing-yards-leaders': {
      const rows = await sql`
        SELECT player_name AS name, school_slug, pass_yards AS value, season
        FROM player_season_stats
        WHERE stat_type = 'Passing' AND pass_yards IS NOT NULL AND season IN (2021, 2022, 2023, 2024, 2025)
        ORDER BY season, pass_yards DESC`
      const seasonBars = buildSeasonBars(rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[], ['2021', '2022', '2023', '2024', '2025'])
      tableRows = seasonBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          color={config.color}
          valueLabel="Pass Yards"
        />
      )
      subRows = {}
      for (const r of rows) {
        const key = r.name as string
        if (!subRows[key]) subRows[key] = []
        subRows[key].push({ label: String(r.season), value: Number(r.value) })
      }
      for (const key of Object.keys(subRows)) {
        subRows[key].sort((a: SubRow, b: SubRow) => Number(a.label) - Number(b.label))
      }
      break
    }

    // ── passing-tds-leaders ────────────────────────────────────────────────────
    case 'passing-tds-leaders': {
      const rows = await sql`
        SELECT player_name AS name, school_slug, pass_tds AS value, season
        FROM player_season_stats
        WHERE stat_type = 'Passing' AND pass_tds IS NOT NULL AND season IN (2021, 2022, 2023, 2024, 2025)
        ORDER BY season, pass_tds DESC`
      const seasonBars = buildSeasonBars(rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[], ['2021', '2022', '2023', '2024', '2025'])
      tableRows = seasonBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          color={config.color}
          valueLabel="Pass TDs"
        />
      )
      subRows = {}
      for (const r of rows) {
        const key = r.name as string
        if (!subRows[key]) subRows[key] = []
        subRows[key].push({ label: String(r.season), value: Number(r.value) })
      }
      for (const key of Object.keys(subRows)) {
        subRows[key].sort((a: SubRow, b: SubRow) => Number(a.label) - Number(b.label))
      }
      break
    }

    // ── rushing-yards-leaders ──────────────────────────────────────────────────
    case 'rushing-yards-leaders': {
      const rows = await sql`
        SELECT player_name AS name, school_slug, rush_yards AS value, season
        FROM player_season_stats
        WHERE stat_type = 'Rushing' AND rush_yards IS NOT NULL AND season IN (2021, 2022, 2023, 2024, 2025)
        ORDER BY season, rush_yards DESC`
      const seasonBars = buildSeasonBars(rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[], ['2021', '2022', '2023', '2024', '2025'])
      tableRows = seasonBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          color={config.color}
          valueLabel="Rush Yards"
        />
      )
      subRows = {}
      for (const r of rows) {
        const key = r.name as string
        if (!subRows[key]) subRows[key] = []
        subRows[key].push({ label: String(r.season), value: Number(r.value) })
      }
      for (const key of Object.keys(subRows)) {
        subRows[key].sort((a: SubRow, b: SubRow) => Number(a.label) - Number(b.label))
      }
      break
    }

    // ── rushing-tds-leaders ────────────────────────────────────────────────────
    case 'rushing-tds-leaders': {
      const rows = await sql`
        SELECT player_name AS name, school_slug, rush_tds AS value, season
        FROM player_season_stats
        WHERE stat_type = 'Rushing' AND rush_tds IS NOT NULL AND season IN (2021, 2022, 2023, 2024, 2025)
        ORDER BY season, rush_tds DESC`
      const seasonBars = buildSeasonBars(rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[], ['2021', '2022', '2023', '2024', '2025'])
      tableRows = seasonBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          color={config.color}
          valueLabel="Rush TDs"
        />
      )
      subRows = {}
      for (const r of rows) {
        const key = r.name as string
        if (!subRows[key]) subRows[key] = []
        subRows[key].push({ label: String(r.season), value: Number(r.value) })
      }
      for (const key of Object.keys(subRows)) {
        subRows[key].sort((a: SubRow, b: SubRow) => Number(a.label) - Number(b.label))
      }
      break
    }

    // ── receiving-yards-leaders ────────────────────────────────────────────────
    case 'receiving-yards-leaders': {
      const rows = await sql`
        SELECT player_name AS name, school_slug, recv_yards AS value, season
        FROM player_season_stats
        WHERE stat_type = 'Receiving' AND recv_yards IS NOT NULL AND season IN (2021, 2022, 2023, 2024, 2025)
        ORDER BY season, recv_yards DESC`
      const seasonBars = buildSeasonBars(rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[], ['2021', '2022', '2023', '2024', '2025'])
      tableRows = seasonBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          color={config.color}
          valueLabel="Recv Yards"
        />
      )
      subRows = {}
      for (const r of rows) {
        const key = r.name as string
        if (!subRows[key]) subRows[key] = []
        subRows[key].push({ label: String(r.season), value: Number(r.value) })
      }
      for (const key of Object.keys(subRows)) {
        subRows[key].sort((a: SubRow, b: SubRow) => Number(a.label) - Number(b.label))
      }
      break
    }

    // ── receiving-tds-leaders ──────────────────────────────────────────────────
    case 'receiving-tds-leaders': {
      const rows = await sql`
        SELECT player_name AS name, school_slug, recv_tds AS value, season
        FROM player_season_stats
        WHERE stat_type = 'Receiving' AND recv_tds IS NOT NULL AND season IN (2021, 2022, 2023, 2024, 2025)
        ORDER BY season, recv_tds DESC`
      const seasonBars = buildSeasonBars(rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[], ['2021', '2022', '2023', '2024', '2025'])
      tableRows = seasonBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          color={config.color}
          valueLabel="Recv TDs"
        />
      )
      subRows = {}
      for (const r of rows) {
        const key = r.name as string
        if (!subRows[key]) subRows[key] = []
        subRows[key].push({ label: String(r.season), value: Number(r.value) })
      }
      for (const key of Object.keys(subRows)) {
        subRows[key].sort((a: SubRow, b: SubRow) => Number(a.label) - Number(b.label))
      }
      break
    }

    // ── total-tds-leaders ──────────────────────────────────────────────────────
    case 'total-tds-leaders': {
      const rows = await sql`
        WITH rushing AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(rush_tds, 0) AS rush_tds
          FROM player_season_stats
          WHERE stat_type = 'Rushing' AND season IN (2021, 2022, 2023, 2024, 2025)
        ),
        receiving AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(recv_tds, 0) AS recv_tds
          FROM player_season_stats
          WHERE stat_type = 'Receiving' AND season IN (2021, 2022, 2023, 2024, 2025)
        )
        SELECT
          COALESCE(r.player_name, v.player_name) AS name,
          COALESCE(r.school_slug, v.school_slug) AS school_slug,
          COALESCE(r.season, v.season) AS season,
          COALESCE(r.rush_tds, 0) + COALESCE(v.recv_tds, 0) AS value
        FROM rushing r
        FULL OUTER JOIN receiving v ON v.player_slug = r.player_slug AND v.season = r.season
        WHERE COALESCE(r.rush_tds, 0) + COALESCE(v.recv_tds, 0) > 0
        ORDER BY season, value DESC`

      const seasonBars = buildSeasonBars(
        rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[],
        ALL_SEASONS
      )
      tableRows = seasonBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          color={config.color}
          valueLabel="Total TDs"
        />
      )
      break
    }

    // ── total-yards-leaders ────────────────────────────────────────────────────
    case 'total-yards-leaders': {
      const rows = await sql`
        WITH passing AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(pass_yards, 0) AS pass_yards
          FROM player_season_stats
          WHERE stat_type = 'Passing' AND season IN (2021, 2022, 2023, 2024, 2025)
        ),
        rushing AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(rush_yards, 0) AS rush_yards
          FROM player_season_stats
          WHERE stat_type = 'Rushing' AND season IN (2021, 2022, 2023, 2024, 2025)
        ),
        receiving AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(recv_yards, 0) AS recv_yards
          FROM player_season_stats
          WHERE stat_type = 'Receiving' AND season IN (2021, 2022, 2023, 2024, 2025)
        )
        SELECT
          COALESCE(pa.player_name, ru.player_name, re.player_name) AS name,
          COALESCE(pa.school_slug, ru.school_slug, re.school_slug) AS school_slug,
          COALESCE(pa.season, ru.season, re.season) AS season,
          COALESCE(pa.pass_yards, 0) + COALESCE(ru.rush_yards, 0) + COALESCE(re.recv_yards, 0) AS value
        FROM passing pa
        FULL OUTER JOIN rushing ru ON ru.player_slug = pa.player_slug AND ru.season = pa.season
        FULL OUTER JOIN receiving re
          ON re.player_slug = COALESCE(pa.player_slug, ru.player_slug)
          AND re.season = COALESCE(pa.season, ru.season)
        WHERE COALESCE(pa.pass_yards, 0) + COALESCE(ru.rush_yards, 0) + COALESCE(re.recv_yards, 0) > 0
        ORDER BY season, value DESC`

      const seasonBars = buildSeasonBars(
        rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[],
        ALL_SEASONS
      )
      tableRows = seasonBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          color={config.color}
          valueLabel="Total Yards"
        />
      )
      break
    }

    // ── total-points-leaders ───────────────────────────────────────────────────
    case 'total-points-leaders': {
      const rows = await sql`
        WITH tds AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(rush_tds, 0) AS rush_tds
          FROM player_season_stats
          WHERE stat_type = 'Rushing' AND season IN (2021, 2022, 2023, 2024, 2025)
        ),
        recv AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(recv_tds, 0) AS recv_tds,
            COALESCE(pat, 0) AS pat
          FROM player_season_stats
          WHERE stat_type = 'Receiving' AND season IN (2021, 2022, 2023, 2024, 2025)
        ),
        passing AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(pass_tds, 0) AS pass_tds
          FROM player_season_stats
          WHERE stat_type = 'Passing' AND season IN (2021, 2022, 2023, 2024, 2025)
        )
        SELECT
          COALESCE(t.player_name, r.player_name, p.player_name) AS name,
          COALESCE(t.school_slug, r.school_slug, p.school_slug) AS school_slug,
          COALESCE(t.season, r.season, p.season) AS season,
          (COALESCE(t.rush_tds, 0) + COALESCE(r.recv_tds, 0) + COALESCE(p.pass_tds, 0)) * 6
            + COALESCE(r.pat, 0) AS value
        FROM tds t
        FULL OUTER JOIN recv r ON r.player_slug = t.player_slug AND r.season = t.season
        FULL OUTER JOIN passing p
          ON p.player_slug = COALESCE(t.player_slug, r.player_slug)
          AND p.season = COALESCE(t.season, r.season)
        WHERE (COALESCE(t.rush_tds, 0) + COALESCE(r.recv_tds, 0) + COALESCE(p.pass_tds, 0)) * 6
          + COALESCE(r.pat, 0) > 0
        ORDER BY season, value DESC`

      const seasonBars = buildSeasonBars(
        rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[],
        ALL_SEASONS
      )
      tableRows = seasonBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          color={config.color}
          valueLabel="Points"
        />
      )
      break
    }

    default:
      notFound()
  }

  return (
    <ChartDetailPage
      config={config}
      prevSlug={prevSlug}
      nextSlug={nextSlug}
      kpiValue={kpiValue}
      tableRows={tableRows}
      multiPoints={multiPoints}
      subRows={subRows}
      rowLinks={rowLinks}
      seasonFilters={seasonFilters}
      seasonRows={seasonRows}
      valueLabel={slug === 'wins-by-school' ? '3YR Total Wins' : slug === 'season-records' ? 'Wins' : undefined}
      showRank={slug === 'wins-by-school' || slug === 'season-records'}
    >
      {chartChild}
    </ChartDetailPage>
  )
}
