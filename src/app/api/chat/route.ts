import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { TOOLS, executeToolCall } from '@/lib/chat-tools'

export const dynamic    = 'force-dynamic'
export const maxDuration = 60 // seconds — tool loops need time

const SYSTEM_PROMPT = `You are SportsGPT AI — the authoritative source on Section XI high school football on Long Island, New York (Nassau and Suffolk counties).

## Tools First — No Guessing
You have tools that query the live database. ALWAYS use tools before answering questions about specific teams, players, records, or stats. Never guess or fabricate statistics.

- Call search_teams first whenever a team is mentioned
- Call get_top_players for passing, rushing, AND receiving to get a complete player picture
- Call get_team_records for season-by-season W-L history
- Call get_standings for division or league rankings
- Call get_team_games for a game-by-game schedule
- Call get_player_career for a specific player's multi-season stats

## Season Convention
Season integers → school year labels: 2025=2025-26 (current), 2024=2024-25, 2023=2023-24, 2022=2022-23, 2021=2021-22.
Always display as school-year format (e.g. "2025-26 season").

## Links
- Teams: [Team Name](/team/{team_slug}) using the full slug from search_teams (e.g. \`floyd-varsity-football\`)
- Players: [Player Name](/player/{player_slug}) — omit link if player_slug is null

## Formatting
- Markdown tables for stats
- Bold key numbers: **10-0**, **300 yards**, **5 TDs**
- Headers (##) to organize long responses — ALWAYS put headers on their own line, preceded by a blank line
- Always put a space after a colon when introducing a new sentence
- Team names: prefer short forms — say "Pat-Med", not "Patchogue-Medford Varsity Football"; "SWR", not "Shoreham-Wading River"

## Divisions
Division membership changes year to year. NEVER hard-code which teams are in a division — ALWAYS call get_standings with the division filter (e.g. \`get_standings({season: 2025, division: 'I'})\`) to get the canonical, current list before filtering or comparing.

## Follow-ups (REQUIRED)
ALWAYS end every response with a "## Follow-ups" section. List exactly 3 follow-up questions as bullet points starting with "- " and ending with "?".`

// Convert Anthropic tool defs → OpenAI function-calling format
const OAI_TOOLS: OpenAI.Chat.ChatCompletionTool[] = TOOLS.map(t => ({
  type: 'function' as const,
  function: { name: t.name, description: t.description, parameters: t.input_schema },
}))

type OAIMessage = OpenAI.Chat.ChatCompletionMessageParam

// Execute tool calls from an OpenAI-format response and append results
async function runOAITools(
  msg: OpenAI.Chat.ChatCompletionMessage,
  history: OAIMessage[],
  onToolResult?: (name: string, result: unknown) => void,
): Promise<boolean> {
  if (!msg.tool_calls?.length) return false
  history.push(msg)
  await Promise.all(
    msg.tool_calls
      .filter(tc => tc.type === 'function')
      .map(async (tc) => {
        const fn = (tc as { id: string; type: 'function'; function: { name: string; arguments: string } }).function
        const result = await executeToolCall(fn.name, JSON.parse(fn.arguments) as Record<string, unknown>)
        onToolResult?.(fn.name, result)
        history.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) })
      })
  )
  return true
}

