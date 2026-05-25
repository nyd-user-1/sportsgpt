'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TEAM_PHOTOS, SCHOOL_LOGOS } from '@/lib/team-images'
import { SCHOOL_COLORS } from '@/lib/school-colors'
import { MONO } from '@/components/editorial'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans), system-ui, sans-serif' }

/* ── Teams shown in the photo carousel ─────────────────────────────────── */
const TEAMS: { slug: string; name: string }[] = [
  { slug: 'ward-melville',       name: 'Ward Melville'    },
  { slug: 'floyd',               name: 'William Floyd'    },
  { slug: 'hauppauge',           name: 'Hauppauge'        },
  { slug: 'sachem-east',         name: 'Sachem East'      },
  { slug: 'huntington',          name: 'Huntington'       },
  { slug: 'brentwood',           name: 'Brentwood'        },
  { slug: 'longwood',            name: 'Longwood'         },
  { slug: 'connetquot',          name: 'Connetquot'       },
  { slug: 'northport',           name: 'Northport'        },
  { slug: 'central-islip',       name: 'Central Islip'    },
  { slug: 'half-hollow-hills-east', name: 'Hills East'    },
  { slug: 'commack',             name: 'Commack'          },
]

/* ── Suggested prompts shown in the editorial card carousel ─────────────── */
type PromptCard = {
  /** Short label in the blue LHS column — team name or division code */
  label: string
  /** The actual prompt sent to the chat when clicked */
  prompt: string
}

const PROMPTS: PromptCard[] = [
  { label: 'Division I',    prompt: 'Who led Division I in rushing yards this 2025-26 season?' },
  { label: 'Division II',   prompt: 'Who led Division II in passing yards this 2025-26 season?' },
  { label: 'Floyd',         prompt: "How has William Floyd's record trended over the past 5 seasons?" },
  { label: 'Ward Melville', prompt: "Who are Ward Melville's top offensive playmakers in the 2025-26 season?" },
  { label: 'Division III',  prompt: 'Show me the current Division III standings and the hottest teams.' },
  { label: 'Sachem East',   prompt: "What is Sachem East's season-by-season record and playoff history?" },
  { label: 'Division IV',   prompt: 'Which Division IV teams have the longest winning streaks?' },
  { label: 'Longwood',      prompt: "Tell me about Longwood's top offensive playmakers this 2025-26 season." },
]

/* ── Team photo card inner content ───────────────────────────────────────── */
function CardInner({ slug, name }: { slug: string; name: string }) {
  const photo = TEAM_PHOTOS[slug]?.[0]
  const logo  = SCHOOL_LOGOS[slug]
  const color = SCHOOL_COLORS[slug]?.primary ?? 'var(--paper-quiet)'

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ borderRadius: 1 }}
    >
      {/* Background: photo if present; otherwise school-color placeholder w/ centered logo */}
      {photo ? (
        <>
          <div
            className="absolute inset-0"
            style={{ backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0" style={{ background: color }} />
          {logo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={logo}
                alt=""
                width={64}
                height={64}
                className="object-contain"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}
                unoptimized
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        </>
      )}

      {/* Name — Fraunces serif */}
      <div className="absolute bottom-2 left-3 right-3">
        <p
          className="text-[15px] text-white leading-snug truncate"
          style={{ ...SERIF, fontWeight: 500, letterSpacing: '-0.005em' }}
        >
          {name}
        </p>
      </div>
    </div>
  )
}

/* ── Suggested-prompt card — FormulaTablet design language ──────────────── */
function PromptCardButton({
  prompt,
  onClick,
}: {
  prompt: PromptCard
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group shrink-0 w-[260px] h-[170px] snap-start border border-[var(--paper-rule)] bg-[var(--paper-quiet)] flex flex-col hover:border-[var(--paper-strong)] transition-colors text-left overflow-hidden"
      style={{ borderRadius: 3 }}
    >
      {/* TOP — team / division label in blue mono */}
      <div
        className="shrink-0 flex items-center px-4 py-3 text-[var(--paper-strong)] tracking-wide leading-tight"
        style={{ ...MONO, fontSize: 13, fontWeight: 600 }}
      >
        {prompt.label}
      </div>

      {/* Horizontal divider */}
      <div className="h-px bg-[var(--paper-rule)] shrink-0" />

      {/* BOTTOM — question in paper-text mono */}
      <div
        className="flex-1 flex items-center px-4 py-3 text-[var(--paper-text)] leading-relaxed"
        style={{ ...MONO, fontSize: 12.5 }}
      >
        {prompt.prompt}
      </div>
    </button>
  )
}

/* ── Main carousel ──────────────────────────────────────────────────────── */
interface Props {
  onTeamClick?: (prompt: string) => void
}

export function CardCarousel({ onTeamClick }: Props) {
  const [mode, setMode] = useState<'teams' | 'prompts'>('teams')
  const scrollRef = useRef<HTMLDivElement>(null)

  const cardCls =
    'group relative shrink-0 w-[260px] h-[170px] snap-start border border-[var(--paper-rule)] bg-[var(--paper-quiet)] transition-colors hover:border-[var(--paper-strong)]'

  const toggle = () => setMode(m => (m === 'teams' ? 'prompts' : 'teams'))

  const arrowBtn =
    'h-8 w-8 border border-[var(--paper-rule)] flex items-center justify-center text-[var(--paper-faint)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] transition-colors'

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]"
          style={SANS}
        >
          {mode === 'teams' ? 'Explore Teams' : 'Suggested Prompts'}
        </p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={toggle}
            className={arrowBtn}
            style={{ borderRadius: 3 }}
            aria-label={mode === 'teams' ? 'Show suggested prompts' : 'Show team cards'}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggle}
            className={arrowBtn}
            style={{ borderRadius: 3 }}
            aria-label={mode === 'teams' ? 'Show suggested prompts' : 'Show team cards'}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {mode === 'teams' ? (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory">
          {TEAMS.map(({ slug, name }) => {
            const teamSlug = `${slug}-varsity-football`
            const teamPrompt = `Tell me about the ${name} football program — their record, key players, and how they've performed in recent seasons.`
            return onTeamClick ? (
              <button
                key={slug}
                onClick={() => onTeamClick(teamPrompt)}
                className={cardCls}
                style={{ borderRadius: 3, padding: 4 }}
              >
                <CardInner slug={slug} name={name} />
              </button>
            ) : (
              <Link
                key={slug}
                href={`/team/${teamSlug}`}
                className={`${cardCls} block`}
                style={{ borderRadius: 3, padding: 4 }}
              >
                <CardInner slug={slug} name={name} />
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory">
          {PROMPTS.map((p, i) => (
            <PromptCardButton
              key={i}
              prompt={p}
              onClick={() => onTeamClick?.(p.prompt)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
