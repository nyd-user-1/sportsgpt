import { fetchSectionSchools, type HexSchool } from '@/lib/section-schools'
import { Honeycomb } from './Honeycomb'

export const dynamic = 'force-dynamic'

export default async function HoneycombPage() {
  let schools: HexSchool[] = []
  try {
    schools = await fetchSectionSchools()
  } catch { /* DB not connected */ }

  return <Honeycomb schools={schools} />
}
