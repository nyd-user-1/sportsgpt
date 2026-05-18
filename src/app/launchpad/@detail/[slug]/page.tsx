import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { sql } from '@/lib/db'
import { TEAM_PHOTOS, SCHOOL_LOGOS } from '@/lib/team-images'

export const dynamic = 'force-dynamic'

function cleanName(name: string) {
  return name.replace(/\s+Varsity\s+Football$/i, '')
}

export default async function TeamDetailSlot({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const rows = await sql`
    SELECT t.*, s.overall_wins, s.overall_losses
    FROM teams t
    LEFT JOIN team_season_stats s ON s.team_slug = t.slug AND s.season = 2024
    WHERE t.slug = ${slug}
  `
  const team = rows[0]
  if (!team) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-[var(--muted)]">Select a team</p>
      </div>
    )
  }

  const schoolSlug = (team.school_slug as string) ?? slug.replace(/-varsity-football$/, '')
  const photo      = TEAM_PHOTOS[schoolSlug]?.[0]
  const logo       = SCHOOL_LOGOS[schoolSlug]
  const teamName   = cleanName(team.name as string)
  const division   = team.division as string
  const wins       = team.overall_wins  != null ? Number(team.overall_wins)  : null
  const losses     = team.overall_losses != null ? Number(team.overall_losses) : null

  return (
    <div className="h-full relative overflow-hidden">
      {photo ? (
        <>
          <Image src={photo} alt={teamName} fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        </>
      ) : (
        <div className="h-full bg-gradient-to-br from-[#023882] to-[#0a52c7]" />
      )}

      {/* Bottom overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {logo && (
            <Image src={logo} alt="" width={36} height={36}
              className="shrink-0 rounded-full bg-white/90 p-0.5 object-contain" unoptimized />
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-snug truncate">{teamName}</p>
            <p className="text-xs text-white/70">Section XI · Division {division}</p>
          </div>
        </div>

        {/* Arrow link to full detail page */}
        <Link href={`/team/${slug}`}
          className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-sm transition-colors">
          <ArrowUpRight className="h-4 w-4 text-white" />
        </Link>
      </div>
    </div>
  )
}
