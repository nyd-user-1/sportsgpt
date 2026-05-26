import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { TABLET_RADIUS } from './PaperBridge'

/**
 * Scrollable data table container — paper-rule border, rounded tablet corners,
 * horizontal + vertical scroll, sticky-header-ready overflow context.
 *
 * Wrap a <table> directly inside:
 *   <ScrollTable>
 *     <table className="w-full text-sm">…</table>
 *   </ScrollTable>
 *
 * `maxH` controls the scrollable height (default 500px). Pass `maxH={0}` to
 * remove the vertical scroll cap (full-height table).
 */
export function ScrollTable({
  children,
  maxH = 500,
  className,
}: {
  children: ReactNode
  maxH?: number
  className?: string
}) {
  return (
    <div
      className={cn('border border-[var(--paper-rule)] bg-[var(--paper-quiet)] overflow-x-auto overflow-y-auto [&_thead_th]:!bg-[color:color-mix(in_srgb,var(--paper-text)_3.5%,var(--paper))]', className)}
      style={{ borderRadius: TABLET_RADIUS, maxHeight: maxH > 0 ? maxH : undefined }}
    >
      {children}
    </div>
  )
}
