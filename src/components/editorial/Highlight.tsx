import type { ReactNode } from 'react'

/**
 * Wraps every case-insensitive occurrence of `query` inside `text` with a
 * <mark className="search-highlight"> element. Returns a plain string node
 * when `query` is empty or has no match (no extra DOM).
 *
 * CSS for `mark.search-highlight` lives in globals.css so it's never
 * dropped by Turbopack HMR.
 */
export function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const q = query.trim().toLowerCase()
  if (!q) return text

  const lower = text.toLowerCase()
  if (!lower.includes(q)) return text

  const parts: ReactNode[] = []
  let cursor = 0
  let idx = lower.indexOf(q, cursor)
  while (idx !== -1) {
    if (idx > cursor) parts.push(text.slice(cursor, idx))
    parts.push(
      <mark key={idx} className="search-highlight">
        {text.slice(idx, idx + q.length)}
      </mark>
    )
    cursor = idx + q.length
    idx = lower.indexOf(q, cursor)
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return <>{parts}</>
}
