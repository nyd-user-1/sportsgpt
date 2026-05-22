'use client'

import { useState, useCallback, useRef } from 'react'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: Message = { id: generateId(), role: 'user', content }
    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)

    // 6-message memory window
    const prevMessages = [...messages.slice(-6), { role: 'user' as const, content }]

    const assistantId = generateId()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: prevMessages }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let built = ''
      let flushTimer: ReturnType<typeof setTimeout> | null = null

      const flush = () => {
        const snapshot = built
        setMessages(prev => {
          const existing = prev.find(m => m.id === assistantId)
          if (existing) return prev.map(m => m.id === assistantId ? { ...m, content: snapshot } : m)
          return [...prev, { id: assistantId, role: 'assistant' as const, content: snapshot }]
        })
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
            if (parsed.text) {
              built += parsed.text
              if (flushTimer === null) flushTimer = setTimeout(flush, 40)
            }
          } catch { /* skip malformed chunks */ }
        }
      }

      if (flushTimer !== null) { clearTimeout(flushTimer); flushTimer = null }
      flush()

    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        const msg = (err as Error).message || 'Failed to get response'
        setMessages(prev => {
          const existing = prev.find(m => m.id === assistantId)
          if (existing) return prev.map(m => m.id === assistantId ? { ...m, content: `*Error: ${msg}*` } : m)
          return [...prev, { id: assistantId, role: 'assistant' as const, content: `*Error: ${msg}*` }]
        })
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
