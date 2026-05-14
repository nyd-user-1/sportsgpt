import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { getChartConfig, getAdjacentSlugs } from '@/lib/chart-configs'
import { ChartDetailPage, type StdRow, type MultiRow } from '@/components/ChartDetailPage'
import { SportsBarChart } from '@/components/charts/SportsBarChart'
import { SportsBarChartMulti } from '@/components/charts/SportsBarChartMulti'
import { SportsLineMulti } from '@/components/charts/SportsLineMulti'
import { SportsPieDonut } from '@/components/charts/SportsPieDonut'

export const dynamic = 'force-dynamic'

const DIV_COLORS: Record<string, string> = {
  I:   '#033882',
  II:  '#4338ca',
  III: '#0ea5e9',
  IV:  '#10b981',
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
        SELECT t.name, s.overall_wins AS value
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug AND s.season = 2024
        ORDER BY s.overall_wins DESC, t.name`
      tableRows = rows.map((r) => ({ name: r.name as string, value: Number(r.value) }))
      kpiValue = tableRows.length
      chartChild = (
        <SportsBarChart
          data={tableRows.slice(0, 20)}
          title={config.title}
          description={config.description}
          color={config.color}
          valueLabel="Wins"
        />
      )
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
        SELECT player_name AS name, pass_yards AS value
        FROM player_season_stats
        WHERE stat_type = 'Passing' AND season = 2024 AND pass_yards IS NOT NULL
        ORDER BY pass_yards DESC LIMIT 20`
      tableRows = rows.map((r) => ({ name: r.name as string, value: Number(r.value) }))
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      chartChild = (
        <SportsBarChart
          data={tableRows.slice(0, 15)}
          title={config.title}
          description={config.description}
          color={config.color}
          valueLabel="Pass Yards"
        />
      )
      break
    }

    // ── passing-tds-leaders ────────────────────────────────────────────────────
    case 'passing-tds-leaders': {
      const rows = await sql`
        SELECT player_name AS name, pass_tds AS value
        FROM player_season_stats
        WHERE stat_type = 'Passing' AND season = 2024 AND pass_tds IS NOT NULL
        ORDER BY pass_tds DESC LIMIT 20`
      tableRows = rows.map((r) => ({ name: r.name as string, value: Number(r.value) }))
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      chartChild = (
        <SportsBarChart
          data={tableRows.slice(0, 15)}
          title={config.title}
          description={config.description}
          color={config.color}
          valueLabel="Pass TDs"
        />
      )
      break
    }

    // ── rushing-yards-leaders ──────────────────────────────────────────────────
    case 'rushing-yards-leaders': {
      const rows = await sql`
        SELECT player_name AS name, rush_yards AS value
        FROM player_season_stats
        WHERE stat_type = 'Rushing' AND season = 2024 AND rush_yards IS NOT NULL
        ORDER BY rush_yards DESC LIMIT 20`
      tableRows = rows.map((r) => ({ name: r.name as string, value: Number(r.value) }))
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      chartChild = (
        <SportsBarChart
          data={tableRows.slice(0, 15)}
          title={config.title}
          description={config.description}
          color={config.color}
          valueLabel="Rush Yards"
        />
      )
      break
    }

    // ── rushing-tds-leaders ────────────────────────────────────────────────────
    case 'rushing-tds-leaders': {
      const rows = await sql`
        SELECT player_name AS name, rush_tds AS value
        FROM player_season_stats
        WHERE stat_type = 'Rushing' AND season = 2024 AND rush_tds IS NOT NULL
        ORDER BY rush_tds DESC LIMIT 20`
      tableRows = rows.map((r) => ({ name: r.name as string, value: Number(r.value) }))
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      chartChild = (
        <SportsBarChart
          data={tableRows.slice(0, 15)}
          title={config.title}
          description={config.description}
          color={config.color}
          valueLabel="Rush TDs"
        />
      )
      break
    }

    // ── receiving-yards-leaders ────────────────────────────────────────────────
    case 'receiving-yards-leaders': {
      const rows = await sql`
        SELECT player_name AS name, recv_yards AS value
        FROM player_season_stats
        WHERE stat_type = 'Receiving' AND season = 2024 AND recv_yards IS NOT NULL
        ORDER BY recv_yards DESC LIMIT 20`
      tableRows = rows.map((r) => ({ name: r.name as string, value: Number(r.value) }))
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      chartChild = (
        <SportsBarChart
          data={tableRows.slice(0, 15)}
          title={config.title}
          description={config.description}
          color={config.color}
          valueLabel="Recv Yards"
        />
      )
      break
    }

    // ── receiving-tds-leaders (NEW) ────────────────────────────────────────────
    case 'receiving-tds-leaders': {
      const rows = await sql`
        SELECT player_name AS name, recv_tds AS value
        FROM player_season_stats
        WHERE stat_type = 'Receiving' AND season = 2024 AND recv_tds IS NOT NULL
        ORDER BY recv_tds DESC LIMIT 20`
      tableRows = rows.map((r) => ({ name: r.name as string, value: Number(r.value) }))
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      chartChild = (
        <SportsBarChart
          data={tableRows.slice(0, 15)}
          title={config.title}
          description={config.description}
          color={config.color}
          valueLabel="Recv TDs"
        />
      )
      break
    }

    // ── total-tds-leaders (NEW) ────────────────────────────────────────────────
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

    // ── total-yards-leaders (NEW) ──────────────────────────────────────────────
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

    // ── total-points-leaders (NEW) ─────────────────────────────────────────────
    case 'total-points-leaders': {
      const rows = await sql`
        SELECT player_name AS name, points AS value
        FROM player_season_stats
        WHERE stat_type = 'Scoring' AND season = 2024 AND points IS NOT NULL
        ORDER BY points DESC LIMIT 20`
      tableRows = rows.map((r) => ({ name: r.name as string, value: Number(r.value) }))
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      chartChild = (
        <SportsBarChart
          data={tableRows.slice(0, 15)}
          title={config.title}
          description={config.description}
          color={config.color}
          valueLabel="Points"
        />
      )
      break
    }

    // ── team-scoring-avg (NEW) ─────────────────────────────────────────────────
    case 'team-scoring-avg': {
      const rows = await sql`
        WITH team_games AS (
          SELECT home_team_slug AS team_slug, home_score AS score
          FROM games WHERE home_score IS NOT NULL AND season = 2024
          UNION ALL
          SELECT away_team_slug AS team_slug, away_score AS score
          FROM games WHERE away_score IS NOT NULL AND season = 2024
        )
        SELECT t.name, ROUND(AVG(tg.score), 1)::float AS value
        FROM team_games tg
        JOIN teams t ON t.slug = tg.team_slug
        GROUP BY t.name
        HAVING COUNT(*) >= 3
        ORDER BY value DESC
        LIMIT 20`
      tableRows = rows.map((r) => ({ name: r.name as string, value: Number(r.value) }))
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      chartChild = (
        <SportsBarChart
          data={tableRows.slice(0, 15)}
          title={config.title}
          description={config.description}
          color={config.color}
          valueLabel="Avg Pts/Game"
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
    >
      {chartChild}
    </ChartDetailPage>
  )
}
