import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { sql } from '@/lib/db'
import { PLAYER_PHOTOS, SCHOOL_LOGOS, TEAM_PHOTOS } from '@/lib/team-images'
import { ACCENT_COLOR } from '@/lib/app-config'
import { formatSeason } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function fmtVal(v: unknown) {
  if (v == null) return '—'
  const n = Number(v)
  return isNaN(n) ? '—' : n % 1 === 0 ? String(n) : n.toFixed(1)
}

export default async function PlayerPanelPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>
}) {
  const { slug } = await params

  const [playerRows, statRows] = await Promise.all([
    sql`
      SELECT p.slug, p.name, p.position, p.school_slug,
        t.name AS team_name, t.division, t.slug AS team_slug
      FROM players p
      LEFT JOIN teams t ON t.school_slug = p.school_slug AND t.level = 'Varsity'
      WHERE p.slug = ${slug}
      LIMIT 1
    `,
    sql`
      SELECT stat_type, season, pass_yards, pass_tds, interceptions,
        completions, attempts, rush_yards, rush_tds, recv_yards, recv_tds,
        receptions, games_played
      FROM player_season_stats
      WHERE player_slug = ${slug}
      ORDER BY season DESC
    `,
  ])

  if (!playerRows[0]) notFound()

  const player     = playerRows[0]
  const schoolSlug = player.school_slug as string
  const teamName   = (player.team_name as string | null)?.replace(/\s+Varsity\s+Football$/i, '') ?? ''
  const photo      = PLAYER_PHOTOS[slug]
  const teamPhoto  = TEAM_PHOTOS[schoolSlug]?.[0]
  const heroSrc    = photo ?? teamPhoto ?? null
  const logo       = SCHOOL_LOGOS[schoolSlug]

  // Group stats by type, keep most recent season per type
  const byType: Record<string, typeof statRows[0][]> = {}
  for (const r of statRows) {
    const t = r.stat_type as string
    if (!byType[t]) byType[t] = []
    byType[t].push(r)
  }

  const STAT_SECTIONS: { type: string; label: string; cols: { key: string; label: string }[] }[] = [
    {
      type: 'Passing', label: 'Passing',
      cols: [
        { key: 'pass_yards', label: 'YDS' },
        { key: 'attempts', label: 'ATT' },
        { key: 'completions', label: 'COMP' },
        { key: 'pass_tds', label: 'TD' },
        { key: 'interceptions', label: 'INT' },
      ],
    },
    {
      type: 'Rushing', label: 'Rushing',
      cols: [
        { key: 'rush_yards', label: 'YDS' },
        { key: 'rush_tds', label: 'TD' },
        { key: 'games_played', label: 'GP' },
      ],
    },
    {
      type: 'Receiving', label: 'Receiving',
      cols: [
        { key: 'recv_yards', label: 'YDS' },
        { key: 'receptions', label: 'REC' },
        { key: 'recv_tds', label: 'TD' },
      ],
    },
  ]

  const activeSections = STAT_SECTIONS.filter(s => byType[s.type]?.length)

  const th = 'py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] text-right first:text-left first:pl-0 pr-0'
  const td = 'py-2.5 text-sm tabular-nums text-right text-[var(--txt)] first:text-left first:pl-0 pr-0'

  return (
    <div className="flex flex-col">

      {/* Hero photo */}
      {heroSrc && (
        <div className="relative w-full aspect-[16/9] overflow-hidden shrink-0">
          <Image src={heroSrc} alt={player.name as string} fill className="object-cover" unoptimized />
        </div>
      )}

      {/* Identity */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
        {logo && (
          <Image src={logo} alt="" width={36} height={36}
            className="shrink-0 rounded-full bg-white border border-[var(--border)] object-contain p-0.5" unoptimized />
        )}
        <div>
          <p className="text-sm font-bold text-[var(--txt)]">{player.name as string}</p>
          <p className="text-xs text-[var(--muted)]">
            {teamName}{player.division ? ` · Division ${player.division}` : ''}
          </p>
        </div>
      </div>

      {/* Career stats by type */}
      {activeSections.map(section => (
        <div key={section.type} className="px-5 pt-4 pb-2 border-b border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">{section.label}</p>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th className={th}>Season</th>
                  {section.cols.map(c => <th key={c.key} className={th}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {byType[section.type].map((r, i) => (
                  <tr key={i}>
                    <td className={td}>{formatSeason(r.season as number)}</td>
                    {section.cols.map(c => (
                      <td key={c.key} className={td}
                        style={c.key.includes('yards') ? { color: ACCENT_COLOR, fontWeight: 700 } : undefined}>
                        {fmtVal(r[c.key as keyof typeof r])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* View full profile */}
      <div className="px-5 py-4">
        <Link
          href={`/player/${slug}`}
          className="flex items-center justify-between text-sm font-semibold hover:underline"
          style={{ color: ACCENT_COLOR }}
        >
          <span>View full profile</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

    </div>
  )
}
