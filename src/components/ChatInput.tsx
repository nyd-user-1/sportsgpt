'use client'

import { useState, useRef } from 'react'
import { MapPin, Mic, ArrowUp } from 'lucide-react'
import { PlusMenu } from '@/components/PlusMenu'

export function ChatInput() {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`
  }

  const handleInputChange = (value: string) => {
    setInput(value)
    autoResize()
  }

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 pt-3 pb-3 transition-all gap-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">

      {/* ChatTextArea */}
      <div className="flex items-start">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) e.preventDefault() }}
          placeholder="Ask about childcare..."
          className="flex-1 resize-none bg-transparent py-1 text-[17px] text-[var(--txt)] placeholder:text-[var(--muted2)] outline-none leading-relaxed"
          style={{ minHeight: '40px' }}
        />
      </div>

      {/* ChatToolBar */}
      <div className="flex items-center pt-1">
        {/* IconPlus */}
        <PlusMenu onSelect={t => { handleInputChange(t); textareaRef.current?.focus() }} />
        {/* IconMapPin */}
        <button type="button" className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-black/7 hover:text-[var(--txt)] transition-colors">
          <MapPin className="h-4 w-4" />
        </button>
        {/* IconMic */}
        <button type="button" className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-black/7 hover:text-[var(--txt)] transition-colors">
          <Mic className="h-4 w-4" />
        </button>
        <div className="flex-1" />
        {/* ButtonSendChat */}
        <button
          type="button"
          disabled={!input.trim()}
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a1a1a] text-white disabled:opacity-25 hover:opacity-80 transition-opacity"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

    </div>
  )
}
