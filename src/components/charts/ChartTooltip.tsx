/**
 * Shared tooltip shell for all recharts custom tooltips.
 * Uses the paper palette so it matches the editorial panel design.
 */
export function ChartTooltipShell({ children, minWidth = 140 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div style={{
      background: 'var(--paper)',
      border: '1px solid var(--paper-rule)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      minWidth,
      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
    }}>
      {children}
    </div>
  )
}
