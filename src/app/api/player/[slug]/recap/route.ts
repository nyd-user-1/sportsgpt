import { NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { streamChatResponse } from '@/lib/ai-stream'

export const dynamic = 'force-dynamic'

function fmt(v: unknown) {
  if (v == null) return '0'
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString() : '0'
}

function seasonLabel(y: number) { return `${y}-${String(y + 1).slice(2)}` }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const [playerRows, statRows] = await Promise.all([
    sql`
      SELECT p.slug, p.name, p.position, p.school_slug,
             sch.name AS school_name, sch.division
      FROM players p
      LEFT JOIN schools sch ON sch.slug = p.school_slug
      WHERE p.slug = ${slug}
      LIMIT 1
    `,
    sql`
      SELECT season, stat_type,
             completions, attempts, pass_yards, pass_tds, interceptions,
             rush_attempts, rush_yards, rush_tds,
             receptions, recv_yards, recv_tds,
             games_played, points, fg, total_tds
      FROM player_season_stats
      WHERE player_slug = ${slug}
      ORDER BY season DESC, stat_type
    `,
  ])

  const player = playerRows[0]
  if (!player) return new Response('', { status: 204 })

  // Team records (for context — wins/losses while this player was active)
  const teamSlug = `${player.school_slug}-varsity-football`
  const teamRows = player.school_slug
    ? await sql`
        SELECT season, overall_wins, overall_losses
        FROM team_season_stats
        WHERE team_slug = ${teamSlug}
        ORDER BY season DESC
      `
    : []

  const teamBySeason: Record<number, string> = {}
  for (const r of teamRows as { season: number; overall_wins: number; overall_losses: number }[]) {
    teamBySeason[r.season] = `${r.overall_wins ?? 0}–${r.overall_losses ?? 0}`
  }

  // Build a narrative-friendly input payload
  const seasons = [...new Set(statRows.map((r: Record<string, unknown>) => Number(r.season)))].sort((a, b) => b - a)
  if (seasons.length === 0) return new Response('', { status: 204 })

  const lines: string[] = []
  lines.push(`Player: ${player.name as string}`)
  if (player.position) lines.push(`Position: ${player.position as string}`)
  if (player.school_name) {
    lines.push(`School: ${player.school_name as string}${player.division ? ` (Division ${player.division as string})` : ''}`)
  }
  lines.push(`Seasons on record: ${seasons.length}`)
  lines.push('')
  lines.push('Career season-by-season stat lines:')

  for (const season of seasons) {
    const seasonRows = statRows.filter((r: Record<string, unknown>) => Number(r.season) === season)
    const teamRec = teamBySeason[season]
    lines.push(`\n— ${seasonLabel(season)}${teamRec ? ` (team ${teamRec})` : ''} —`)
    for (const r of seasonRows as Record<string, unknown>[]) {
      const st = r.stat_type as string
      if (st === 'Passing') {
        lines.push(`  Passing: ${fmt(r.completions)}/${fmt(r.attempts)} for ${fmt(r.pass_yards)} yds, ${fmt(r.pass_tds)} TD, ${fmt(r.interceptions)} INT`)
      } else if (st === 'Rushing') {
        lines.push(`  Rushing: ${fmt(r.rush_attempts)} att, ${fmt(r.rush_yards)} yds, ${fmt(r.rush_tds)} TD`)
      } else if (st === 'Receiving') {
        lines.push(`  Receiving: ${fmt(r.receptions)} rec, ${fmt(r.recv_yards)} yds, ${fmt(r.recv_tds)} TD`)
      } else if (st === 'Scoring') {
        lines.push(`  Scoring: ${fmt(r.points)} pts, ${fmt(r.total_tds)} TD, ${fmt(r.fg)} FG`)
      } else if (st === 'Touchdowns') {
        lines.push(`  Touchdowns: ${fmt(r.total_tds)} total`)
      } else if (st === 'Total Yards') {
        const totalYds = (Number(r.pass_yards) || 0) + (Number(r.rush_yards) || 0) + (Number(r.recv_yards) || 0)
        if (totalYds > 0) lines.push(`  All-purpose: ${totalYds.toLocaleString()} yds`)
      }
    }
  }

  const payload = lines.join('\n')

  const readable = streamChatResponse({
    system: `You are a beat reporter writing a career retrospective of a single New York State (Suffolk County · Section XI) high school football player. Your job is to arrange the provided stat lines into vivid prose. You have NO other information about this player and you MUST NOT invent any.

CONTEXT — READ THIS CAREFULLY:
- This is high school football, not college football. "Division I / II / III / IV" in the payload is **Section XI's enrollment-based classification** (Suffolk County, NY), it is NOT NCAA Division I. NEVER use phrases like "D-I", "D-I squad", "Division I program", or anything that could be mistaken for college football. If you must reference the division, say "Section XI Division I" or "Division I (Section XI)" explicitly.

HARD CONSTRAINTS — NEVER DO THESE:
- NEVER mention a grade or class year. You DO NOT know if the player is a freshman, sophomore, junior, or senior. NEVER write "freshman campaign", "as a senior", "his sophomore year", "his first season" (if they have multiple seasons listed), or "X more seasons ahead". Refer to seasons only by the season label (e.g. "the 2024-25 season").
- NEVER reference plays, drives, downs, field position, formations, or game situations. NO "third down", "red zone", "fourth quarter", "goal line", "two-minute drill", "broken tackles", "explosive plays", "play-action", "screen game", "deep ball", etc.
- NEVER reference scouting, evaluation, projection, or recruiting. NO "scouts", "evaluators", "college projection", "next-level", "building block", "trust from the head coach", "earned starts", "create separation", "burst", "athleticism", "leadership", "intangibles".
- NEVER quote or paraphrase anyone — no players, coaches, parents, fans, beat reporters.
- NEVER name opponents, dates, weeks, or specific games unless that exact label appears in the payload.
- NEVER invent positions, role descriptions, or playing time details beyond what the position field says.

WHAT YOU MAY DO:
- Quote and arrange the actual stat-line numbers in vivid prose.
- Compare the player's per-season figures against each other (e.g. growth from year to year, peak season).
- Reference team win-loss records when they accompany a season label.
- Name the player's school and position exactly as given.

FORMAT:
1. First line: a punchy newspaper-style headline naming the player. One line. No quotes. No trailing period.
2. Blank line.
3. 2-3 short paragraphs of player-first prose. Every claim must trace to a number on the stat lines.
4. End with the career-defining stat line in **bold** — e.g. "**4,231 career passing yards, 38 TDs**". Use **bold** ONLY on that final line. No markdown headings.`,
    user: payload,
    errorPrefix: 'Unable to generate recap',
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
