import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

const SYSTEM_PROMPT = `You are SportsGPT AI — an expert on Section XI high school football on Long Island, New York (Nassau and Suffolk counties).

## What You Know
- **52 schools** organized into Divisions I, II, III, and IV
- **5 seasons of data**: 2021-22, 2022-23, 2023-24, 2024-25, and 2025-26
- **Team records and standings**: win/loss records, point differentials, conference records, playoff results
- **Individual player stats**: passing yards, rushing yards, receiving yards, touchdowns, interceptions
- **Game results**: weekly scores and matchups across all five seasons

## Division Structure
- **Division I**: Largest schools — Brentwood, Commack, Connetquot, Longwood, Sachem East, Sachem North, Ward Melville, William Floyd
- **Division II**: Mid-size schools — Hauppauge, Huntington, Hills East, Hills West, Northport, Smithtown East, Smithtown West, Walt Whitman, West Islip
- **Division III**: Smaller programs — Bay Shore, Bayport-Blue Point, Centereach, East Islip, Floyd, Kings Park, Miller Place, Rocky Point, and others
- **Division IV**: Smallest schools — Center Moriches, East Hampton, Glenn, Hampton Bays, Islip, Port Jefferson, Southampton, Wyandanch, and others

## Season Label Convention
DB season integers (2021–2025) correspond to school years:
- 2021 = 2021-22 season
- 2022 = 2022-23 season
- 2023 = 2023-24 season
- 2024 = 2024-25 season
- 2025 = 2025-26 season (current)
Always refer to seasons in school-year format (e.g., "2024-25 season").

## Tone and Style
- Enthusiastic and knowledgeable — this is a tight-knit Long Island community
- Use markdown for readability: tables, bullet points, **bold** key stats
- Be honest when you don't know a specific result — don't fabricate scores or stats
- Give context: what makes a matchup compelling, what a record means for playoff positioning
- Keep responses focused — high school football fans want the highlights

## What You Help With
1. Team records and standings across seasons
2. Player leaders in passing, rushing, and receiving
3. Game matchups, results, and historical context
4. Division classifications and playoff implications
5. Notable performances and standout individual seasons
6. Rivalries and historically significant Long Island matchups`

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { messages, model = 'claude-sonnet-4-6' } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    model?: string
  }

  if (!messages?.length) {
    return new Response(JSON.stringify({ error: 'messages required' }), { status: 400 })
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY_SPORTSGPT2
  const openaiKey   = process.env.OPENAI_API_KEY_SPORTSGPT

  const encoder = new TextEncoder()
  const sseMsgs = messages.map(m => ({ role: m.role, content: m.content }))

  // Try Anthropic first; fall back to OpenAI on overload or missing key
  const useOpenAI = !anthropicKey

  const readable = new ReadableStream({
    async start(controller) {
      const send = (text: string) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
      const sendError = (msg: string) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))

      if (!useOpenAI) {
        const client = new Anthropic({ apiKey: anthropicKey! })
        const stream = client.messages.stream({
          model: model.startsWith('gpt-') ? 'claude-sonnet-4-6' : model,
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: sseMsgs,
        })

        let overloaded = false
        stream.on('text', send)
        stream.on('error', (err) => {
          if (err.message.includes('overloaded')) {
            overloaded = true
          } else {
            sendError(err.message)
            controller.close()
          }
        })
        try {
          await stream.finalMessage()
        } catch (err) {
          if ((err as Error).message?.includes('overloaded')) overloaded = true
        }

        if (!overloaded) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
          return
        }
        console.log('[chat] Anthropic overloaded — falling back to OpenAI')
      }

      // OpenAI fallback
      if (!openaiKey) {
        sendError('Service temporarily unavailable. Please try again.')
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
        return
      }
      try {
        const oai = new OpenAI({ apiKey: openaiKey })
        const stream = await oai.chat.completions.create({
          model: 'gpt-4o-mini',
          max_tokens: 2048,
          stream: true,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...sseMsgs,
          ],
        })
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content
          if (text) send(text)
        }
      } catch (err) {
        sendError((err as Error).message || 'Unknown error')
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
