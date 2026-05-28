'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const

export function EditorialToggle({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Label
        htmlFor={id}
        className={cn(
          'cursor-pointer select-none transition-colors',
          checked ? 'text-[var(--paper-strong)]' : 'text-[var(--paper-muted)] hover:text-[var(--paper-text)]',
        )}
        style={{ ...SERIF, fontStyle: 'italic', fontSize: 15 }}
      >
        {label}
      </Label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          'border border-[var(--paper-rule)]',
          'data-[state=unchecked]:bg-[var(--paper-quiet)]',
          'data-[state=checked]:!bg-[var(--paper-strong)]',
          '[&_span]:bg-[var(--paper-text)] [&_span]:shadow-none',
          'data-[state=checked]:[&_span]:bg-[var(--paper)]',
        )}
      />
    </div>
  )
}
