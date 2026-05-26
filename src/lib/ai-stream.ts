import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

/**
 * Streams a chat completion as text/plain chunks.
 *
 * Provider selection:
 *   - OPENROUTER_API_KEY set  → OpenRouter (OpenAI-compatible)
 *   - else ANTHROPIC_API_KEY_SPORTSGPT2 → direct Anthropic SDK
 *   - else → an inline error message
 *
 * The shape on either path is identical from the caller's perspective:
 * a ReadableStream that emits raw text. Used by /api/game/[id]/highlights
 * and /api/player/[slug]/recap.
 */

const ANTHROPIC_MODEL  = 'claude-haiku-4-5-20251001'
const OPENROUTER_MODEL = 'anthropic/claude-haiku-4.5'

export function streamChatResponse({
  system,
  user,
  errorPrefix = 'Unable to generate response',
  maxTokens   = 1024,
}: {
  system: string
  user: string
  errorPrefix?: string
  maxTokens?: number
}): ReadableStream<Uint8Array> {
  const encoder        = new TextEncoder()
  const openrouterKey  = process.env.OPENROUTER_API_KEY
  const anthropicKey   = process.env.ANTHROPIC_API_KEY_SPORTSGPT2

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (s: string) => {
        try { controller.enqueue(encoder.encode(s)) } catch { /* closed */ }
      }
      const close = () => { try { controller.close() } catch { /* already closed */ } }

      try {
        if (openrouterKey) {
          const client = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey:  openrouterKey,
          })
          const stream = await client.chat.completions.create({
            model:      OPENROUTER_MODEL,
            stream:     true,
            max_tokens: maxTokens,
            messages: [
              { role: 'system', content: system },
              { role: 'user',   content: user },
            ],
          })
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) enqueue(text)
          }
        } else if (anthropicKey) {
          const client = new Anthropic({ apiKey: anthropicKey })
          const stream = client.messages.stream({
            model:      ANTHROPIC_MODEL,
            max_tokens: maxTokens,
            system,
            messages: [{ role: 'user', content: user }],
          })
          stream.on('text', enqueue)
          stream.on('error', (err) => {
            console.error('[ai-stream] anthropic error:', err.message)
            enqueue(`\n\n*${errorPrefix}: ${err.message}*`)
          })
          await stream.finalMessage().catch(() => { /* errored, already enqueued */ })
        } else {
          enqueue(`*${errorPrefix}: no AI provider configured*`)
        }
      } catch (err) {
        const msg = (err as Error).message
        console.error('[ai-stream] error:', msg)
        enqueue(`\n\n*${errorPrefix}: ${msg}*`)
      } finally {
        close()
      }
    },
  })
}
