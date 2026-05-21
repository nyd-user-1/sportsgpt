'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, ArrowUpRight } from 'lucide-react'
import { SCHOOL_LOGOS, TEAM_PHOTOS, PLAYER_PHOTOS } from '@/lib/team-images'
import { ACCENT_COLOR } from '@/lib/app-config'
import { cn } from '@/lib/utils'
import { AppPanel } from '@/components/AppPanel'

// ── Types ─────────────────────────────────────────────────────────────────────

export type GamePanelData = {
  game: {
    id: number
    season: number
    game_number: number | null
    game_date: string | null
    home_team_slug: string
    away_team_slug: string
    home_school: string
    away_school: string
    home_name: string
    away_name: string
    home_score: number | null
    away_score: number | null
  }
  quarterRows: { team_slug: string; q1: number; q2: number; q3: number; q4: number; ot1: number; final: number }[]
  playerStats: {
    player_name: string
    player_slug: string | null
    school_slug: string
    team_name: string
    stat_type: string
    rush_yds: number | null; rush_att: number | null; rush_tds: number | null
    pass_yds: number | null; pass_comp: number | null; pass_att: number | null; pass_tds: number | null; pass_int: number | null
    rec_yds: number | null; rec_rec: number | null; rec_tds: number | null
  }[]
  narrative: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number | null): string { return v == null ? '—' : String(v) }

function fmtDate(raw: string | null) {
  if (!raw) return null
  const d = new Date(raw + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ── AccordionStatTable (same pattern as PanelPlayer/PanelTeam) ────────────────

function AccordionStatTable({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <div className="mx-3 mb-3 mt-2 rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 h-[46px] transition-colors bg-[var(--surface)] hover:bg-[var(--inp-bg)]"
      >
        <span className="text-sm font-bold text-[var(--txt)]">{title}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-[var(--muted)] transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
          {children}
        </div>
      )}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-sm tabular-nums font-medium text-[var(--txt)]">{value}</span>
    </div>
  )
}

// ── GameHero ──────────────────────────────────────────────────────────────────

