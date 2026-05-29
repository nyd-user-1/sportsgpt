import type { Result } from '@/lib/search'

// Fire-and-forget click logger for search/chat result cards. The server keys by
// normalized query stem and keeps only the most-clicked rows (capped), so this
// teaches the ranking which result a query usually resolves to. Only call this
// for actual result-card clicks — never recents, quick-nav, or hub headers.
export function logSearchClick(query: string, r: Result): void {
  const q = query.trim()
  if (!q) return
  try {
    fetch('/api/search-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, key: r.key, type: r.type, label: r.displayName }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Never let logging break navigation.
  }
}
