import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { sql } from '@/lib/db'
import { PLAYER_PHOTOS, SCHOOL_LOGOS, TEAM_PHOTOS } from '@/lib/team-images'
import { formatSeason } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const SANS  = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }
const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' }
const MONO  = { fontFamily: 'var(--font-mono, ui-monospace), monospace' }

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

  // Group stats by type
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
        { key: 'pass_yards',    label: 'YDS'  },
        { key: 'attempts',      label: 'ATT'  },
        { key: 'completions',   label: 'COMP' },
        { key: 'pass_tds',      label: 'TD'   },
        { key: 'interceptions', label: 'INT'  },
      ],
    },
    {
      type: 'Rushing', label: 'Rushing',
      cols: [
        { key: 'rush_yards', label: 'YDS' },
        { key: 'rush_tds',   label: 'TD'  },
        { key: 'games_played', label: 'GP' },
      ],
    },
    {
      type: 'Receiving', label: 'Receiving',
      cols: [
        { key: 'recv_yards',  label: 'YDS' },
        { key: 'receptions',  label: 'REC' },
        { key: 'recv_tds',    label: 'TD'  },
      ],
    },
  ]

  const activeSections = STAT_SECTIONS.filter(s => byType[s.type]?.length)

  return (
    <div className="flex flex-col">

      {/* Hero photo — full bleed */}
      {heroSrc && (
        <div className="relative w-full aspect-[16/9] overflow-hidden shrink-0">
          <Image src={heroSrc} alt={player.name as string} fill className="object-cover" unoptimized />
        </div>
      )}

      {/* Identity */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--paper-rule)]">
        {logo
          ? <Image src={logo} alt="" width={36} height={36}
              className="shrink-0 rounded-full object-contain border border-[var(--paper-rule)]"
              style={{ background: 'var(--paper-quiet)' }} unoptimized />
          : <div className="shrink-0 w-9 h-9 rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)]" />
        }
        <div>
          <p
            className="leading-snug text-[var(--paper-text)]"
            style={{ ...SERIF, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}
          >
            {player.name as string}
          </p>
          <p className="text-[11.5px] text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>
            {teamName}{player.division ? ` · Division ${player.division}` : ''}
          </p>
        </div>
      </div>

      {/* Stat sections */}
      {activeSections.map(section => (
        <div key={section.type} className="border-b border-[var(--paper-rule)]">
          {/* Section header */}
          <div className="px-5 pt-5 pb-2">
            <span
              className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]"
              style={SANS}
            >
              {section.label}
            </span>
          </div>

          {/* Table */}
          <div className="px-5 pb-4 overflow-x-auto no-scrollbar">
            <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th
                    className="pb-2 text-left text-[10px] uppercase tracking-[0.18em] text-[var(--paper-faint)]"
                    style={SANS}
                  >
                    Season
                  </th>
                  {section.cols.map(c => (
                    <th
                      key={c.key}
                      className="pb-2 text-right text-[10px] uppercase tracking-[0.18em] text-[var(--paper-faint)]"
                      style={SANS}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byType[section.type].map((r, i) => (
                  <tr key={i} className="border-t border-[var(--paper-rule-soft)]">
                    <td
                      className="py-2.5 text-left text-[12px] text-[var(--paper-muted)]"
                      style={SANS}
                    >
                      {formatSeason(r.season as number)}
                    </td>
                    {section.cols.map(c => (
                      <td
                        key={c.key}
                        className="py-2.5 text-right text-[13px] tabular-nums text-[var(--paper-text)]"
                        style={MONO}
                      >
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
          className="flex items-center justify-between text-sm font-medium hover:underline text-[var(--paper-strong)]"
          style={SANS}
        >
          <span>View full profile</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

    </div>
  )
}
