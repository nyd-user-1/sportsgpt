import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { getChartConfig, getAdjacentSlugs } from '@/lib/chart-configs'
import { ChartDetailPage, type StdRow, type MultiRow, type SubRow, type SubRowMap } from '@/components/ChartDetailPage'
import { SportsBarChart } from '@/components/charts/SportsBarChart'
import { SportsBarChartMulti } from '@/components/charts/SportsBarChartMulti'
import { SportsBarChartInteractive, type SeasonBars } from '@/components/charts/SportsBarChartInteractive'
import { SportsBarChartStackedInteractive, type StackedSeasonBars } from '@/components/charts/SportsBarChartStackedInteractive'
import { SCHOOL_LOGOS } from '@/lib/team-images'

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
  const SEASON_FILTER_MAP: Record<string, string[]> = {
    'season-records':             ['2021', '2022', '2023', '2024'],
    'wins-by-school':             [],
    'point-differential-leaders': ['2023', '2024'],
    'passing-yards-leaders':      ['2021', '2022', '2023', '2024'],
    'passing-tds-leaders':        ['2021', '2022', '2023', '2024'],
    'rushing-yards-leaders':      ['2021', '2022', '2023', '2024'],
    'rushing-tds-leaders':        ['2021', '2022', '2023', '2024'],
    'receiving-yards-leaders':    ['2021', '2022', '2023', '2024'],
    'receiving-tds-leaders':      ['2021', '2022', '2023', '2024'],
    'total-tds-leaders':          ['2021', '2022', '2023', '2024'],
    'total-yards-leaders':        ['2021', '2022', '2023', '2024'],
    'total-points-leaders':       ['2021', '2022', '2023', '2024'],
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
        WHERE s.season IN (2021, 2022, 2023, 2024)
        ORDER BY s.season, s.overall_wins DESC`

      const stackedSeasonBars: StackedSeasonBars[] = ['2021','2022','2023','2024'].map(yr => ({
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

      tableRows = (stackedSeasonBars.find(s => s.season === '2024')?.bars ?? [])
        .map(b => ({ name: b.name, value: b.wins }))
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
        SELECT t.name, t.school_slug, SUM(s.overall_wins)::int AS value
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug
        WHERE s.season IN (2022, 2023, 2024)
        GROUP BY t.name, t.school_slug ORDER BY value DESC`

      tableRows = rows.map((r) => ({
        name: r.name as string,
        value: Number(r.value),
        logoUrl: SCHOOL_LOGOS[r.school_slug as string] ?? '',
      }))
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0

      chartChild = (
        <SportsBarChart
          data={tableRows.slice(0, 52)}
          color={config.color}
          valueLabel="Total Wins"
        />
      )

      const recordRows = await sql`
        SELECT t.name, s.season, s.overall_wins AS w, s.overall_losses AS l
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug
        WHERE s.season IN (2022, 2023, 2024)
        ORDER BY t.name, s.season`

      subRows = {}
      for (const r of recordRows) {
        const key = r.name as string
        if (!subRows[key]) subRows[key] = []
        subRows[key].push({
          label: String(r.season),
          value: Number(r.w),
          extra: `${r.w}–${r.l}`,
        })
      }
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
        WHERE s.season IN (2023, 2024)
        GROUP BY t.name, t.school_slug, s.season
        ORDER BY s.season, value DESC`

      const seasonBars = buildSeasonBars(
        rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[],
        ['2023', '2024'],
        52
      )
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
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
        WHERE stat_type = 'Passing' AND pass_yards IS NOT NULL AND season IN (2021, 2022, 2023, 2024)
        ORDER BY season, pass_yards DESC`
      const seasonBars = buildSeasonBars(rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[], ['2021', '2022', '2023', '2024'])
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
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
        WHERE stat_type = 'Passing' AND pass_tds IS NOT NULL AND season IN (2021, 2022, 2023, 2024)
        ORDER BY season, pass_tds DESC`
      const seasonBars = buildSeasonBars(rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[], ['2021', '2022', '2023', '2024'])
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
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
        WHERE stat_type = 'Rushing' AND rush_yards IS NOT NULL AND season IN (2021, 2022, 2023, 2024)
        ORDER BY season, rush_yards DESC`
      const seasonBars = buildSeasonBars(rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[], ['2021', '2022', '2023', '2024'])
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
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
        WHERE stat_type = 'Rushing' AND rush_tds IS NOT NULL AND season IN (2021, 2022, 2023, 2024)
        ORDER BY season, rush_tds DESC`
      const seasonBars = buildSeasonBars(rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[], ['2021', '2022', '2023', '2024'])
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
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
        WHERE stat_type = 'Receiving' AND recv_yards IS NOT NULL AND season IN (2021, 2022, 2023, 2024)
        ORDER BY season, recv_yards DESC`
      const seasonBars = buildSeasonBars(rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[], ['2021', '2022', '2023', '2024'])
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
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
        WHERE stat_type = 'Receiving' AND recv_tds IS NOT NULL AND season IN (2021, 2022, 2023, 2024)
        ORDER BY season, recv_tds DESC`
      const seasonBars = buildSeasonBars(rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[], ['2021', '2022', '2023', '2024'])
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
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
          WHERE stat_type = 'Rushing' AND season IN (2021, 2022, 2023, 2024)
        ),
        receiving AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(recv_tds, 0) AS recv_tds
          FROM player_season_stats
          WHERE stat_type = 'Receiving' AND season IN (2021, 2022, 2023, 2024)
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
        ['2021', '2022', '2023', '2024']
      )
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
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
          WHERE stat_type = 'Passing' AND season IN (2021, 2022, 2023, 2024)
        ),
        rushing AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(rush_yards, 0) AS rush_yards
          FROM player_season_stats
          WHERE stat_type = 'Rushing' AND season IN (2021, 2022, 2023, 2024)
        ),
        receiving AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(recv_yards, 0) AS recv_yards
          FROM player_season_stats
          WHERE stat_type = 'Receiving' AND season IN (2021, 2022, 2023, 2024)
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
        ['2021', '2022', '2023', '2024']
      )
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
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
          WHERE stat_type = 'Rushing' AND season IN (2021, 2022, 2023, 2024)
        ),
        recv AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(recv_tds, 0) AS recv_tds,
            COALESCE(pat, 0) AS pat
          FROM player_season_stats
          WHERE stat_type = 'Receiving' AND season IN (2021, 2022, 2023, 2024)
        ),
        passing AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(pass_tds, 0) AS pass_tds
          FROM player_season_stats
          WHERE stat_type = 'Passing' AND season IN (2021, 2022, 2023, 2024)
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
        ['2021', '2022', '2023', '2024']
      )
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
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
    >
      {chartChild}
    </ChartDetailPage>
  )
}