function GameHero({ game }: { game: GamePanelData['game'] }) {
  const homePhoto = TEAM_PHOTOS[game.home_school]?.[0]
  const awayPhoto = TEAM_PHOTOS[game.away_school]?.[0]
  const scored = game.home_score != null && game.away_score != null

  return (
    <div className="relative mx-3 mt-3 mb-1 h-[180px] rounded-xl overflow-hidden bg-[var(--inp-bg)]">
      <div className="absolute inset-0 flex">
        <div className="relative flex-1">
          {homePhoto
            ? <><Image src={homePhoto} alt={game.home_name} fill className="object-cover" unoptimized /><div className="absolute inset-0 bg-gradient-to-r from-black/10 to-black/60" /></>
            : <div className="h-full" style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}28, ${ACCENT_COLOR}55)` }} />}
        </div>
        <div className="relative flex-1">
          {awayPhoto
            ? <><Image src={awayPhoto} alt={game.away_name} fill className="object-cover" unoptimized /><div className="absolute inset-0 bg-gradient-to-l from-black/10 to-black/60" /></>
            : <div className="h-full bg-[var(--bg2)]" />}
        </div>
      </div>
      <div className="absolute inset-0 bg-black/35" />
      {game.game_number != null && (
        <div className="absolute top-2.5 left-3 z-10">
          <span className="text-xs font-semibold text-black bg-white rounded-full px-2.5 py-0.5">Week {game.game_number}</span>
        </div>
      )}
      {fmtDate(game.game_date) && (
        <div className="absolute top-2.5 right-3 z-10">
          <span className="text-xs text-white/60">{fmtDate(game.game_date)}</span>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        {scored
          ? <p className="text-5xl font-black text-white tabular-nums leading-none drop-shadow-lg">{game.home_score} – {game.away_score}</p>
          : <p className="text-lg text-white/50">vs</p>}
      </div>
    </div>
  )
}

// ── GameInfoBar (sticky) ──────────────────────────────────────────────────────

function GameInfoBar({ game }: { game: GamePanelData['game'] }) {
  const homeLogo = SCHOOL_LOGOS[game.home_school]
  const awayLogo = SCHOOL_LOGOS[game.away_school]
  const scored   = game.home_score != null && game.away_score != null
  const homeWon  = scored && game.home_score! > game.away_score!

  return (
    <div className="sticky top-0 z-10 border-b border-[var(--border)] flex items-center gap-2 px-3 py-2.5 bg-[var(--surface)]">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {homeLogo && <Image src={homeLogo} alt={game.home_name} width={28} height={28} className="rounded-full object-contain bg-white border border-[var(--border)] shrink-0" unoptimized />}
        <span className={cn('text-sm font-semibold truncate', homeWon ? 'text-[var(--txt)]' : 'text-[var(--muted)]')}>{game.home_name}</span>
      </div>
      {scored && (
        <span className="text-sm font-black tabular-nums text-[var(--txt)] shrink-0 px-2">{game.home_score} – {game.away_score}</span>
      )}
      <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
        <span className={cn('text-sm font-semibold truncate', !homeWon && scored ? 'text-[var(--txt)]' : 'text-[var(--muted)]')}>{game.away_name}</span>
        {awayLogo && <Image src={awayLogo} alt={game.away_name} width={28} height={28} className="rounded-full object-contain bg-white border border-[var(--border)] shrink-0" unoptimized />}
      </div>
    </div>
  )
}

// ── BoxScore ──────────────────────────────────────────────────────────────────

function BoxScore({ game, quarterRows }: { game: GamePanelData['game']; quarterRows: GamePanelData['quarterRows'] }) {
  if (!quarterRows.length) return null
  return (
    <AccordionStatTable title="Box Score">
      <div className="px-4 py-2">
        <div className="grid grid-cols-7 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">
          <span className="col-span-2">Team</span>
          <span className="text-center">Q1</span>
          <span className="text-center">Q2</span>
          <span className="text-center">Q3</span>
          <span className="text-center">Q4</span>
          <span className="text-center">F</span>
        </div>
        {quarterRows.map(r => {
          const isHome = r.team_slug === game.home_team_slug
          const name   = isHome ? game.home_name : game.away_name
          const logo   = SCHOOL_LOGOS[isHome ? game.home_school : game.away_school]
          const final  = isHome ? game.home_score : game.away_score
          return (
            <div key={r.team_slug} className="grid grid-cols-7 items-center py-1.5">
              <div className="col-span-2 flex items-center gap-1.5 min-w-0">
                {logo && <Image src={logo} alt={name} width={18} height={18} className="rounded-full object-contain bg-white shrink-0" unoptimized />}
                <span className="text-xs font-medium text-[var(--txt)] truncate">{name}</span>
              </div>
              <span className="text-xs tabular-nums text-center text-[var(--muted)]">{r.q1}</span>
              <span className="text-xs tabular-nums text-center text-[var(--muted)]">{r.q2}</span>
              <span className="text-xs tabular-nums text-center text-[var(--muted)]">{r.q3}</span>
              <span className="text-xs tabular-nums text-center text-[var(--muted)]">{r.q4}</span>
              <span className="text-xs tabular-nums text-center font-semibold text-[var(--txt)]">{final ?? '—'}</span>
            </div>
          )
        })}
      </div>
    </AccordionStatTable>
  )
}

// ── PlayerGameCard (shown in second AppPanel when row is clicked) ─────────────

function PlayerGameCard({ p }: { p: GamePanelData['playerStats'][0] }) {
  const photo     = p.player_slug ? PLAYER_PHOTOS[p.player_slug] : undefined
  const teamPhoto = TEAM_PHOTOS[p.school_slug]?.[0]
  const logo      = SCHOOL_LOGOS[p.school_slug]
  const heroSrc   = photo || teamPhoto
  const shortTeam = p.team_name.replace(/\s+Varsity\s+Football$/i, '')

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="relative mx-3 mt-3 mb-1 h-[200px] rounded-xl overflow-hidden bg-[var(--inp-bg)]">
        {heroSrc
          ? <Image src={heroSrc} alt={p.player_name} fill className="object-cover object-top" unoptimized />
          : <div className="h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}18, ${ACCENT_COLOR}40)` }}>
              {logo && <Image src={logo} alt="" width={56} height={56} className="object-contain opacity-50" unoptimized />}
            </div>}
      </div>
      <div className="sticky top-0 z-10 border-b border-[var(--border)] flex items-center gap-2.5 px-3 py-2.5 bg-[var(--surface)]">
        {logo && <Image src={logo} alt={shortTeam} width={34} height={34} className="rounded-full object-contain bg-white border border-[var(--border)] shrink-0" unoptimized />}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-[var(--txt)] leading-snug truncate">{p.player_name}</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">{shortTeam} · {p.stat_type}</p>
        </div>
      </div>
      <div className="mx-3 my-3 rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
        <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)] bg-[var(--surface)]">This Game</div>
        <div className="divide-y divide-[var(--border)]">
          {p.stat_type === 'Passing' && <>
            <div className="flex justify-between px-4 py-2.5"><span className="text-sm text-[var(--muted)]">YDS</span><span className="text-sm tabular-nums font-medium text-[var(--txt)]">{fmt(p.pass_yds)}</span></div>
            <div className="flex justify-between px-4 py-2.5"><span className="text-sm text-[var(--muted)]">COMP/ATT</span><span className="text-sm tabular-nums font-medium text-[var(--txt)]">{fmt(p.pass_comp)}/{fmt(p.pass_att)}</span></div>
            <div className="flex justify-between px-4 py-2.5"><span className="text-sm text-[var(--muted)]">TD</span><span className="text-sm tabular-nums font-medium text-[var(--txt)]">{fmt(p.pass_tds)}</span></div>
            <div className="flex justify-between px-4 py-2.5"><span className="text-sm text-[var(--muted)]">INT</span><span className="text-sm tabular-nums font-medium text-[var(--txt)]">{fmt(p.pass_int)}</span></div>
          </>}
          {p.stat_type === 'Rushing' && <>
            <div className="flex justify-between px-4 py-2.5"><span className="text-sm text-[var(--muted)]">YDS</span><span className="text-sm tabular-nums font-medium text-[var(--txt)]">{fmt(p.rush_yds)}</span></div>
            <div className="flex justify-between px-4 py-2.5"><span className="text-sm text-[var(--muted)]">ATT</span><span className="text-sm tabular-nums font-medium text-[var(--txt)]">{fmt(p.rush_att)}</span></div>
            <div className="flex justify-between px-4 py-2.5"><span className="text-sm text-[var(--muted)]">TD</span><span className="text-sm tabular-nums font-medium text-[var(--txt)]">{fmt(p.rush_tds)}</span></div>
          </>}
          {p.stat_type === 'Receiving' && <>
            <div className="flex justify-between px-4 py-2.5"><span className="text-sm text-[var(--muted)]">YDS</span><span className="text-sm tabular-nums font-medium text-[var(--txt)]">{fmt(p.rec_yds)}</span></div>
            <div className="flex justify-between px-4 py-2.5"><span className="text-sm text-[var(--muted)]">REC</span><span className="text-sm tabular-nums font-medium text-[var(--txt)]">{fmt(p.rec_rec)}</span></div>
            <div className="flex justify-between px-4 py-2.5"><span className="text-sm text-[var(--muted)]">TD</span><span className="text-sm tabular-nums font-medium text-[var(--txt)]">{fmt(p.rec_tds)}</span></div>
          </>}
        </div>
      </div>
      {p.player_slug && (
        <div className="px-4 py-3 border-t border-[var(--border)]">
          <Link href={`/player/${p.player_slug}`} className="flex items-center justify-between text-sm font-semibold hover:underline" style={{ color: ACCENT_COLOR }}>
            <span>View full profile</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

// ── PlayerStats ───────────────────────────────────────────────────────────────

function PlayerStatRow({ p, onRowClick }: { p: GamePanelData['playerStats'][0]; onRowClick: (p: GamePanelData['playerStats'][0]) => void }) {
  const logo = SCHOOL_LOGOS[p.school_slug]
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-[var(--inp-bg)] transition-colors"
      onClick={() => onRowClick(p)}
    >
      {logo && <Image src={logo} alt="" width={20} height={20} className="rounded-full object-contain bg-white shrink-0" unoptimized />}
      <div className="flex-1 min-w-0">
        {p.player_slug
          ? <Link href={`/player/${p.player_slug}`} onClick={e => e.stopPropagation()} className="text-sm font-medium text-[var(--txt)] hover:text-sky-500 transition-colors truncate block">{p.player_name}</Link>
          : <p className="text-sm font-medium text-[var(--txt)] truncate">{p.player_name}</p>}
        <p className="text-xs text-[var(--muted)] truncate">{p.team_name.replace(/\s+Varsity\s+Football$/i, '')}</p>
      </div>
      <span className="text-xs tabular-nums text-[var(--muted)] shrink-0">
        {p.stat_type === 'Passing'   && `${fmt(p.pass_yds)} yds · ${fmt(p.pass_tds)} TD`}
        {p.stat_type === 'Rushing'   && `${fmt(p.rush_yds)} yds · ${fmt(p.rush_tds)} TD`}
        {p.stat_type === 'Receiving' && `${fmt(p.rec_yds)} yds · ${fmt(p.rec_tds)} TD`}
      </span>
    </div>
  )
}

function PlayerStats({ playerStats, onRowClick }: { playerStats: GamePanelData['playerStats']; onRowClick: (p: GamePanelData['playerStats'][0]) => void }) {
  const passing   = playerStats.filter(p => p.stat_type === 'Passing').slice(0, 3)
  const rushing   = playerStats.filter(p => p.stat_type === 'Rushing').slice(0, 3)
  const receiving = playerStats.filter(p => p.stat_type === 'Receiving').slice(0, 3)

  if (!passing.length && !rushing.length && !receiving.length) return null

  return (
    <>
      {passing.length > 0 && (
        <AccordionStatTable title="Passing">
          {passing.map((p, i) => <PlayerStatRow key={i} p={p} onRowClick={onRowClick} />)}
        </AccordionStatTable>
      )}
      {rushing.length > 0 && (
        <AccordionStatTable title="Rushing">
          {rushing.map((p, i) => <PlayerStatRow key={i} p={p} onRowClick={onRowClick} />)}
        </AccordionStatTable>
      )}
      {receiving.length > 0 && (
        <AccordionStatTable title="Receiving">
          {receiving.map((p, i) => <PlayerStatRow key={i} p={p} onRowClick={onRowClick} />)}
        </AccordionStatTable>
      )}
    </>
  )
}

// ── Narrative ─────────────────────────────────────────────────────────────────

function Narrative({ text }: { text: string }) {
  const paragraphs = text.split(/\n+/).filter(Boolean)
  return (
    <AccordionStatTable title="Game Recap" defaultOpen={true}>
      <div className="px-4 py-3 space-y-2">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm text-[var(--muted)] leading-relaxed">{p.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
        ))}
      </div>
    </AccordionStatTable>
  )
}

// ── GamePanelContent ──────────────────────────────────────────────────────────

export function GamePanelContent({ game, quarterRows, playerStats, narrative }: GamePanelData) {
  const [selectedPlayer, setSelectedPlayer] = React.useState<GamePanelData['playerStats'][0] | null>(null)

  return (
    <>
      <AppPanel
        open={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        title={selectedPlayer?.player_name ?? ''}
        detailHref={selectedPlayer?.player_slug ? `/player/${selectedPlayer.player_slug}` : undefined}
        bodyClass="flex flex-col"
      >
        {selectedPlayer && <PlayerGameCard p={selectedPlayer} />}
      </AppPanel>

      <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="pt-2">
        <BoxScore game={game} quarterRows={quarterRows} />
        <PlayerStats playerStats={playerStats} onRowClick={setSelectedPlayer} />
        {narrative && <Narrative text={narrative} />}
      </div>
      <div className="px-4 py-3 border-t border-[var(--border)] mt-1">
        <Link
          href={`/game/${game.id}`}
          className="flex items-center justify-between text-sm font-semibold hover:underline"
          style={{ color: ACCENT_COLOR }}
        >
          <span>View full game</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
    </>
  )
}
