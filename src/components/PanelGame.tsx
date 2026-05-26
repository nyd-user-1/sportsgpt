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

// ── Style tokens ──────────────────────────────────────────────────────────────

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono), ui-monospace, monospace' }

const TABLET_R = 3

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number | null): string { return v == null ? '—' : String(v) }

function fmtDate(raw: string | null) {
  if (!raw) return null
  const d = new Date(raw + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function cleanName(name: string) {
  return name.replace(/\s+Varsity\s+Football$/i, '')
}

// ── AccordionStatTable ───────────────────────────────────────────────────────

function AccordionStatTable({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <div
      className="mx-5 mb-3 mt-2 border border-[var(--paper-rule)] bg-[var(--paper-quiet)] overflow-hidden"
      style={{ borderRadius: TABLET_R }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 transition-colors hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)]"
      >
        <span
          className="text-[var(--paper-text)]"
          style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}
        >
          {title}
        </span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-[var(--paper-faint)] transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="border-t border-[var(--paper-rule)]">
          {children}
        </div>
      )}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between px-5 py-2.5">
      <span
        className="text-[10px] uppercase tracking-[0.22em] text-[var(--paper-faint)]"
        style={SANS}
      >
        {label}
      </span>
      <span
        className="text-[14px] tabular-nums text-[var(--paper-text)]"
        style={MONO}
      >
        {value}
      </span>
    </div>
  )
}

// ── GameHero ──────────────────────────────────────────────────────────────────

