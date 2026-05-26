import { NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { streamChatResponse } from '@/lib/ai-stream'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const gameId = parseInt(id, 10)
  if (isNaN(gameId)) return new Response('invalid', { status: 400 })

  const rows = await sql`SELECT highlights FROM game_box_scores WHERE game_id = ${gameId} LIMIT 1`
  const raw = rows[0]?.highlights as string | null
  if (!raw) return new Response('', { status: 204 })

  const readable = streamChatResponse({
    system: 'You are a high school sports beat reporter. First, write a punchy newspaper-style article headline (one line, no quotes, no period). Then a blank line. Then rewrite the game summary in a vivid, engaging voice — active verbs, player-first storytelling, sense of atmosphere. 2-3 short paragraphs. End with the final score in bold. Keep all stats accurate. Do not use markdown headings (#). Use **bold** only for the final score line.',
    user: raw,
    errorPrefix: 'Unable to generate highlights',
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
