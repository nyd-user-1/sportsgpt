import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { TOOLS, executeToolCall } from '@/lib/chat-tools'

const SYSTEM_PROMPT = `You are SportsGPT AI — the authoritative source on Section XI high school football on Long Island, New York (Nassau and Suffolk counties).

## Tools First — No Guessing
You have tools that query the live database. ALWAYS use tools before answering questions about specific teams, players, records, or stats. Never guess or fabricate statistics.

- Call search_teams first whenever a team is mentioned
- Call get_top_players to find key players on any team (call it for Passing, Rushing, AND Receiving to get a complete picture)
- Call get_team_records for season-by-season W-L history
- Call get_standings for division or league rankings
- Call get_team_games for a game-by-game schedule
- Call get_player_career for a specific player's multi-season stats

## Season Convention
Season integers in the DB → school year labels:
- 2025 = **2025-26** (current season)
- 2024 = 2024-25
- 2023 = 2023-24
- 2022 = 2022-23
- 2021 = 2021-22
Always display seasons in school-year format (e.g. "2025-26 season"), never just the integer.

## Links
Format ALL team and player references as markdown links:
- Teams: [Team Name](/team/{team_slug}) — use the full slug from search_teams (e.g. \`floyd-varsity-football\`)
- Players: [Player Name](/player/{player_slug}) — use player_slug from tool results (omit link if player_slug is null)

Example: [William Floyd](/team/floyd-varsity-football) had a standout season, led by [Colin Clark](/player/colin-clark).

## Formatting
- Use markdown tables for stats (they render beautifully in the UI)
- Bold key numbers: **10-0**, **300 yards**, **5 TDs**
- Use headers (##) to organize multi-section responses
- Be specific and data-driven — real numbers beat vague descriptions

## Division Structure
- **Division I**: Brentwood, Commack, Connetquot, Longwood, Sachem East, Sachem North, Ward Melville, William Floyd
- **Division II**: Hauppauge, Hills East, Hills West, Huntington, Northport, Smithtown East, Smithtown West, Walt Whitman, West Islip
- **Division III**: Bay Shore, Bayport-Blue Point, Centereach, East Islip, Floyd, Harborfields, Kings Park, Miller Place, Rocky Point, and others
- **Division IV**: Center Moriches, East Hampton, Glenn, Hampton Bays, Islip, Port Jefferson, Southampton, Wyandanch, and others`

// Convert Anthropic tool definitions → OpenAI function-calling format
const OAI_TOOLS: OpenAI.Chat.ChatCompletionTool[] = TOOLS.map(t => ({
  type: 'function' as const,
  function: {
    name:        t.name,
    description: t.description,
    parameters:  t.input_schema,
  },
}))

export const dynamic = 'force-dynamic'

type AnthropicMessage = Anthropic.Messages.MessageParam
type OAIMessage       = OpenAI.Chat.ChatCompletionMessageParam

