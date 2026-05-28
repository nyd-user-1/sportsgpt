'use client'

import Image from 'next/image'
import { Building2, School as SchoolIcon, Swords, ArrowUpRight } from 'lucide-react'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { formatSeason } from '@/lib/utils'
import type { Result, SearchData } from '@/lib/search'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono), ui-monospace, monospace' }

// A "related entity" the hub links to. `result` is the underlying search Result
// (so callers can navigate or turn it into a chat prompt with the same shape).
export type HubLink = { label: string; sublabel?: string; icon: 'team' | 'school' | 'game'; result: Result }

export type PlayerHub = {
  player: Result          // the dominant player (name, "QB · Hills West", schoolSlug)
  team: HubLink | null
  school: HubLink | null
  games: HubLink[]
}

// Build the hub model from a dominant player Result + the loaded search data.
// Games are the player's TEAM's recent games (the search payload has no
// per-player game log), so they're labelled honestly as the team's games.
export function buildPlayerHub(player: Result, data: SearchData, maxGames = 4): PlayerHub {
  const schoolSlug = player.schoolSlug
  if (!schoolSlug) return { player, team: null, school: null, games: [] }

  const teamRow = data.teams.find(t => t.school_slug === schoolSlug)
  const schoolRow = data.schools.find(s => s.slug === schoolSlug)
  const teamName = teamRow ? teamRow.name.replace(/\s+Varsity\s+Football$/i, '') : (schoolRow?.name ?? '')

  const team: HubLink | null = teamRow ? {
    label: teamName,
    sublabel: teamRow.division ? `Division ${teamRow.division}` : undefined,
    icon: 'team',
    result: { key: `team-${teamRow.slug}`, type: 'team', name: teamName, displayName: teamName, subtitle: teamRow.division ? `Division ${teamRow.division}` : undefined, href: `/team/${teamRow.slug}`, schoolSlug, score: 0 },
  } : null

  const school: HubLink | null = schoolRow ? {
    label: schoolRow.name,
    sublabel: 'School profile',
    icon: 'school',
    result: { key: `school-${schoolRow.slug}`, type: 'school', name: schoolRow.name, displayName: schoolRow.name, href: `/school/${schoolRow.slug}`, score: 0 },
  } : null

  // Games where this player's team appears (home or away), newest-first
  // (data.games arrives newest-first), capped.
  const games: HubLink[] = []
  for (const g of data.games) {
    if (g.home_school !== schoolSlug && g.away_school !== schoolSlug) continue
    const matchup = `${g.home_name} vs ${g.away_name}`
    const display = g.home_score != null && g.away_score != null
      ? `${g.home_name} ${g.home_score}, ${g.away_name} ${g.away_score}`
      : matchup
    games.push({
      label: display,
      sublabel: formatSeason(g.season),
      icon: 'game',
      result: { key: `game-${g.id}`, type: 'game', name: matchup, displayName: display, subtitle: formatSeason(g.season), href: `/game/${g.id}`, schoolSlug: g.home_school ?? undefined, score: 0 },
    })
    if (games.length >= maxGames) break
  }

  return { player, team, school, games }
}

const ICON = { team: Building2, school: SchoolIcon, game: Swords }

function HubRow({ link, onAct }: { link: HubLink; onAct: (r: Result) => void }) {
  const Icon = ICON[link.icon]
  const logo = link.result.schoolSlug ? SCHOOL_LOGOS[link.result.schoolSlug] : undefined
  return (
    <button
      onClick={() => onAct(link.result)}
      className="group/hubrow w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-[2px] hover:bg-[var(--paper-quiet)] transition-colors"
    >
      <div className="w-7 h-7 shrink-0 flex items-center justify-center overflow-hidden rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)]">
        {logo ? <Image src={logo} alt="" width={20} height={20} className="object-contain" unoptimized /> : <Icon className="h-3.5 w-3.5 text-[var(--paper-faint)]" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[var(--paper-text)] group-hover/hubrow:text-[var(--paper-strong)] transition-colors" style={{ ...SERIF, fontSize: 14, fontWeight: 500 }}>{link.label}</p>
        {link.sublabel && <p className="truncate text-[11px] text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>{link.sublabel}</p>}
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 text-[var(--paper-faint)] shrink-0 opacity-0 group-hover/hubrow:opacity-100 transition-opacity" />
    </button>
  )
}

// The dossier card shown above search results when one player clearly dominates
// the query. `onAct` navigates (search) or fires a prompt (chat).
export function PlayerHubCard({ hub, onActPlayer, onAct }: {
  hub: PlayerHub
  onActPlayer: (r: Result) => void
  onAct: (r: Result) => void
}) {
  const { player, team, school, games } = hub
  const logo = player.schoolSlug ? SCHOOL_LOGOS[player.schoolSlug] : undefined

  return (
    <div className="border border-[var(--paper-rule)] rounded-[3px] overflow-hidden">
      {/* Header — click → player profile / prompt */}
      <button
        onClick={() => onActPlayer(player)}
        className="group/hub w-full flex items-center gap-4 px-5 py-4 text-left border-b border-[var(--paper-rule)] hover:bg-[var(--paper-quiet)] transition-colors"
      >
        <div className="w-12 h-12 shrink-0 flex items-center justify-center overflow-hidden rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)]">
          {logo ? <Image src={logo} alt="" width={34} height={34} className="object-contain" unoptimized /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-[0.28em] text-[var(--paper-faint)] mb-0.5" style={SANS}>Player</p>
          <p className="truncate text-[var(--paper-text)] group-hover/hub:text-[var(--paper-strong)] transition-colors" style={{ ...SERIF, fontSize: 'clamp(1.25rem, 2.4vw, 1.6rem)', fontWeight: 500, letterSpacing: '-0.01em' }}>
            {player.displayName}
          </p>
          {player.subtitle && <p className="truncate text-[13px] text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>{player.subtitle}</p>}
        </div>
        <ArrowUpRight className="h-4 w-4 text-[var(--paper-faint)] shrink-0 opacity-0 group-hover/hub:opacity-100 transition-opacity" />
      </button>

      {/* Related — team, school, recent team games */}
      <div className="px-2 py-2">
        {team && <HubRow link={team} onAct={onAct} />}
        {school && <HubRow link={school} onAct={onAct} />}
        {games.length > 0 && (
          <>
            <p className="px-3 pt-3 pb-1.5 text-[9px] uppercase tracking-[0.28em] text-[var(--paper-faint)]" style={SANS}>
              Recent {team?.label ?? 'team'} games
            </p>
            {games.map(g => <HubRow key={g.result.key} link={g} onAct={onAct} />)}
          </>
        )}
      </div>
    </div>
  )
}
