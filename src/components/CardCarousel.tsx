'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TEAM_PHOTOS, SCHOOL_LOGOS, DIVISION_LOGOS } from '@/lib/team-images'
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
  /** Either a school slug (for team prompts) or a division number 1-4 (for division prompts) */
  logoKey: { kind: 'school'; slug: string } | { kind: 'division'; num: 1 | 2 | 3 | 4 }
  /** The actual prompt sent to the chat when clicked */
  prompt: string
}

const PROMPTS: PromptCard[] = [
  { logoKey: { kind: 'division', num: 1 },                prompt: 'Who led Division I in rushing yards this 2025-26 season?' },
  { logoKey: { kind: 'division', num: 2 },                prompt: 'Who led Division II in passing yards this 2025-26 season?' },
  { logoKey: { kind: 'school',   slug: 'floyd' },         prompt: "How has William Floyd's record trended over the past 5 seasons?" },
  { logoKey: { kind: 'school',   slug: 'ward-melville' }, prompt: "Who are Ward Melville's top offensive playmakers in the 2025-26 season?" },
  { logoKey: { kind: 'division', num: 3 },                prompt: 'Show me the current Division III standings and the hottest teams.' },
  { logoKey: { kind: 'school',   slug: 'sachem-east' },   prompt: "What is Sachem East's season-by-season record and playoff history?" },
  { logoKey: { kind: 'division', num: 4 },                prompt: 'Which Division IV teams have the longest winning streaks?' },
  { logoKey: { kind: 'school',   slug: 'longwood' },      prompt: "Tell me about Longwood's top offensive playmakers this 2025-26 season." },
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

/* ── Suggested-prompt card — logo + question, editorial frame ───────────── */
function PromptCardButton({
  prompt,
  onClick,
}: {
  prompt: PromptCard
  onClick: () => void
}) {
  const logoSrc =
    prompt.logoKey.kind === 'division'
      ? DIVISION_LOGOS[prompt.logoKey.num]
      : SCHOOL_LOGOS[prompt.logoKey.slug]

  return (
    <button
      onClick={onClick}
      className="group shrink-0 w-[220px] h-[130px] snap-start border border-[var(--paper-rule)] bg-[var(--paper)] flex flex-col justify-between px-4 py-4 hover:bg-[var(--paper-quiet)] hover:border-[var(--paper-strong)] transition-colors text-left"
      style={{ borderRadius: 3 }}
    >
      {logoSrc && (
        <Image
          src={logoSrc}
          alt=""
          width={32}
          height={32}
          className="object-contain opacity-80 group-hover:opacity-100 transition-opacity"
          unoptimized
        />
      )}
      <p
        className="text-[12px] text-[var(--paper-strong)] font-medium leading-snug"
        style={MONO}
      >
        {prompt.prompt}
      </p>
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
