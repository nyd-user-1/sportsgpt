import React from 'react'

/**
 * Shared tooltip primitives for all recharts custom tooltips.
 *
 * Every chart composes its tooltip from these building blocks.
 * A single change here propagates to every chart automatically.
 *
 * Exports:
 *   ChartTooltipShell   — outer dark card (border, shadow, padding)
 *   ChartTooltipName    — logo + name row (Fraunces, auto-strips "Varsity Football")
 *   ChartTooltipRow     — swatch + DM Sans label + mono value
 *   ChartTooltipDivider — thin rule between sections
 *   ChartTooltipTeam    — composed: Shell + Name + Row + optional record (covers most charts)
 *   stripVarsity        — utility: removes " Varsity Football" / " Football" suffix
 */

// ── Font constants ─────────────────────────────────────────────────────────────

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans), system-ui, sans-serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono), ui-monospace, monospace' }

// ── Utility ───────────────────────────────────────────────────────────────────

export function stripVarsity(n: string): string {
  return n.replace(/\s+Varsity\s+Football$/i, '').replace(/\s+Football$/i, '')
}

// ── Shell ─────────────────────────────────────────────────────────────────────

/** Outer dark card — background, border, shadow, padding. */
export function ChartTooltipShell({
  children,
  minWidth = 140,
}: {
  children: React.ReactNode
  minWidth?: number
}) {
  return (
    <div style={{
      background:   'var(--paper)',
      border:       '1px solid var(--paper-rule)',
      borderRadius: 8,
      padding:      '10px 12px',
      minWidth,
      boxShadow:    '0 4px 20px rgba(0,0,0,0.22)',
      ...SANS,
      fontSize: 12,
    }}>
      {children}
    </div>
  )
}

// ── Name row ──────────────────────────────────────────────────────────────────

/**
 * Logo + name. Name is auto-stripped of "Varsity Football".
 * Use at the top of every tooltip that identifies a team or player.
 */
export function ChartTooltipName({
  name,
  logoUrl,
  size = 28,
}: {
  name: string
  logoUrl?: string
  size?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      {logoUrl && (
        <img
          src={logoUrl} alt="" width={size} height={size}
          style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
      )}
      <span style={{
        ...SERIF,
        fontSize: 14, fontWeight: 500, letterSpacing: '-0.005em',
        color: 'var(--paper-text)', lineHeight: 1.2,
      }}>
        {stripVarsity(name)}
      </span>
    </div>
  )
}

// ── Stat row ──────────────────────────────────────────────────────────────────

/**
 * One stat row: optional color swatch · DM Sans label · mono value flush right.
 * Pass `valueColor` to override the default `--paper-text` on the value.
 * Omit `color` to skip the swatch (e.g. record lines, median).
 */
export function ChartTooltipRow({
  color,
  label,
  value,
  valueColor,
}: {
  color?: string
  label: string
  value: string | number
  valueColor?: string
}) {
  const formatted = typeof value === 'number' ? value.toLocaleString() : value
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
      {color && (
        <span style={{
          display: 'inline-block', width: 8, height: 8,
          borderRadius: 2, backgroundColor: color, flexShrink: 0,
        }} />
      )}
      <span style={{ ...SANS, fontSize: 12, color: 'var(--paper-muted)' }}>{label}</span>
      <span style={{
        ...MONO,
        marginLeft: 'auto', paddingLeft: 8,
        fontWeight: 500, fontSize: 13,
        color: valueColor ?? 'var(--paper-text)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {formatted}
      </span>
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────

/** Thin rule for separating sections (e.g. season rows from totals). */
export function ChartTooltipDivider() {
  return <div style={{ borderTop: '1px solid var(--paper-rule)', margin: '7px 0' }} />
}

// ── Composed: standard team / player tooltip ──────────────────────────────────

/**
 * The most common tooltip pattern — covers ~6 of 8 chart types:
 * Shell → Name (logo + stripped name) → single stat Row → optional record line.
 *
 * For complex multi-row tooltips (Dynasty, Scatter) compose manually using
 * ChartTooltipShell + ChartTooltipName + ChartTooltipRow + ChartTooltipDivider.
 */
export function ChartTooltipTeam({
  name,
  logoUrl,
  color,
  label,
  value,
  record,
  minWidth,
}: {
  name: string
  logoUrl?: string
  color?: string
  label: string
  value: string | number
  record?: string
  minWidth?: number
}) {
  return (
    <ChartTooltipShell minWidth={minWidth}>
      <ChartTooltipName name={name} logoUrl={logoUrl} />
      <ChartTooltipRow color={color ?? '#033882'} label={label} value={value} />
      {record && (
        <div style={{ ...SANS, color: 'var(--paper-faint)', marginTop: 5, fontSize: 11 }}>
          {record}
        </div>
      )}
    </ChartTooltipShell>
  )
}