function GameHero({ game }: { game: GamePanelData['game'] }) {
  const homePhoto = TEAM_PHOTOS[game.home_school]?.[0]
  const awayPhoto = TEAM_PHOTOS[game.away_school]?.[0]
  const scored = game.home_score != null && game.away_score != null

  return (
    <div
      className="mx-5 mt-5 mb-2 border border-[var(--paper-rule)] bg-[var(--paper-quiet)]"
      style={{ padding: 6, borderRadius: TABLET_R }}
    >
      <div
        className="relative w-full h-[180px] overflow-hidden"
        style={{ borderRadius: 1 }}
      >
        <div className="absolute inset-0 flex">
          <div className="relative flex-1">
            {homePhoto
              ? <><Image src={homePhoto} alt={game.home_name} fill className="object-cover object-top" unoptimized /><div className="absolute inset-0 bg-gradient-to-r from-black/10 to-black/60" /></>
              : <div className="h-full" style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}28, ${ACCENT_COLOR}55)` }} />}
          </div>
          <div className="relative flex-1">
            {awayPhoto
              ? <><Image src={awayPhoto} alt={game.away_name} fill className="object-cover object-top" unoptimized /><div className="absolute inset-0 bg-gradient-to-l from-black/10 to-black/60" /></>
              : <div className="h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />}
          </div>
        </div>
        <div className="absolute inset-0 bg-black/35" />
        {game.game_number != null && (
          <div className="absolute top-3 left-3 z-10">
            <span
              className="text-[10px] uppercase tracking-[0.22em] px-2 py-1 border border-white/30 bg-black/45 backdrop-blur-sm text-white/95"
              style={{ ...SANS, borderRadius: 2 }}
            >
              Week {game.game_number}
            </span>
          </div>
        )}
        {fmtDate(game.game_date) && (
          <div className="absolute top-3 right-3 z-10">
            <span
              className="text-[10px] uppercase tracking-[0.22em] text-white/70"
              style={SANS}
            >
              {fmtDate(game.game_date)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {scored
            ? <p className="text-5xl font-black text-white tabular-nums leading-none drop-shadow-lg" style={MONO}>{game.home_score} – {game.away_score}</p>
            : <p className="text-lg text-white/50" style={{ ...SERIF, fontStyle: 'italic' }}>vs</p>}
        </div>
      </div>
    </div>
  )
}

// ── BoxScore ──────────────────────────────────────────────────────────────────

function BoxScore({ game, quarterRows }: { game: GamePanelData['game']; quarterRows: GamePanelData['quarterRows'] }) {
  if (!quarterRows.length) return null
  return (
    <AccordionStatTable title="Box Score">
      <div className="px-5 py-3">
        <div className="grid grid-cols-7 items-baseline pb-2 border-b border-[var(--paper-rule-soft)]">
          <span className="col-span-2 text-[10px] uppercase tracking-[0.22em] text-[var(--paper-faint)]" style={SANS}>Team</span>
          {(['Q1','Q2','Q3','Q4','F'] as const).map(h => (
            <span key={h} className="text-[10px] uppercase tracking-[0.22em] text-[var(--paper-faint)] text-center" style={SANS}>{h}</span>
          ))}
        </div>
        {[...quarterRows].sort((a, b) => a.team_slug === game.home_team_slug ? -1 : 1).map((r, i) => {
          const isHome = r.team_slug === game.home_team_slug
          const name   = isHome ? game.home_name : game.away_name
          const logo   = SCHOOL_LOGOS[isHome ? game.home_school : game.away_school]
          const final  = isHome ? game.home_score : game.away_score
          return (
            <div
              key={r.team_slug}
              className={cn('grid grid-cols-7 items-center py-2.5', i > 0 && 'border-t border-[var(--paper-rule-soft)]')}
            >
              <div className="col-span-2 flex items-center gap-2 min-w-0">
                {logo && <Image src={logo} alt={name} width={20} height={20} className="shrink-0 object-contain" unoptimized />}
                <span
                  className="text-[var(--paper-text)] truncate"
                  style={{ ...SERIF, fontSize: 13, fontWeight: 500, letterSpacing: '-0.005em' }}
                >
                  {cleanName(name)}
                </span>
              </div>
              <span className="text-[13px] tabular-nums text-center text-[var(--paper-muted)]" style={MONO}>{r.q1}</span>
              <span className="text-[13px] tabular-nums text-center text-[var(--paper-muted)]" style={MONO}>{r.q2}</span>
              <span className="text-[13px] tabular-nums text-center text-[var(--paper-muted)]" style={MONO}>{r.q3}</span>
              <span className="text-[13px] tabular-nums text-center text-[var(--paper-muted)]" style={MONO}>{r.q4}</span>
              <span className="text-[13px] tabular-nums text-center font-medium text-[var(--paper-text)]" style={MONO}>{final ?? '—'}</span>
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
  const shortTeam = cleanName(p.team_name)

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div
        className="mx-5 mt-5 mb-2 border border-[var(--paper-rule)] bg-[var(--paper-quiet)]"
        style={{ padding: 6, borderRadius: TABLET_R }}
      >
        <div className="relative w-full h-[200px] overflow-hidden" style={{ borderRadius: 1 }}>
          {heroSrc
            ? <Image src={heroSrc} alt={p.player_name} fill className="object-cover object-top" unoptimized />
            : <div className="h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}18, ${ACCENT_COLOR}40)` }}>
                {logo && <Image src={logo} alt="" width={56} height={56} className="object-contain opacity-50" unoptimized />}
              </div>}
        </div>
      </div>
      <div className="px-5 pt-3 pb-5 flex items-center gap-3 border-b border-[var(--paper-rule)]">
        <Link
          href={`/team/${p.school_slug}-varsity-football`}
          aria-label={`${shortTeam} team page`}
          className="shrink-0 w-12 h-12 rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity"
        >
          {logo && <Image src={logo} alt={shortTeam} width={32} height={32} className="object-contain" unoptimized />}
        </Link>
        <div className="flex-1 min-w-0">
          <p
            className="text-[var(--paper-text)] leading-tight truncate"
            style={{ ...SERIF, fontSize: 20, fontWeight: 500, letterSpacing: '-0.005em' }}
          >
            {p.player_name}
          </p>
          <p
            className="mt-0.5 text-[12.5px] text-[var(--paper-muted)] truncate"
            style={{ ...SERIF, fontStyle: 'italic' }}
          >
            {shortTeam} · {p.stat_type}
          </p>
        </div>
      </div>
      <div
        className="mx-5 my-3 border border-[var(--paper-rule)] bg-[var(--paper-quiet)] overflow-hidden"
        style={{ borderRadius: TABLET_R }}
      >
        <div
          className="px-5 py-2.5 text-[10px] uppercase tracking-[0.22em] text-[var(--paper-faint)] border-b border-[var(--paper-rule)]"
          style={SANS}
        >
          This Game
        </div>
        <div>
          {p.stat_type === 'Passing' && <>
            <StatRow label="YDS"      value={fmt(p.pass_yds)} />
            <StatRow label="COMP/ATT" value={`${fmt(p.pass_comp)}/${fmt(p.pass_att)}`} />
            <StatRow label="TD"       value={fmt(p.pass_tds)} />
            <StatRow label="INT"      value={fmt(p.pass_int)} />
          </>}
          {p.stat_type === 'Rushing' && <>
            <StatRow label="YDS" value={fmt(p.rush_yds)} />
            <StatRow label="ATT" value={fmt(p.rush_att)} />
            <StatRow label="TD"  value={fmt(p.rush_tds)} />
          </>}
          {p.stat_type === 'Receiving' && <>
            <StatRow label="YDS" value={fmt(p.rec_yds)} />
            <StatRow label="REC" value={fmt(p.rec_rec)} />
            <StatRow label="TD"  value={fmt(p.rec_tds)} />
          </>}
        </div>
      </div>
    </div>
  )
}

