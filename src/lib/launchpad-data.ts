// ── REPLACE FOR NEW DOMAIN ────────────────────────────────────────────────
// Define the tabs and entities shown on the Launchpad page card grid.
// Each tab key must have a matching entry in LAUNCHPAD_ITEMS.

export type LaunchpadItem = { name: string; county: string }

export const LAUNCHPAD_TABS: string[] = []

export const LAUNCHPAD_ITEMS: Record<string, LaunchpadItem[]> = {}
