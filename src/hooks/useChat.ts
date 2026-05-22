'use client'

import { useState, useCallback, useRef } from 'react'

export interface ChatMeta {
  teams: Array<{ slug: string; name: string }>
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  meta?: ChatMeta
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function friendlyError(raw: string): string {
  try {
    const parsed = JSON.parse(raw)
    const type = parsed?.error?.type ?? parsed?.type ?? ''
    const msg  = parsed?.error?.message ?? parsed?.message ?? ''
    if (type === 'overloaded_error' || msg.toLowerCase().includes('overload')) {
      return 'Anthropic is overloaded right now. Please try again in a moment.'
    }
    if (msg) return msg
  } catch { /* not JSON */ }
  return raw
}

async function fetchStream(
  prevMessages: { role: 'user' | 'assistant'; content: string }[],
  signal: AbortSignal,
  model: string,
  retries = 1,
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: prevMessages, model }),
    signal,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  // Peek at the first chunk to detect an overload error before committing
  const first = await reader.read()
  if (first.done) return reader

  const text = new TextDecoder().decode(first.value)
  if (text.includes('overloaded_error') && retries > 0) {
    await new Promise(r => setTimeout(r, 1500))
    return fetchStream(prevMessages, signal, model, retries - 1)
  }

  // Return a reader that replays the first chunk
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()
  writer.write(first.value)
  ;(async () => {
    while (true) {
      const { done, value } = await reader.read()
      if (done) { writer.close(); break }
      writer.write(value)
    }
  })()
  return readable.getReader()
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string, model = 'gpt-4o') => {
    const userMsg: Message = { id: generateId(), role: 'user', content }
    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)

    const prevMessages = [...messages.slice(-6), { role: 'user' as const, content }]

    const assistantId = generateId()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant' as const, content: '' }])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const reader = await fetchStream(prevMessages, controller.signal, model)

      const decoder = new TextDecoder()
      let built = ''
      let flushTimer: ReturnType<typeof setTimeout> | null = null

      const flush = () => {
        const snapshot = built
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: snapshot } : m))
        flushTimer = null
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) throw new Error(friendlyError(parsed.error))
            if (parsed.meta) {
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, meta: parsed.meta as ChatMeta } : m))
            }
            if (parsed.text) {
              built += parsed.text
              if (flushTimer === null) flushTimer = setTimeout(flush, 40)
            }
          } catch (e) {
            if (!(e instanceof SyntaxError)) throw e
          }
        }
      }

      if (flushTimer !== null) { clearTimeout(flushTimer); flushTimer = null }
      flush()

    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        const raw = (err as Error).message || 'Something went wrong. Please try again.'
        const msg = friendlyError(raw)
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: `*${msg}*` } : m
        ))
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [messages])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return { messages, isStreaming, sendMessage, stopStreaming, clearMessages }
}
