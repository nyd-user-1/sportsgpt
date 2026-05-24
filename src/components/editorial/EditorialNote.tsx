import type { ReactNode } from 'react'

export type EditorialNoteEntry = { label: string; body: ReactNode }

export function EditorialNote({
  entries,
  className = '',
}: {
  entries: EditorialNoteEntry[]
  className?: string
}) {
  return (
    <div
      className={`max-w-[68ch] text-[12.5px] leading-[1.7] text-[var(--paper-muted)] ${className}`}
      style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
    >
      {entries.map((entry, i) => (
        <p key={i} className={`flex gap-3 ${i > 0 ? 'mt-1' : ''}`}>
          <span
            className="not-italic shrink-0 text-[9.5px] uppercase tracking-[0.22em] text-[var(--paper-faint)] mt-[3px]"
            style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
          >
            {entry.label}
          </span>
          <span>{entry.body}</span>
        </p>
      ))}
    </div>
  )
}
