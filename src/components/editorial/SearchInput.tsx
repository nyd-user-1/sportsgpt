'use client'

import type { RefObject } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MONO } from './Tablet'

/**
 * Editorial search input — rounded paper-rule border, search icon, kbd hint
 * for the `Cmd/Ctrl + /` shortcut. Pair with `useSearchHotkey` to wire the
 * shortcut and `Esc` to clear.
 */
export function SearchInput({
  value,
  onChange,
  inputRef,
  placeholder = 'Search…',
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  inputRef?: RefObject<HTMLInputElement | null>
  placeholder?: string
  className?: string
}) {
  return (
    <label className={cn('relative flex-1 min-w-[200px] max-w-md', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--paper-faint)]" />
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-12 py-2 text-sm bg-transparent border border-[var(--paper-rule)] rounded-full focus:outline-none focus:border-[var(--paper-text)] focus:bg-[var(--paper-quiet)] placeholder:text-[var(--paper-faint)] text-[var(--paper-text)] transition-colors"
      />
      <kbd
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded border border-[var(--paper-rule)] text-[var(--paper-faint)] bg-[var(--paper-quiet)] hidden sm:block"
        style={MONO}
      >
        ⌘/
      </kbd>
    </label>
  )
}
