import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Converts DB season year to school-year display label.
// Our DB stores the fall year (2024 = fall 2024 season = school year 2024-25).
export function formatSeason(yr: string | number): string {
  if (String(yr).toLowerCase() === 'all') return 'All'
  const y = Number(yr)
  return `${y}-${String(y + 1).slice(2)}`
}
