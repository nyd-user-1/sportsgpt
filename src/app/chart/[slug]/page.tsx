import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { getChartConfig, getAdjacentSlugs } from '@/lib/chart-configs'
import { ChartDetailPage, type StdRow, type MultiRow, type ScatterRow } from '@/components/ChartDetailPage'

export const dynamic = 'force-dynamic'

export default async function ChartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const config = getChartConfig(slug)
  if (!config) notFound()

  const { prevSlug, nextSlug } = getAdjacentSlugs(slug)

  let tableRows: StdRow[] = []
  let chartPoints: StdRow[] = []
  let multiPoints: MultiRow[] = []
  let scatterPoints: ScatterRow[] = []
  let kpiValue = 0

  switch (slug) {
    case 'teams-by-division': {
      const rows = await sql`
        SELECT division AS name, COUNT(*)::int AS value
        FROM teams GROUP BY division ORDER BY division`
      tableRows = rows.map(r => ({ name: `Division ${r.name}`, value: Number(r.value) }))
      chartPoints = tableRows
      kpiValue = tableRows.reduce((s, r) => s + r.value, 0)
      break
    }

    case 'win-pct-by-division': {
      const rows = await sql`
        SELECT t.division AS name,
          ROUND(AVG(s.overall_wins::float / NULLIF(s.overall_wins + s.overall_losses, 0)) * 100, 1)::float AS value
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug AND s.season = 2024
        WHERE s.overall_wins + s.overall_losses > 0
        GROUP BY t.division ORDER BY t.division`
      tableRows = rows.map(r => ({ name: `Division ${r.name}`, value: Number(r.value) }))
      chartPoints = tableRows
      kpiValue = tableRows.length > 0 ? Math.max(...tableRows.map(r => r.value)) : 0
      break
    }

    case 'season-records': {
      const rows = await sql`
        SELECT t.name, s.overall_wins AS value
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug AND s.season = 2024
        ORDER BY s.overall_wins DESC, t.name`
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows.slice(0, 20)
      kpiValue = tableRows.length
      break
    }

    case 'wins-by-school': {
      const rows = await sql`
        SELECT t.name, SUM(s.overall_wins)::int AS value
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug
        WHERE s.season IN (2022, 2023, 2024)
        GROUP BY t.name ORDER BY value DESC`
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows.slice(0, 20)
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      break
    }

    case 'schools-by-enrollment': {
      const rows = await sql`
        SELECT name, enrollment AS value FROM schools
        WHERE enrollment IS NOT NULL
        ORDER BY enrollment DESC`
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows.slice(0, 20)
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      break
    }

    case 'passing-yards-leaders': {
      const rows = await sql`
        SELECT player_name AS name, pass_yards AS value
        FROM player_season_stats
        WHERE stat_type = 'Passing' AND season = 2024 AND pass_yards IS NOT NULL
        ORDER BY pass_yards DESC LIMIT 25`
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows.slice(0, 15)
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      break
    }

    case 'rushing-yards-leaders': {
      const rows = await sql`
        SELECT player_name AS name, rush_yards AS value
        FROM player_season_stats
        WHERE stat_type = 'Rushing' AND season = 2024 AND rush_yards IS NOT NULL
        ORDER BY rush_yards DESC LIMIT 25`
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows.slice(0, 15)
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      break
    }

    case 'receiving-yards-leaders': {
      const rows = await sql`
        SELECT player_name AS name, recv_yards AS value
        FROM player_season_stats
        WHERE stat_type = 'Receiving' AND season = 2024 AND recv_yards IS NOT NULL
        ORDER BY recv_yards DESC LIMIT 25`
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows.slice(0, 15)
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      break
    }

    case 'passing-tds-leaders': {
      const rows = await sql`
        SELECT player_name AS name, pass_tds AS value
        FROM player_season_stats
        WHERE stat_type = 'Passing' AND season = 2024 AND pass_tds IS NOT NULL
        ORDER BY pass_tds DESC LIMIT 25`
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows.slice(0, 15)
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      break
    }

    case 'rushing-tds-leaders': {
      const rows = await sql`
        SELECT player_name AS name, rush_tds AS value
        FROM player_season_stats
        WHERE stat_type = 'Rushing' AND season = 2024 AND rush_tds IS NOT NULL
        ORDER BY rush_tds DESC LIMIT 25`
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows.slice(0, 15)
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      break
    }

    case 'win-pct-trend': {
      const rows = await sql`
        SELECT t.division, s.season::text AS name,
          ROUND(AVG(s.overall_wins::float / NULLIF(s.overall_wins + s.overall_losses, 0)) * 100, 1)::float AS value
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug
        WHERE s.season IN (2022, 2023, 2024) AND s.overall_wins + s.overall_losses > 0
        GROUP BY t.division, s.season
        ORDER BY s.season, t.division`
      const seasons = ['2022', '2023', '2024']
      multiPoints = seasons.map(yr => {
        const pt: MultiRow = { name: yr }
        for (const r of rows) {
          if (r.name === yr) {
            pt[r.division as string] = Number(r.value)
          }
        }
        return pt
      })
      tableRows = rows.map(r => ({ name: `Div ${r.division as string} ${r.name as string}`, value: Number(r.value) }))
      kpiValue = 3
      break
    }

    case 'completions-leaders': {
      const rows = await sql`
        SELECT player_name AS name, completions AS value
        FROM player_season_stats
        WHERE stat_type = 'Passing' AND season = 2024 AND completions IS NOT NULL
        ORDER BY completions DESC LIMIT 25`
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows.slice(0, 15)
      kpiValue = tableRows.length > 0 ? tableRows[0].value : 0
      break
    }

    default:
      notFound()
  }

  return (
    <ChartDetailPage
      config={config!}
      prevSlug={prevSlug}
      nextSlug={nextSlug}
      kpiValue={kpiValue}
      tableRows={tableRows}
      chartPoints={chartPoints}
      multiPoints={multiPoints}
      scatterPoints={scatterPoints}
    />
  )
}
