'use client'

import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { ArrowUp, Square, MapPin, Mic } from 'lucide-react'
import { PlusMenu } from '@/components/PlusMenu'
import { CHAT_PLACEHOLDER } from '@/lib/app-config'

export interface ChatInputHandle {
  injectPrompt: (text: string) => void
}

interface Props {
  onSend?: (message: string) => void
  onStop?: () => void
  isStreaming?: boolean
}

export const ChatInput = forwardRef<ChatInputHandle, Props>(function ChatInput(
  { onSend, onStop, isStreaming = false },
  ref
) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useImperativeHandle(ref, () => ({
    injectPrompt: (text: string) => {
      setInput(text)
      setTimeout(() => textareaRef.current?.focus(), 0)
    },
  }))

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`
  }, [input])

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    onSend?.(trimmed)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 pt-3 pb-3 transition-all gap-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">

      {/* Textarea */}
      <div className="flex items-start">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={CHAT_PLACEHOLDER}
          className="flex-1 resize-none bg-transparent py-1 text-[17px] text-[var(--txt)] placeholder:text-[var(--muted2)] outline-none leading-relaxed"
          style={{ minHeight: '40px' }}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center pt-1">
        <PlusMenu onSelect={t => { setInput(t); textareaRef.current?.focus() }} />
        <button type="button" className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-black/7 hover:text-[var(--txt)] transition-colors">
          <MapPin className="h-4 w-4" />
        </button>
        <button type="button" className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-black/7 hover:text-[var(--txt)] transition-colors">
          <Mic className="h-4 w-4" />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={isStreaming ? onStop : handleSubmit}
          disabled={!isStreaming && !input.trim()}
          className={`ml-1 flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:opacity-25 ${
            isStreaming
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-[#1a1a1a] hover:opacity-80 text-white'
          }`}
        >
          {isStreaming ? <Square className="h-4 w-4" fill="currentColor" /> : <ArrowUp className="h-4 w-4" />}
        </button>
      </div>

    </div>
  )
})
