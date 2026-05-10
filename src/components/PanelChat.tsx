'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, MapPin } from 'lucide-react'
import { AppLogo } from '@/components/AppLogo'
import { AppPanel } from './AppPanel'
import { APP_NAME, ACCENT_COLOR } from '@/lib/app-config'

type Message = { id: string; role: 'user' | 'assistant'; content: string }

export function PanelChat({
  open,
  onClose,
  countyName,
}: {
  open: boolean
  onClose: () => void
  countyName: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (open) setMessages([]) }, [open, countyName])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const submit = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: trimmed }])
    setInput('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `AI integration coming soon. Explore childcare data for ${countyName} County using the panels and map.`,
    }])
    setLoading(false)
  }

  const footer = (
    <div className="px-4 py-3 space-y-2">
      {/* County context chip */}
      <div className="flex items-center gap-1.5 text-xs text-sky-500 font-medium">
        <MapPin className="h-3 w-3 shrink-0" />
        <span>{countyName} County, New York</span>
      </div>
      {/* Input */}
      <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--inp-bg)] px-3 py-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(input) }}
          placeholder="Ask about this county..."
          className="flex-1 bg-transparent text-sm text-[var(--txt)] placeholder:text-[var(--muted2)] outline-none"
        />
        <button
          onClick={() => submit(input)}
          disabled={!input.trim() || loading}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a1a1a] text-white disabled:opacity-25 hover:opacity-80 transition-opacity"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-[10px] text-[var(--muted2)] text-center">GPT-4o mini</p>
    </div>
  )

  return (
    <AppPanel open={open} onClose={onClose} title={APP_NAME} footer={footer}>
      <div className="px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 pt-12 text-center">
            <AppLogo className="h-10 w-10" />
            <p className="text-sm text-[var(--muted)] max-w-[200px]">
              Ask anything about childcare in this county.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mr-2 mt-0.5" style={{ background: ACCENT_COLOR }}>
                    <AppLogo className="h-3 w-3" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[var(--txt)] text-[var(--bg)] rounded-br-sm'
                    : 'bg-[var(--inp-bg)] text-[var(--txt)] rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--inp-bg)] rounded-2xl rounded-bl-sm px-3 py-2">
                  <span className="inline-block w-1.5 h-3.5 bg-[var(--muted)] animate-pulse" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </AppPanel>
  )
}