export async function POST(req: NextRequest) {
  const { messages, model = 'gpt-4o' } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    model?: string
  }

  if (!messages?.length) {
    return new Response(JSON.stringify({ error: 'messages required' }), { status: 400 })
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY_SPORTSGPT2
  const openaiKey    = process.env.OPENAI_API_KEY_SPORTSGPT
  const geminiKey    = process.env.Gemini_API_Key
  const grokKey      = process.env.GROK_API_KEY

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      let hasEmittedText = false
      const send = (text: string) => {
        if (!text) return
        // Insert a blank line between separate text emissions so consecutive
        // sentences/headings don't run together when the model emits multiple
        // text blocks (per turn or across tool-use iterations).
        let out = text
        if (hasEmittedText) {
          const trimmedStart = out.replace(/^\s+/, '')
          if (trimmedStart.length > 0) out = '\n\n' + trimmedStart
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: out })}\n\n`))
        hasEmittedText = true
      }
      const done = () => {
        try {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch { /* already closed */ }
      }

      // SSE heartbeat comment — keeps Vercel connection alive during tool resolution
      controller.enqueue(encoder.encode(': tool-resolution\n\n'))

      // Track teams queried via search_teams so we can send them as metadata
      const queriedTeams = new Map<string, { slug: string; name: string }>()

      function trackTools(name: string, result: unknown) {
        if (name === 'search_teams' && Array.isArray(result)) {
          for (const t of result as Array<{ school_slug: string; name: string }>) {
            // result.name has already been normalized in chat-tools (Varsity Football
            // stripped, Pat-Med abbreviation applied) — use as-is for panel header.
            if (t.school_slug && t.name) queriedTeams.set(t.school_slug, { slug: t.school_slug, name: t.name })
          }
        }
      }

      const sendMeta = () => {
        if (queriedTeams.size > 0) {
          const teams = Array.from(queriedTeams.values())
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ meta: { teams } })}\n\n`))
        }
      }

      const isAnthropic = model.startsWith('claude-')
      const isOpenAI    = model.startsWith('gpt-')
      const isGemini    = model.startsWith('gemini-')
      const isGrok      = model.startsWith('grok-')

      // ── Helper: run OpenAI-compatible provider with tools ──────────────────
      async function tryOAIProvider(client: OpenAI, oaiModel: string): Promise<boolean> {
        const history: OAIMessage[] = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ]
        for (let i = 0; i < 5; i++) {
          const response = await client.chat.completions.create({
            model: oaiModel, max_tokens: 2048, tools: OAI_TOOLS, tool_choice: 'auto', messages: history,
          })
          const msg = response.choices[0]?.message
          if (!msg) break
          const usedTools = await runOAITools(msg, history, trackTools)
          if (!usedTools) { if (msg.content) send(msg.content); return true }
        }
        return true
      }

      // ── 1. Anthropic (Claude) ──────────────────────────────────────────────
      if (isAnthropic && anthropicKey) {
        try {
          const client = new Anthropic({ apiKey: anthropicKey })
          type AnthMsg = Anthropic.Messages.MessageParam
          const history: AnthMsg[] = messages.map(m => ({ role: m.role, content: m.content }))

          for (let i = 0; i < 5; i++) {
            const response = await client.messages.create({
              model, max_tokens: 2048, system: SYSTEM_PROMPT, tools: TOOLS, messages: history,
            })
            for (const block of response.content) {
              if (block.type === 'text' && block.text) send(block.text)
            }
            if (response.stop_reason !== 'tool_use') { sendMeta(); done(); return }
            const toolBlocks = response.content.filter(
              (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
            )
            const toolResults = await Promise.all(toolBlocks.map(async b => {
              const result = await executeToolCall(b.name, b.input as Record<string, unknown>)
              trackTools(b.name, result)
              return { type: 'tool_result' as const, tool_use_id: b.id, content: JSON.stringify(result) }
            }))
            history.push({ role: 'assistant', content: response.content })
            history.push({ role: 'user', content: toolResults })
          }
          sendMeta(); done(); return
        } catch (err) {
          console.error('[chat] Claude error:', (err as Error).message, '— trying fallback')
        }
      }

      // ── 2. OpenAI ─────────────────────────────────────────────────────────
      if ((isOpenAI || isAnthropic) && openaiKey) {
        try {
          const oaiModel = isOpenAI ? model : 'gpt-4o-mini'
          await tryOAIProvider(new OpenAI({ apiKey: openaiKey }), oaiModel)
          sendMeta(); done(); return
        } catch (err) {
          console.error('[chat] OpenAI error:', (err as Error).message, '— trying Gemini')
        }
      }

      // ── 3. Gemini ─────────────────────────────────────────────────────────
      if ((isGemini || isAnthropic || isOpenAI) && geminiKey) {
        try {
          const geminiModel = isGemini ? model : 'gemini-2.0-flash'
          await tryOAIProvider(
            new OpenAI({ apiKey: geminiKey, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' }),
            geminiModel,
          )
          sendMeta(); done(); return
        } catch (err) {
          console.error('[chat] Gemini error:', (err as Error).message, '— trying Grok')
        }
      }

      // ── 4. Grok (xAI) — only when explicitly selected ────────────────────
      if (isGrok && grokKey) {
        try {
          await tryOAIProvider(new OpenAI({ apiKey: grokKey, baseURL: 'https://api.x.ai/v1' }), model)
          sendMeta(); done(); return
        } catch (err) {
          console.error('[chat] Grok error:', (err as Error).message)
          send(`*Error: ${(err as Error).message}*`)
        }
      }

      send('*Service temporarily unavailable. Please try again.*')
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
