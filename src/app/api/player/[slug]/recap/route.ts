import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { sql } from '@/lib/db'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY_SPORTSGPT2 })

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

  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `You are a high school sports beat reporter writing a career retrospective profile of a single Suffolk County (Section XI) high school football player.

Format:
1. First line: a punchy newspaper-style article headline naming the player (one line, no quotes, no trailing period).
2. Then a blank line.
3. Then a vivid 2-3 paragraph profile. Active verbs. Player-first storytelling. Anchor it in the most striking numbers from the stat lines — the breakout season, the career totals, the position-specific peak (passing yards / rushing yards / receiving yards / TDs / points scored).
4. End with the career-defining stat line in **bold** — e.g. "**4,231 career passing yards, 38 TDs.**"

Keep every stat numerically accurate to what was provided. Do not invent plays, games, opponents, dates, or quotes. Do not use markdown headings (#). Use **bold** only on the final career-line.`,
    messages: [{ role: 'user', content: payload }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      stream.on('text', (text) => {
        controller.enqueue(encoder.encode(text))
      })
      stream.on('error', (err) => {
        console.error('[player-recap] stream error:', err.message)
        controller.enqueue(encoder.encode(`\n\n*Unable to generate recap: ${err.message}*`))
        controller.close()
      })
      try {
        await stream.finalMessage()
      } catch (err) {
        console.error('[player-recap] finalMessage error:', (err as Error).message)
      }
      try { controller.close() } catch { /* already closed */ }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
