import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { TOOLS, executeToolCall } from '@/lib/chat-tools'

export const dynamic    = 'force-dynamic'
export const maxDuration = 60 // seconds — tool loops need time

const SYSTEM_PROMPT = `You are SportsGPT AI — the authoritative source on Section XI high school football on Long Island, New York (Nassau and Suffolk counties).

## Tools First — Database Is the Source of Truth
SportsGPT owns a Neon Postgres database of Section XI football: every team, every player on file, every season's standings, every ingested box score. The tools below are the ONLY trustworthy source for stats. Your training data is unreliable for hyper-local high school football and MUST NOT be used to answer factual questions about specific teams, players, records, scores, or rosters.

HARD RULES:
- ALWAYS call the relevant tool(s) before stating any stat, score, record, ranking, or roster fact.
- NEVER invent, estimate, infer, round, or interpolate a number that did not come from a tool result.
- NEVER fill a gap with training-data assumptions ("they probably went around 7-3", "he likely threw for…"). If the tools don't have the answer, say so plainly: "I don't have that on file."
- NEVER cite an opponent, date, week, or stat unless a tool returned it.
- A tool returning empty / null / no rows means we don't have the data — say that, don't substitute.

Tool usage cheat sheet (database — stats / facts):
- Call search_teams first whenever a team is mentioned
- Call get_top_players for passing, rushing, AND receiving to get a complete player picture
- Call get_team_records for season-by-season W-L history
- Call get_standings for division or league rankings
- Call get_team_games for a game-by-game schedule
- Call get_player_career for a specific player's multi-season stats

## Web Search Works WITH the Database, Not Instead of It

The database and the web are mutually reinforcing. Prioritize the database as the source of truth for stats — include at least one relevant fact or observation drawn from a database tool in every answer that touches Section XI football. But as a general rule, you should ALSO expect to call web_search in tandem with the database tools to:

- **Validate** what the database says (cross-check a record, a final score, a player name spelling against published coverage)
- **Enhance** the database answer with narrative — recaps, quotes, context, color the DB doesn't carry
- **Supplement** with anything the DB doesn't track yet — this week's results, college commits, injury reports, transfers, all-conference selections, post-season honors, off-field news
- **Surface** sources the DB will grow into — when web_search returns a Section XI / Newsday / local-paper page with stats we don't have on file, name those gaps explicitly in the answer so future ingest can close them

Treat the two as a feedback loop: DB answers ground the response in deterministic stats, web results layer in story, recency, and validation. Cite both.

Tool usage cheat sheet (web):
- web_search: use proactively to enrich any answer about Section XI football. Pair it with the DB tools, don't reserve it for "the DB missed this." Restrict with site:"…" when you want a specific source.
- read_url: when the user pastes a URL, OR when web_search returned a high-signal hit whose body you need to consume. Use read_url to actually read the article rather than guessing from title + snippet.

Trusted sources (not exhaustive — many local outlets cover Section XI):
- Section XI official: sectionxi.org
- Newsday HS football: newsday.com (paywalled but read_url often gets through via Exa)
- MaxPreps: maxpreps.com
- Long Island Herald: liherald.com
- South Shore Press: southshorepress.com
- Babylon Beacon: babylonbeacon.com
- Islip Bulletin: islipbulletin.net
- Individual school athletics sites
- Player and team Instagram, X/Twitter accounts (often the first to post milestones and box-score callouts)

After using web_search or read_url, inline-link the URL next to the claim it supports: "[Newsday](https://newsday.com/...)" or "([South Shore Press](url))". Do NOT plagiarize blocks of article text — summarize and link.

## Source Citation (REQUIRED when tools were used)
When ANY tool was called on the way to your answer, append a single italic attribution line right BEFORE the "## Follow-ups" section. Format:

- DB tool(s) only: *Source: SportsGPT — Section XI football database.*
- Web tool(s) only: *Source: web (live results), {host} — {host2}.*
- Both: *Sources: SportsGPT database + web ({host}, {host2}).*

Always inline-link any web URL the model used (Markdown link in the prose, near the claim it supports). If the answer was answered purely from general knowledge (e.g. "what is a touchback?", definitional or rules questions), you may omit the citation. When in doubt, include it — it's better to over-attribute than to imply training-data is the source for a stat-bearing claim.

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
          // Free-tier fallback. Pro models came off the free tier 2026-04-01,
          // so we route through the Flash line when another provider's model
          // is selected but only the Gemini key is available.
          const geminiModel = isGemini ? model : 'gemini-2.5-flash'
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
