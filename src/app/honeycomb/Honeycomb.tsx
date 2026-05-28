'use client'

import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/AppLayout'
import { RevealFx } from '@/components/RevealFx'
import { EditorialHead, DivisionTabs, type DivisionKey } from '@/components/editorial'
import { SCHOOL_COLORS } from '@/lib/school-colors'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { HEX_LAYOUT, HEX_COLS, HEX_ROWS } from '@/lib/section-hex-layout'
import type { HexSchool } from '@/lib/section-schools'

export type { HexSchool }

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono, ui-monospace), monospace' }

// ── Hex geometry (pointy-top, offset rows) ──────────────────────────────────
const S = 42
const W = Math.sqrt(3) * S
const PAD = 16

const VIEW_W = PAD * 2 + HEX_COLS * W + W / 2
const VIEW_H = PAD * 2 + (HEX_ROWS - 1) * 1.5 * S + 2 * S

function hexPoints(cx: number, cy: number, s = S) {
  const pts: string[] = []
  for (let k = 0; k < 6; k++) {
    const a = ((-90 + 60 * k) * Math.PI) / 180
    pts.push(`${(cx + s * Math.cos(a)).toFixed(1)},${(cy + s * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

// grid [col,row] → honeycomb pixel center (odd rows shifted half a hex east)
function cellToXY(col: number, row: number) {
  const cx = PAD + col * W + (row % 2 ? W / 2 : 0) + W / 2
  const cy = PAD + row * 1.5 * S + S
  return { cx, cy }
}

function record(s: HexSchool) {
  if (s.wins + s.losses + s.ties === 0) return 'No record on file'
  return s.ties > 0 ? `${s.wins}–${s.losses}–${s.ties}` : `${s.wins}–${s.losses}`
}

// Place every school: geographic cell if known, else the next free cell.
function resolveLayout(schools: HexSchool[]): Record<string, [number, number]> {
  const used = new Set<string>()
  const pos: Record<string, [number, number]> = {}
  for (const s of schools) {
    const at = HEX_LAYOUT[s.schoolSlug]
    if (at) { pos[s.schoolSlug] = at; used.add(`${at[0]},${at[1]}`) }
  }
  for (const s of schools) {
    if (pos[s.schoolSlug]) continue
    outer: for (let r = 0; r < HEX_ROWS; r++) {
      for (let c = 0; c < HEX_COLS; c++) {
        if (!used.has(`${c},${r}`)) { used.add(`${c},${r}`); pos[s.schoolSlug] = [c, r]; break outer }
      }
    }
  }
  return pos
}

function HexTooltip({ s, x, y }: { s: HexSchool; x: number; y: number }) {
  const logo = SCHOOL_LOGOS[s.schoolSlug]
  return createPortal(
    <div
      style={{ position: 'fixed', top: y + 16, left: x + 16, zIndex: 70, pointerEvents: 'none' }}
      className="w-56 rounded-[3px] border border-[var(--paper-rule)] bg-[var(--paper)] shadow-xl px-3.5 py-3"
    >
      <div className="flex items-center gap-2.5">
        {logo && <img src={logo} alt="" width={26} height={26} className="shrink-0 object-contain" />}
        <div className="min-w-0">
          <p className="text-[14px] text-[var(--paper-text)] leading-tight truncate" style={{ ...SERIF, fontWeight: 500 }}>{s.name}</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--paper-faint)] mt-0.5" style={SANS}>Division {s.division}</p>
        </div>
      </div>
      <div className="mt-2.5 pt-2.5 border-t border-[var(--paper-rule-soft)] flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--paper-faint)]" style={SANS}>All-time</span>
        <span className="text-[13px] tabular-nums text-[var(--paper-text)]" style={MONO}>{record(s)}</span>
      </div>
    </div>,
    document.body,
  )
}

// ── One unified geographic honeycomb (shared by /honeycomb + launchpad slide) ─
export function HoneycombMap({ schools, activeDiv }: { schools: HexSchool[]; activeDiv: DivisionKey }) {
  const router = useRouter()
  const [hover, setHover] = useState<{ s: HexSchool; x: number; y: number } | null>(null)
  const pos = useMemo(() => resolveLayout(schools), [schools])

  return (
    <>
      <svg
        viewBox={`0 0 ${VIEW_W.toFixed(0)} ${VIEW_H.toFixed(0)}`}
        className="w-full h-auto"
        style={{ overflow: 'visible' }}
        onMouseLeave={() => setHover(null)}
      >
        {schools.map(s => {
          const p = pos[s.schoolSlug]
          if (!p) return null
          const { cx, cy } = cellToXY(p[0], p[1])
          const color = SCHOOL_COLORS[s.schoolSlug]?.primary ?? '#3f3f46'
          const logo  = SCHOOL_LOGOS[s.schoolSlug]
          const on    = hover?.s.schoolSlug === s.schoolSlug
          const dim   = activeDiv !== 'All' && s.division !== activeDiv
          return (
            <g
              key={s.schoolSlug}
              onMouseEnter={e => setHover({ s, x: e.clientX, y: e.clientY })}
              onClick={() => router.push(`/team/${s.teamSlug}`)}
              style={{
                cursor: dim ? 'default' : 'pointer',
                pointerEvents: dim ? 'none' : 'auto',
                opacity: dim ? 0.14 : 1,
                transformBox: 'fill-box',
                transformOrigin: 'center',
                transform: on ? 'scale(1.12)' : 'scale(1)',
                transition: 'opacity .25s ease, transform .18s ease',
              }}
            >
              <polygon
                points={hexPoints(cx, cy)}
                fill={color}
                stroke={on ? 'var(--paper-strong)' : 'rgba(0,0,0,0.4)'}
                strokeWidth={on ? 3 : 1}
                style={{ transition: 'stroke .15s, stroke-width .15s' }}
              />
              <circle cx={cx} cy={cy} r={S * 0.5} fill="#ffffff" opacity={0.94} />
              {logo && (
                <image
                  href={logo}
                  x={cx - S * 0.4}
                  y={cy - S * 0.4}
                  width={S * 0.8}
                  height={S * 0.8}
                  preserveAspectRatio="xMidYMid meet"
                />
              )}
            </g>
          )
        })}
      </svg>
      {hover && <HexTooltip s={hover.s} x={hover.x} y={hover.y} />}
    </>
  )
}

// ── Standalone /honeycomb page shell ─────────────────────────────────────────
export function Honeycomb({ schools }: { schools: HexSchool[] }) {
  const [activeDiv, setActiveDiv] = useState<DivisionKey>('All')

  return (
    <AppLayout paperMode>
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ backgroundColor: 'var(--paper)' }}>
        <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-24">

          <RevealFx delay={0} translateY={4}>
            <EditorialHead
              size="xl"
              eyebrow="Section XI · The Honeycomb"
              subhead={
                <>
                  Every Section XI program laid out by geography — Nassau line in the
                  west, out to the Forks in the east. Filter by division to light up its
                  cells; hover for the all-time record; click to open the team.
                </>
              }
              meta={[
                <Link key="maps" href="/maps" className="hover:text-[var(--paper-strong)] transition-colors">Maps</Link>,
                <Link key="team" href="/team" className="hover:text-[var(--paper-strong)] transition-colors">Team</Link>,
                <Link key="section" href="/section/section-xi" className="hover:text-[var(--paper-strong)] transition-colors">Section XI</Link>,
              ]}
            >
              The Honeycomb
            </EditorialHead>
          </RevealFx>

          <RevealFx delay={0.15} translateY={8}>
            <div className="mt-10">
              <DivisionTabs
                active={activeDiv}
                onChange={setActiveDiv}
                rightSlot={
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--paper-faint)]" style={SANS}>
                    {schools.length} programs
                  </span>
                }
              />
            </div>
            <div className="mt-8">
              <HoneycombMap schools={schools} activeDiv={activeDiv} />
            </div>
          </RevealFx>

          <div
            className="mt-16 pt-8 border-t border-[var(--paper-rule)] max-w-[68ch] text-[12.5px] leading-[1.75] text-[var(--paper-faint)]"
            style={{ ...SERIF, fontStyle: 'italic' }}
          >
            One cell per Section XI varsity football program, filled with the school&apos;s
            primary color and stamped with its logo, placed by its rough geographic position
            (derived from the Suffolk district centroids behind the{' '}
            <Link href="/maps" className="text-[var(--paper-strong)] hover:underline underline-offset-4">district map</Link>).
            The all-time record is summed across every season on file.
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
