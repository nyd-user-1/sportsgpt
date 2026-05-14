'use client'

import * as React from 'react'
import { ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
  }
>

type ChartContextValue = { config: ChartConfig }
const ChartContext = React.createContext<ChartContextValue | null>(null)

export function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) throw new Error('useChart must be used within <ChartContainer />')
  return ctx
}

// ── ChartStyle ─────────────────────────────────────────────────────────────────

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const vars = Object.entries(config)
    .filter(([, v]) => v.color)
    .map(([k, v]) => `  --color-${k}: ${v.color};`)
    .join('\n')
  if (!vars) return null
  return (
    <style dangerouslySetInnerHTML={{ __html: `[data-chart="${id}"] {\n${vars}\n}` }} />
  )
}

// ── ChartContainer ─────────────────────────────────────────────────────────────

interface ChartContainerProps extends React.ComponentProps<'div'> {
  config: ChartConfig
  children: React.ComponentProps<typeof ResponsiveContainer>['children']
}

export function ChartContainer({ id, className, children, config, ...props }: ChartContainerProps) {
  const uid = React.useId()
  const chartId = `chart-${id ?? uid.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          'flex aspect-video justify-center text-xs',
          '[&_.recharts-cartesian-axis-tick_text]:fill-[var(--muted)]',
          '[&_.recharts-cartesian-grid_line[stroke="#ccc"]]:stroke-[var(--border)]',
          '[&_.recharts-cartesian-grid_line]:stroke-[var(--border)]',
          '[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-[var(--inp-bg)]',
          '[&_.recharts-sector]:outline-none',
          '[&_.recharts-surface]:outline-none',
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

// ── ChartTooltip ───────────────────────────────────────────────────────────────

export const ChartTooltip = Tooltip

// ── ChartTooltipContent ────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  dataKey?: string | number
  name?: string
  value?: string | number
  payload?: Record<string, unknown>
  color?: string
  fill?: string
}

interface ChartTooltipContentProps extends React.ComponentProps<'div'> {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: 'line' | 'dot' | 'dashed'
  nameKey?: string
  labelKey?: string
  labelFormatter?: (value: string | number, payload: TooltipPayloadItem[]) => React.ReactNode
  formatter?: (value: string | number, name: string, item: TooltipPayloadItem, index: number) => React.ReactNode
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  labelFormatter,
  formatter,
  nameKey,
}: ChartTooltipContentProps) {
  const { config } = useChart()

  if (!active || !payload?.length) return null

  const tooltipLabel = (() => {
    if (hideLabel) return null
    const value = labelFormatter ? labelFormatter(label ?? '', payload) : (label ?? '')
    if (!value && value !== 0) return null
    return <div className="font-medium mb-1">{value}</div>
  })()

  return (
    <div
      className={cn(
        'border border-[var(--border)] bg-[var(--surface)] shadow-xl grid min-w-[8rem] gap-1.5 rounded-lg px-2.5 py-1.5 text-xs',
        className
      )}
    >
      {tooltipLabel}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = nameKey ?? item.name ?? String(item.dataKey) ?? 'value'
          const cfgEntry = config[key]
          const indicatorColor = item.fill || item.color

          return (
            <div
              key={String(item.dataKey ?? index)}
              className={cn('flex w-full items-center gap-2', indicator === 'dot' && 'items-center')}
            >
              {formatter && item.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index)
              ) : (
                <>
                  {!hideIndicator && (
                    <div
                      className={cn('shrink-0 rounded-[2px]', {
                        'h-2.5 w-2.5': indicator === 'dot',
                        'h-4 w-1': indicator === 'line',
                        'h-0 w-3 border-t-2 border-dashed': indicator === 'dashed',
                      })}
                      style={{ backgroundColor: indicator !== 'dashed' ? indicatorColor : undefined, borderColor: indicator === 'dashed' ? indicatorColor : undefined }}
                    />
                  )}
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <span className="text-[var(--muted)]">
                      {cfgEntry?.label ?? item.name}
                    </span>
                    {item.value !== undefined && (
                      <span className="font-mono font-medium tabular-nums text-[var(--txt)]">
                        {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── ChartLegend ────────────────────────────────────────────────────────────────

export const ChartLegend = Legend

interface ChartLegendContentProps extends React.ComponentProps<'div'> {
  payload?: Array<{ value?: string; color?: string; dataKey?: string | number }>
  verticalAlign?: 'top' | 'bottom'
  hideIcon?: boolean
  nameKey?: string
}

export function ChartLegendContent({
  className,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: ChartLegendContentProps) {
  const { config } = useChart()
  if (!payload?.length) return null

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4 text-xs',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className
      )}
    >
      {payload.map((item) => {
        const key = nameKey ?? String(item.dataKey ?? item.value ?? '')
        const cfgEntry = config[key]
        return (
          <div key={String(item.value)} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[var(--muted)]">{cfgEntry?.label ?? item.value}</span>
          </div>
        )
      })}
    </div>
  )
}
