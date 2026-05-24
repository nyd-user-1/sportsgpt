'use client'

import { useEffect, useRef, type RefObject } from 'react'

/**
 * Wires the shared editorial search shortcut: `Cmd/Ctrl + /` focuses and
 * selects the input, `Esc` clears (via the provided callback) and blurs.
 *
 * Pass the same ref you give to `<SearchInput inputRef={...}>`.
 * `onClear` is captured via ref, so callers don't need to memoize it.
 */
export function useSearchHotkey(
  inputRef: RefObject<HTMLInputElement | null>,
  onClear: () => void,
) {
  const clearRef = useRef(onClear)
  useEffect(() => { clearRef.current = onClear }, [onClear])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        clearRef.current()
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inputRef])
}
