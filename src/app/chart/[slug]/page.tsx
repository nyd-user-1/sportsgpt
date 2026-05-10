import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { getChartConfig, getAdjacentSlugs, CHART_CONFIGS } from '@/lib/chart-configs'
import { ChartDetailPage, type StdRow, type MultiRow, type ScatterRow } from '@/components/ChartDetailPage'

export async function generateStaticParams() {
  return CHART_CONFIGS.map(c => ({ slug: c.slug }))
}

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

    case 'providers-by-county': {
      const rows = await sql`
        SELECT county AS name, COUNT(*)::int AS value
        FROM facilities GROUP BY county ORDER BY value DESC
      `
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows.slice(0, 30)
      kpiValue = tableRows.reduce((s, r) => s + r.value, 0)
      break
    }

    case 'capacity-by-county': {
      const rows = await sql`
        SELECT county AS name, SUM(total_capacity)::int AS value
        FROM facilities GROUP BY county ORDER BY value DESC
      `
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows.slice(0, 30)
      kpiValue = tableRows.reduce((s, r) => s + r.value, 0)
      break
    }

    case 'program-types': {
      const LABELS: Record<string, string> = {
        DCC: 'Day Care Center (DCC)',
        FDC: 'Family Day Care (FDC)',
        GFDC: 'Group Family Day Care (GFDC)',
        SACC: 'School-Age Child Care (SACC)',
        SDCC: 'Small Day Care Center (SDCC)',
      }
      const rows = await sql`
        SELECT program_type AS name, COUNT(*)::int AS value
        FROM facilities GROUP BY program_type ORDER BY value DESC
      `
      tableRows = rows.map(r => ({
        name: LABELS[r.name as string] ?? r.name as string,
        value: Number(r.value),
      }))
      chartPoints = tableRows
      kpiValue = tableRows.reduce((s, r) => s + r.value, 0)
      break
    }

    case 'facilities-by-year': {
      const rows = await sql`
        SELECT EXTRACT(YEAR FROM facility_opened_date)::int AS yr, COUNT(*)::int AS value
        FROM facilities WHERE facility_opened_date IS NOT NULL
        GROUP BY yr ORDER BY yr
      `
      tableRows = rows.map(r => ({ name: String(r.yr), value: Number(r.value) }))
      chartPoints = tableRows
      kpiValue = tableRows.reduce((s, r) => s + r.value, 0)
      break
    }

    case 'age-group-capacity': {
      const [agg] = await sql`
        SELECT
          SUM(infant_capacity)::int     AS infant,
          SUM(toddler_capacity)::int    AS toddler,
          SUM(preschool_capacity)::int  AS preschool,
          SUM(school_age_capacity)::int AS school_age
        FROM facilities
      `
      tableRows = [
        { name: 'Infant',      value: Number(agg.infant) },
        { name: 'Toddler',     value: Number(agg.toddler) },
        { name: 'Preschool',   value: Number(agg.preschool) },
        { name: 'School-Age',  value: Number(agg.school_age) },
      ]
      chartPoints = tableRows
      kpiValue = tableRows.reduce((s, r) => s + r.value, 0)
      break
    }

    case 'facility-status': {
      const rows = await sql`
        SELECT COALESCE(facility_status, 'Unknown') AS name, COUNT(*)::int AS value
        FROM facilities GROUP BY facility_status ORDER BY value DESC
      `
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows
      kpiValue = tableRows.reduce((s, r) => s + r.value, 0)
      break
    }

    case 'license-expiration': {
      const rows = await sql`
        SELECT EXTRACT(YEAR FROM license_expiration_date)::int AS yr, COUNT(*)::int AS value
        FROM facilities
        WHERE license_expiration_date IS NOT NULL
          AND EXTRACT(YEAR FROM license_expiration_date) BETWEEN 2024 AND 2032
        GROUP BY yr ORDER BY yr
      `
      tableRows = rows.map(r => ({ name: String(r.yr), value: Number(r.value) }))
      chartPoints = tableRows
      kpiValue = tableRows.reduce((s, r) => s + r.value, 0)
      break
    }

    case 'infant-care-cost': {
      const rows = await sql`
        SELECT county_name AS name, mcinfant AS value
        FROM county_costs WHERE studyyear = 2022 AND mcinfant IS NOT NULL
        ORDER BY mcinfant DESC
      `
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows
      const vals = tableRows.map(r => r.value)
      kpiValue = vals.length ? vals.reduce((a, b) => a + b) / vals.length : 0
      break
    }

    case 'toddler-care-cost': {
      const rows = await sql`
        SELECT county_name AS name, mctoddler AS value
        FROM county_costs WHERE studyyear = 2022 AND mctoddler IS NOT NULL
        ORDER BY mctoddler DESC
      `
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows
      const vals = tableRows.map(r => r.value)
      kpiValue = vals.length ? vals.reduce((a, b) => a + b) / vals.length : 0
      break
    }

    case 'preschool-care-cost': {
      const rows = await sql`
        SELECT county_name AS name, mcpreschool AS value
        FROM county_costs WHERE studyyear = 2022 AND mcpreschool IS NOT NULL
        ORDER BY mcpreschool DESC
      `
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows
      const vals = tableRows.map(r => r.value)
      kpiValue = vals.length ? vals.reduce((a, b) => a + b) / vals.length : 0
      break
    }

    case 'household-income': {
      const rows = await sql`
        SELECT county_name AS name, mhi AS value
        FROM county_costs WHERE studyyear = 2022 AND mhi IS NOT NULL
        ORDER BY mhi DESC
      `
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows
      const vals = tableRows.map(r => r.value)
      kpiValue = vals.length ? vals.reduce((a, b) => a + b) / vals.length : 0
      break
    }

    case 'cost-trend': {
      const rows = await sql`
        SELECT studyyear::int AS yr, AVG(mcinfant) AS value
        FROM county_costs WHERE mcinfant IS NOT NULL
        GROUP BY studyyear ORDER BY studyyear
      `
      tableRows = rows.map(r => ({ name: String(r.yr), value: Number(r.value) }))
      chartPoints = tableRows
      const last = rows[rows.length - 1]
      kpiValue = last ? Number(last.value) : 0
      break
    }

    case 'center-vs-family': {
      const rows = await sql`
        SELECT studyyear::int AS yr, AVG(mcinfant) AS center, AVG(mfccinfant) AS family
        FROM county_costs WHERE mcinfant IS NOT NULL AND mfccinfant IS NOT NULL
        GROUP BY studyyear ORDER BY studyyear
      `
      multiPoints = rows.map(r => ({
        name: String(r.yr),
        center: Number(r.center),
        family: Number(r.family),
      } as unknown as MultiRow))
      const last = rows[rows.length - 1]
      kpiValue = last ? Math.abs(Number(last.center) - Number(last.family)) : 0
      break
    }

    case 'income-vs-cost': {
      const rows = await sql`
        SELECT county_name AS name, mhi AS x, mcinfant * 52 AS y
        FROM county_costs WHERE studyyear = 2022 AND mhi IS NOT NULL AND mcinfant IS NOT NULL
        ORDER BY county_name
      `
      scatterPoints = rows.map(r => ({
        name: r.name as string,
        x: Number(r.x),
        y: Number(r.y),
      }))
      kpiValue = scatterPoints.length
      break
    }

    case 'lfpr-by-county': {
      const rows = await sql`
        SELECT county_name AS name, flfpr_20to64_under6 AS value
        FROM county_costs WHERE studyyear = 2022 AND flfpr_20to64_under6 IS NOT NULL
        ORDER BY flfpr_20to64_under6 DESC
      `
      tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
      chartPoints = tableRows
      const vals = tableRows.map(r => r.value)
      kpiValue = vals.length ? vals.reduce((a, b) => a + b) / vals.length : 0
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
      chartPoints={chartPoints}
      multiPoints={multiPoints}
      scatterPoints={scatterPoints}
    />
  )
}
