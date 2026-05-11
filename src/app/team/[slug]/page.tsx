import { notFound } from 'next/navigation'
import { TeamShell } from './Shell'
import { PLACEHOLDER_TEAMS, toSlug } from '@/lib/placeholder-data'

export const dynamic = 'force-dynamic'

export default async function TeamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Find team by slug — first from placeholder, then DB when connected
  let team = PLACEHOLDER_TEAMS.find(t => toSlug(t.name) === slug)
  let allTeams = PLACEHOLDER_TEAMS

  // TODO: when DB is connected, replace with:
  // const rows = await sql`SELECT * FROM teams`
  // team = rows.find(r => toSlug(r.name as string) === slug)
  // allTeams = rows.map(r => ({ ... }))

  if (!team) notFound()

  const sorted = [...allTeams].sort((a, b) => b.wins - a.wins || b.pf - a.pf)
  const idx    = sorted.findIndex(t => t.id === team!.id)
  const n      = sorted.length
  const prev   = sorted[(idx - 1 + n) % n]
  const next   = sorted[(idx + 1) % n]

  const divisionTeams = allTeams.filter(t => t.division === team!.division)

  return (
    <TeamShell
      team={team}
      prevSlug={toSlug(prev.name)}
      nextSlug={toSlug(next.name)}
      divisionTeams={divisionTeams}
    />
  )
}
