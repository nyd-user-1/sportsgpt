export type Tier = 1 | 2 | 3

const LABELS: Record<Tier, string> = {
  1: 'Standard',
  2: 'Foundational',
  3: 'Advanced',
}

export function TierIndicator({
  tier,
  size = 5,
  className = '',
}: {
  tier: Tier
  size?: number
  className?: string
}) {
  return (
    <span
      role="img"
      aria-label={`${LABELS[tier]} tier (${tier} of 3)`}
      className={`inline-flex items-center align-middle ${className}`}
      style={{ gap: Math.max(2, Math.round(size * 0.6)) }}
    >
      {[1, 2, 3].map(n => (
        <span
          key={n}
          aria-hidden
          className="block rounded-full bg-current"
          style={{
            width: size,
            height: size,
            opacity: n <= tier ? 1 : 0.18,
          }}
        />
      ))}
    </span>
  )
}

export function tierLabel(tier: Tier) {
  return LABELS[tier]
}
