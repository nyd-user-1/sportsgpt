export function FormulaTablet({ text, className = '' }: { text: string; className?: string }) {
  // Split around '=' so the LHS reads as the metric label and the RHS as the expression.
  const eqIdx = text.indexOf('=')
  const lhs = eqIdx >= 0 ? text.slice(0, eqIdx).trim() : null
  const rhs = eqIdx >= 0 ? text.slice(eqIdx + 1).trim() : text

  return (
    <div className={`inline-flex max-w-full ${className}`}>
      <div
        className="flex items-stretch border border-[var(--paper-rule)] bg-[var(--paper-quiet)] overflow-hidden"
        style={{ borderRadius: 3 }}
      >
        {lhs && (
          <>
            <div
              className="flex items-center px-4 py-2.5 text-[var(--paper-strong)] text-[13px] tracking-wide"
              style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', fontWeight: 600 }}
            >
              {lhs}
            </div>
            <div
              className="flex items-center px-3 text-[var(--paper-faint)] text-base border-l border-[var(--paper-rule)]"
              style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
            >
              =
            </div>
          </>
        )}
        <div
          className="flex items-center px-4 py-2.5 text-[var(--paper-text)] text-[13.5px]"
          style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
        >
          {rhs}
        </div>
      </div>
    </div>
  )
}
