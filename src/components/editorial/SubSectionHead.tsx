import type { ReactNode } from 'react'

/**
 * H3-level editorial sub-section heading — Fraunces serif, italic, lightweight.
 * Sits inside a SectionHead section to introduce a named sub-group
 * (e.g. "Passing", "Rushing", "Receiving" within Player Logs).
 *
 * Hierarchy:
 *   EditorialHead  → H1  page title
 *   SectionHead    → H2  major section (with rule + blurb)
 *   SubSectionHead → H3  sub-group within a section  ← this component
 */
export function SubSectionHead({ children }: { children: ReactNode }) {
  return (
    <h3
      className="mb-4 text-[18px] text-[var(--paper-text)]"
      style={{
        fontFamily: 'var(--font-display), Georgia, serif',
        fontStyle: 'italic',
        fontWeight: 400,
      }}
    >
      {children}
    </h3>
  )
}
