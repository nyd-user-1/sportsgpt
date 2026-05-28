/**
 * Hairline rule with centered mono kicker — the "Volume V · No. 1" stamp under
 * the masthead. Carries the almanac concept in a single line.
 */
export function VolumeRule({ label }: { label: string }) {
  return (
    <div className="mt-10 flex items-center gap-4 select-none">
      <span aria-hidden className="flex-1 h-px bg-[var(--paper-rule)]" />
      <span
        className="text-[10px] uppercase tracking-[0.34em] text-[var(--paper-faint)] tabular-nums"
        style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
      >
        — {label} —
      </span>
      <span aria-hidden className="flex-1 h-px bg-[var(--paper-rule)]" />
    </div>
  )
}
