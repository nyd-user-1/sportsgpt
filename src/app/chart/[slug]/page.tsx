import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { getChartConfig, getAdjacentSlugs } from '@/lib/chart-configs'
import { ChartDetailPage, type StdRow, type MultiRow, type SubRow, type SubRowMap } from '@/components/ChartDetailPage'
import { SportsBarChart } from '@/components/charts/SportsBarChart'
import { SportsBarChartMulti } from '@/components/charts/SportsBarChartMulti'
import { SportsBarChartInteractive, type SeasonBars } from '@/components/charts/SportsBarChartInteractive'
import { SportsLineMulti } from '@/components/charts/SportsLineMulti'
import { SportsPieDonut } from '@/components/charts/SportsPieDonut'

export const dynamic = 'force-dynamic'

const DIV_COLORS: Record<string, string> = {
  I:   '#033882',
  II:  '#4338ca',
  III: '#0ea5e9',
  IV:  '#10b981',
}

function buildSeasonBars(
  rows: { name: unknown; value: unknown; season: unknown }[],
  seasons: string[]
): SeasonBars[] {
  return seasons.map(yr => {
    const yrows = rows
      .filter(r => String(r.season) === yr)
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, 15)
      .map(r => ({ name: String(r.name), value: Number(r.value) }))
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
  let subRows: SubRowMap | undefined = undefined

  switch (slug) {

    // ── win-pct-trend ──────────────────────────────────────────────────────────
    case 'win-pct-trend': {
      const rows = await sql`
        SELECT t.division, s.season::text AS season,
          ROUND((AVG(s.overall_wins::float / NULLIF(s.overall_wins + s.overall_losses, 0)) * 100)::numeric, 1) AS pct
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug
        WHERE s.season IN (2021, 2022, 2023, 2024)
          AND s.overall_wins + s.overall_losses > 0
        GROUP BY t.division, s.season
        ORDER BY s.season, t.division`

      const seasons = ['2021', '2022', '2023', '2024']
      multiPoints = seasons.map((yr) => {
        const pt: MultiRow = { name: yr }
        for (const r of rows) {
          if (r.season === yr) pt[r.division as string] = Number(r.pct)
        }
        return pt
      })
      tableRows = rows.map((r) => ({
        name: `Div ${r.division as string} · ${r.season as string}`,
        value: Number(r.pct),
      }))
      kpiValue = 4

      chartChild = (
        <SportsLineMulti
          data={multiPoints}
          xKey="name"
          series={[
            { key: 'I',   label: 'Division I',   color: DIV_COLORS.I   },
            { key: 'II',  label: 'Division II',  color: DIV_COLORS.II  },
            { key: 'III', label: 'Division III', color: DIV_COLORS.III },
            { key: 'IV',  label: 'Division IV',  color: DIV_COLORS.IV  },
          ]}
          title={config.title}
          description={config.description}
          valueSuffix="%"
        />
      )
      break
    }

    // ── win-pct-by-division ────────────────────────────────────────────────────
    case 'win-pct-by-division': {
      const rows = await sql`
        SELECT t.division AS div, SUM(s.overall_wins)::int AS wins
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug AND s.season = 2024
        GROUP BY t.division ORDER BY t.division`

      tableRows = rows.map((r) => ({
        name: `Division ${r.div as string}`,
        value: Number(r.wins),
      }))
      kpiValue = 4

      const pieData = rows.map((r) => ({
        name: `Division ${r.div as string}`,
        value: Number(r.wins),
        fill: DIV_COLORS[r.div as string] ?? '#033882',
      }))
      const pieConfig = Object.fromEntries(
        rows.map((r) => [
          `Division ${r.div as string}`,
          { label: `Division ${r.div as string}`, color: DIV_COLORS[r.div as string] ?? '#033882' },
        ])
      )

      chartChild = (
        <SportsPieDonut
          data={pieData}
          config={pieConfig}
          title={config.title}
          description={config.description}
        />
      )
      break
    }

    // ── season-records ─────────────────────────────────────────────────────────
    case 'season-records': {
      const rows = await sql`
        SELECT t.name, s.overall_wins AS value, s.season
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug
        WHERE s.season IN (2022, 2023, 2024)
        ORDER BY s.season, s.overall_wins DESC`
      const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], ['2022','2023','2024'])
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          title={config.title}
          description={config.description}
          color={config.color}
          valueLabel="Wins"
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

    // ── wins-by-school ─────────────────────────────────────────────────────────
    case 'wins-by-school': {
      const rows = await sql`
        SELECT t.name, SUM(s.overall_wins)::int AS value
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug
        WHERE s.season IN (2022, 2023, 2024)
        GROUP BY t.name ORDER BY value DESC`
      tableRows = rows.map((r) => ({ name: r.name as string, value: Number(r.value) }))
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      chartChild = (
        <SportsBarChart
          data={tableRows.slice(0, 20)}
          title={config.title}
          description={config.description}
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

    // ── schools-by-enrollment ──────────────────────────────────────────────────
    case 'schools-by-enrollment': {
      const rows = await sql`
        SELECT name, enrollment AS value FROM schools
        WHERE enrollment IS NOT NULL
        ORDER BY enrollment DESC`
      tableRows = rows.map((r) => ({ name: r.name as string, value: Number(r.value) }))
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      chartChild = (
        <SportsBarChart
          data={tableRows.slice(0, 20)}
          title={config.title}
          description={config.description}
          color={config.color}
          valueLabel="Students"
        />
      )
      break
    }

    // ── passing-yards-leaders ──────────────────────────────────────────────────
    case 'passing-yards-leaders': {
      const rows = await sql`
        SELECT player_name AS name, pass_yards AS value, season
        FROM player_season_stats
        WHERE stat_type = 'Passing' AND pass_yards IS NOT NULL AND season IN (2022, 2023, 2024)
        ORDER BY season, pass_yards DESC`
      const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], ['2022','2023','2024'])
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          title={config.title}
          description={config.description}
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
        SELECT player_name AS name, pass_tds AS value, season
        FROM player_season_stats
        WHERE stat_type = 'Passing' AND pass_tds IS NOT NULL AND season IN (2022, 2023, 2024)
        ORDER BY season, pass_tds DESC`
      const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], ['2022','2023','2024'])
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          title={config.title}
          description={config.description}
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
        SELECT player_name AS name, rush_yards AS value, season
        FROM player_season_stats
        WHERE stat_type = 'Rushing' AND rush_yards IS NOT NULL AND season IN (2022, 2023, 2024)
        ORDER BY season, rush_yards DESC`
      const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], ['2022','2023','2024'])
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          title={config.title}
          description={config.description}
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
        SELECT player_name AS name, rush_tds AS value, season
        FROM player_season_stats
        WHERE stat_type = 'Rushing' AND rush_tds IS NOT NULL AND season IN (2022, 2023, 2024)
        ORDER BY season, rush_tds DESC`
      const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], ['2022','2023','2024'])
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          title={config.title}
          description={config.description}
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
        SELECT player_name AS name, recv_yards AS value, season
        FROM player_season_stats
        WHERE stat_type = 'Receiving' AND recv_yards IS NOT NULL AND season IN (2022, 2023, 2024)
        ORDER BY season, recv_yards DESC`
      const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], ['2022','2023','2024'])
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          title={config.title}
          description={config.description}
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
        SELECT player_name AS name, recv_tds AS value, season
        FROM player_season_stats
        WHERE stat_type = 'Receiving' AND recv_tds IS NOT NULL AND season IN (2022, 2023, 2024)
        ORDER BY season, recv_tds DESC`
      const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], ['2022','2023','2024'])
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          title={config.title}
          description={config.description}
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
        SELECT player_name AS name,
          COALESCE(rush_tds, 0) AS rush,
          COALESCE(recv_tds, 0) AS recv,
          COALESCE(total_tds, 0) AS total
        FROM player_season_stats
        WHERE stat_type = 'Touchdowns' AND season = 2024
        ORDER BY total_tds DESC NULLS LAST LIMIT 20`

      const multiData = rows.map((r) => ({
        name: r.name as string,
        rush: Number(r.rush),
        recv: Number(r.recv),
      }))
      tableRows = rows.map((r) => ({ name: r.name as string, value: Number(r.total) }))
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0

      chartChild = (
        <SportsBarChartMulti
          data={multiData}
          series={[
            { key: 'rush', label: 'Rush TDs', color: '#033882' },
            { key: 'recv', label: 'Recv TDs', color: '#4338ca' },
          ]}
          title={config.title}
          description={config.description}
        />
      )
      break
    }

    // ── total-yards-leaders ────────────────────────────────────────────────────
    case 'total-yards-leaders': {
      const rows = await sql`
        SELECT player_name AS name,
          COALESCE(pass_yards, 0) AS pass,
          COALESCE(rush_yards, 0) AS rush,
          COALESCE(recv_yards, 0) AS recv,
          COALESCE(total_yards, 0) AS total
        FROM player_season_stats
        WHERE stat_type = 'Total Yards' AND season = 2024
        ORDER BY total_yards DESC NULLS LAST LIMIT 15`

      const multiData = rows.map((r) => ({
        name: r.name as string,
        pass: Number(r.pass),
        rush: Number(r.rush),
        recv: Number(r.recv),
      }))
      tableRows = rows.map((r) => ({ name: r.name as string, value: Number(r.total) }))
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0

      chartChild = (
        <SportsBarChartMulti
          data={multiData}
          series={[
            { key: 'pass', label: 'Pass Yds', color: '#033882' },
            { key: 'rush', label: 'Rush Yds', color: '#4338ca' },
            { key: 'recv', label: 'Recv Yds', color: '#0ea5e9' },
          ]}
          title={config.title}
          description={config.description}
          stacked={true}
        />
      )
      break
    }

    // ── total-points-leaders ───────────────────────────────────────────────────
    case 'total-points-leaders': {
      const rows = await sql`
        SELECT player_name AS name, points AS value, season
        FROM player_season_stats
        WHERE stat_type = 'Scoring' AND season = 2024 AND points IS NOT NULL
        ORDER BY points DESC LIMIT 20`
      const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], ['2024'])
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          title={config.title}
          description={config.description}
          color={config.color}
          valueLabel="Points"
        />
      )
      break
    }

    // ── team-scoring-avg ───────────────────────────────────────────────────────
    case 'team-scoring-avg': {
      const rows = await sql`
        WITH team_games AS (
          SELECT home_team_slug AS team_slug, home_score AS score
          FROM games WHERE home_score IS NOT NULL AND season = 2024
          UNION ALL
          SELECT away_team_slug AS team_slug, away_score AS score
          FROM games WHERE away_score IS NOT NULL AND season = 2024
        )
        SELECT t.name, ROUND(AVG(tg.score)::numeric, 1) AS value
        FROM team_games tg
        JOIN teams t ON t.slug = tg.team_slug
        GROUP BY t.name
        HAVING COUNT(*) >= 3
        ORDER BY value DESC
        LIMIT 20`
      const rows2 = rows.map(r => ({ name: r.name as string, value: Number(r.value), season: '2024' }))
      const seasonBars = buildSeasonBars(rows2, ['2024'])
      tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          title={config.title}
          description={config.description}
          color={config.color}
          valueLabel="Avg Pts/Game"
        />
      )

      const scoringDetail = await sql`
        WITH home_avg AS (
          SELECT home_team_slug AS team_slug, ROUND(AVG(home_score)::numeric, 1) AS avg_score, 'Home' AS side
          FROM games WHERE home_score IS NOT NULL AND season = 2024
          GROUP BY home_team_slug
        ),
        away_avg AS (
          SELECT away_team_slug AS team_slug, ROUND(AVG(away_score)::numeric, 1) AS avg_score, 'Away' AS side
          FROM games WHERE away_score IS NOT NULL AND season = 2024
          GROUP BY away_team_slug
        )
        SELECT t.name, d.avg_score, d.side
        FROM (SELECT * FROM home_avg UNION ALL SELECT * FROM away_avg) d
        JOIN teams t ON t.slug = d.team_slug
        ORDER BY t.name, d.side DESC`

      subRows = {}
      for (const r of scoringDetail) {
        const key = r.name as string
        if (!subRows[key]) subRows[key] = []
        subRows[key].push({ label: r.side as string, value: Number(r.avg_score) })
      }
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
    >
      {chartChild}
    </ChartDetailPage>
  )
}