export async function POST(req: NextRequest) {
  const { messages, model = 'claude-haiku-4-5-20251001' } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    model?: string
  }

  if (!messages?.length) {
    return new Response(JSON.stringify({ error: 'messages required' }), { status: 400 })
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY_SPORTSGPT2
  const openaiKey    = process.env.OPENAI_API_KEY_SPORTSGPT
  const geminiKey    = process.env.Gemini_API_Key

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      const send = (text: string) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
      const done = () => {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }

      const isAnthropic = model.startsWith('claude-')
      const isOpenAI    = model.startsWith('gpt-')
      const isGemini    = model.startsWith('gemini-')

      // ── 1. Anthropic (Claude) with tool use ──────────────────────────────
      if (isAnthropic && anthropicKey) {
        const client = new Anthropic({ apiKey: anthropicKey })
        const conversationMsgs: AnthropicMessage[] = messages.map(m => ({
          role: m.role, content: m.content,
        }))
        let overloaded = false

        for (let iter = 0; iter < 5; iter++) {
          let response: Anthropic.Messages.Message
          try {
            response = await client.messages.create({
              model,
              max_tokens: 2048,
              system: SYSTEM_PROMPT,
              tools: TOOLS,
              messages: conversationMsgs,
            })
          } catch (err) {
            const msg = (err as Error).message ?? ''
            if (msg.includes('overloaded')) { overloaded = true; break }
            send(`*Error: ${msg}*`); done(); return
          }

          for (const block of response.content) {
            if (block.type === 'text' && block.text) send(block.text)
          }
          if (response.stop_reason !== 'tool_use') { done(); return }

          const toolUseBlocks = response.content.filter(
            (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
          )
          const toolResults = await Promise.all(
            toolUseBlocks.map(async (block) => ({
              type: 'tool_result' as const,
              tool_use_id: block.id,
              content: JSON.stringify(
                await executeToolCall(block.name, block.input as Record<string, unknown>)
              ),
            }))
          )

          conversationMsgs.push({ role: 'assistant', content: response.content })
          conversationMsgs.push({ role: 'user',      content: toolResults })
        }

        if (!overloaded) { done(); return }
        console.log('[chat] Claude overloaded — trying OpenAI')
      }

      // ── 2. OpenAI with tool use ───────────────────────────────────────────
      if ((isOpenAI || isAnthropic) && openaiKey) {
        try {
          const oai = new OpenAI({ apiKey: openaiKey })
          const oaiMsgs: OAIMessage[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          ]

          for (let iter = 0; iter < 5; iter++) {
            const oaiModel = isOpenAI ? model : 'gpt-4o-mini'
            const response = await oai.chat.completions.create({
              model: oaiModel,
              max_tokens: 2048,
              tools: OAI_TOOLS,
              tool_choice: 'auto',
              messages: oaiMsgs,
            })

            const msg = response.choices[0]?.message
            if (!msg) break

            oaiMsgs.push(msg)

            if (!msg.tool_calls?.length) {
              if (msg.content) send(msg.content)
              done(); return
            }

            // Execute tool calls in parallel
            await Promise.all(
              msg.tool_calls
                .filter(tc => tc.type === 'function')
                .map(async (tc) => {
                  const fn = (tc as { id: string; type: 'function'; function: { name: string; arguments: string } }).function
                  const result = await executeToolCall(fn.name, JSON.parse(fn.arguments) as Record<string, unknown>)
                  oaiMsgs.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) })
                })
            )
          }
          done(); return
        } catch (err) {
          console.log('[chat] OpenAI error:', (err as Error).message, '— trying Gemini')
        }
      }

      // ── 3. Gemini via OpenAI-compatible endpoint ──────────────────────────
      if ((isGemini || isAnthropic || isOpenAI) && geminiKey) {
        try {
          const gemini = new OpenAI({
            apiKey:  geminiKey,
            baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
          })
          const geminiMsgs: OAIMessage[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          ]

          for (let iter = 0; iter < 5; iter++) {
            const geminiModel = isGemini ? model : 'gemini-2.0-flash'
            const response = await gemini.chat.completions.create({
              model: geminiModel,
              max_tokens: 2048,
              tools: OAI_TOOLS,
              tool_choice: 'auto',
              messages: geminiMsgs,
            })

            const msg = response.choices[0]?.message
            if (!msg) break
            geminiMsgs.push(msg)

            if (!msg.tool_calls?.length) {
              if (msg.content) send(msg.content)
              done(); return
            }

            await Promise.all(
              msg.tool_calls
                .filter(tc => tc.type === 'function')
                .map(async (tc) => {
                  const fn = (tc as { id: string; type: 'function'; function: { name: string; arguments: string } }).function
                  const result = await executeToolCall(fn.name, JSON.parse(fn.arguments) as Record<string, unknown>)
                  geminiMsgs.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) })
                })
            )
          }
          done(); return
        } catch (err) {
          send(`*Error: ${(err as Error).message}*`)
        }
      }

      send('*Service temporarily unavailable. Please try again in a moment.*')
      done()
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
