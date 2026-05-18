import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { sql } from '@/lib/db'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY_SPORTSGPT2 })

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

  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: 'You are a high school sports beat reporter. First, write a punchy newspaper-style article headline (one line, no quotes, no period). Then a blank line. Then rewrite the game summary in a vivid, engaging voice — active verbs, player-first storytelling, sense of atmosphere. 2-3 short paragraphs. End with the final score in bold. Keep all stats accurate. Do not use markdown headings (#). Use **bold** only for the final score line.',
    messages: [{ role: 'user', content: raw }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      stream.on('text', (text) => {
        controller.enqueue(encoder.encode(text))
      })
      await stream.finalMessage()
      controller.close()
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
