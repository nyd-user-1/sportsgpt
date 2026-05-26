import { fetchChartLeaders } from '@/lib/chart-leaders'
import { ChartsAlmanac } from './ChartsAlmanac'

export const dynamic = 'force-dynamic'

export default async function ChartsAlmanacPage() {
  const chartSchools = await fetchChartLeaders()
  return <ChartsAlmanac chartSchools={chartSchools} />
}