// ── PlayerStats ───────────────────────────────────────────────────────────────

function PlayerStatRow({ p, onRowClick, first }: { p: GamePanelData['playerStats'][0]; onRowClick: (p: GamePanelData['playerStats'][0]) => void; first?: boolean }) {
  const logo = SCHOOL_LOGOS[p.school_slug]
  const statSummary =
    p.stat_type === 'Passing'   ? `${fmt(p.pass_yds)} yds · ${fmt(p.pass_tds)} TD` :
    p.stat_type === 'Rushing'   ? `${fmt(p.rush_yds)} yds · ${fmt(p.rush_tds)} TD` :
    p.stat_type === 'Receiving' ? `${fmt(p.rec_yds)} yds · ${fmt(p.rec_tds)} TD` : ''
  return (
    <div
      className={cn(
        'group/row flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)]',
        !first && 'border-t border-[var(--paper-rule-soft)]',
      )}
      onClick={() => onRowClick(p)}
    >
      {logo
        ? <Image src={logo} alt="" width={22} height={22} className="shrink-0 object-contain" unoptimized />
        : <div className="shrink-0 h-[22px] w-[22px] rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)]" />}
      <div className="flex-1 min-w-0">
        <p
          className="text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors truncate"
          style={{ ...SERIF, fontSize: 13.5, fontWeight: 500, letterSpacing: '-0.005em' }}
        >
          {p.player_name}
        </p>
        <p
          className="text-[11.5px] text-[var(--paper-muted)] truncate"
          style={{ ...SERIF, fontStyle: 'italic' }}
        >
          {cleanName(p.team_name)}
        </p>
      </div>
      <span
        className="text-[12px] tabular-nums text-[var(--paper-muted)] shrink-0"
        style={MONO}
      >
        {statSummary}
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
          {passing.map((p, i) => <PlayerStatRow key={i} p={p} onRowClick={onRowClick} first={i === 0} />)}
        </AccordionStatTable>
      )}
      {rushing.length > 0 && (
        <AccordionStatTable title="Rushing">
          {rushing.map((p, i) => <PlayerStatRow key={i} p={p} onRowClick={onRowClick} first={i === 0} />)}
        </AccordionStatTable>
      )}
      {receiving.length > 0 && (
        <AccordionStatTable title="Receiving">
          {receiving.map((p, i) => <PlayerStatRow key={i} p={p} onRowClick={onRowClick} first={i === 0} />)}
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
      <div className="px-5 py-4 space-y-3">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className="text-[14px] leading-[1.7] text-[var(--paper-muted)]"
            style={SERIF}
          >
            {p.replace(/\*\*(.*?)\*\*/g, '$1')}
          </p>
        ))}
      </div>
    </AccordionStatTable>
  )
}

// ── GameDetailFooter (sticky footer for launchpad game panel) ─────────────────

export function GameDetailFooter() {
  return (
    <div className="px-5 py-3.5 bg-[var(--paper)]">
      <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>
        Game Detail Panel
      </span>
    </div>
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
        title={
          <span className="truncate" style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}>
            {selectedPlayer?.player_name ?? ''}
          </span>
        }
        footer={
          <div className="px-5 py-3.5 bg-[var(--paper)]">
            <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>
              Player Panel
            </span>
          </div>
        }
        bodyClass="flex flex-col"
      >
        {selectedPlayer && <PlayerGameCard p={selectedPlayer} />}
      </AppPanel>

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ backgroundColor: 'var(--paper)' }}>
        <div className="pt-1 pb-6">
          <GameHero game={game} />
          <BoxScore game={game} quarterRows={quarterRows} />
          <PlayerStats playerStats={playerStats} onRowClick={setSelectedPlayer} />
          {narrative && <Narrative text={narrative} />}
        </div>
      </div>
    </>
  )
}
