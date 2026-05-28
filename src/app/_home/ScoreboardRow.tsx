import Link from 'next/link'
import Image from 'next/image'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { formatSeason } from '@/lib/utils'
import type { RecentGame } from './data'

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans), system-ui, sans-serif' }  as const
const MONO  = { fontFamily: 'var(--font-mono), ui-monospace, monospace' } as const

function fmtDate(raw: string | null) {
  if (!raw) return '—'
  const d = new Date(raw + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

/**
 * One scoreboard entry — left column with week/season + date, two stacked team
 * rows on the right (logo · name · score · W marker for the winner).
 * Click target is the whole row, links to `/game/[id]`.
 */
export function ScoreboardRow({ game, isLast }: { game: RecentGame; isLast: boolean }) {
  const homeWon = (game.home_score ?? 0) > (game.away_score ?? 0)
  const awayWon = (game.away_score ?? 0) > (game.home_score ?? 0)

  const TeamRow = ({
    schoolSlug, name, score, won,
  }: {
    schoolSlug: string | null
    name:       string
    score:      number | null
    won:        boolean
  }) => (
    <div className="flex items-center gap-3">
      <div className="shrink-0 w-7 h-7 flex items-center justify-center">
        {schoolSlug && SCHOOL_LOGOS[schoolSlug] && (
          <Image
            src={SCHOOL_LOGOS[schoolSlug]}
            alt=""
            width={22}
            height={22}
            className="object-contain"
            unoptimized
          />
        )}
      </div>
      <span
        className="flex-1 min-w-0 text-[15px] text-[var(--paper-text)] group-hover/score:text-[var(--paper-strong)] transition-colors truncate"
        style={{ ...SERIF, fontWeight: won ? 500 : 400 }}
      >
        {name}
      </span>
      <span
        className={`shrink-0 tabular-nums text-[16px] ${won ? 'text-[var(--paper-text)] font-medium' : 'text-[var(--paper-muted)]'}`}
        style={MONO}
      >
        {score ?? '—'}
      </span>
      <span
        className={`shrink-0 w-5 text-center text-[10px] uppercase tracking-[0.2em] ${won ? 'text-[var(--paper-strong)]' : 'text-transparent'}`}
        style={SANS}
      >
        W
      </span>
    </div>
  )

  return (
    <Link
      href={`/game/${game.id}`}
      className={`group/score grid grid-cols-[140px_1fr] gap-6 px-5 py-4 transition-colors hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)] ${isLast ? '' : 'border-b border-[var(--paper-rule-soft)]'}`}
    >
      <div className="flex flex-col justify-center gap-1 select-none">
        <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)] tabular-nums" style={SANS}>
          {game.week != null ? `Week ${game.week}` : formatSeason(game.season)}
        </span>
        <span className="text-[11px] tabular-nums text-[var(--paper-muted)]" style={MONO}>
          {fmtDate(game.game_date)} · {formatSeason(game.season)}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        <TeamRow
          schoolSlug={game.home_school_slug}
          name={game.home_name}
          score={game.home_score}
          won={homeWon}
        />
        <TeamRow
          schoolSlug={game.away_school_slug}
          name={game.away_name}
          score={game.away_score}
          won={awayWon}
        />
      </div>
    </Link>
  )
}
