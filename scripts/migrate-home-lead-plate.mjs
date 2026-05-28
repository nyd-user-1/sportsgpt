/**
 * Creates the home_lead_plate table — single editorial row that drives the
 * cover-story block on `/`. Seeds with a placeholder Floyd story so the home
 * page renders something on first deploy.
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-home-lead-plate.mjs
 *
 * Safe to re-run — uses CREATE TABLE IF NOT EXISTS and INSERT … ON CONFLICT.
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('ERROR: DATABASE_URL not set'); process.exit(1) }

const sql = neon(DATABASE_URL)

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS home_lead_plate (
      id                INT          PRIMARY KEY DEFAULT 1,
      kicker            TEXT         NOT NULL DEFAULT 'The Lead Plate',
      drop_cap          TEXT         NOT NULL DEFAULT 'F',
      deck              TEXT         NOT NULL,
      href              TEXT         NOT NULL DEFAULT '/section/section-xi',
      href_label        TEXT         NOT NULL DEFAULT 'Read the full season recap',
      hero_school_slug  TEXT         NOT NULL,
      mini_stats        JSONB        NOT NULL DEFAULT '[]'::jsonb,
      updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
      CONSTRAINT single_row CHECK (id = 1)
    )
  `

  const seedDeck =
    'Floyd enters the final fortnight at 9-0, the first unbeaten Division I season since Longwood’s run in 21-22. The Colonials’ point differential of +268 is the largest in Section XI since records began, and a Week 11 meeting with Ward Melville will settle the conference title before the playoffs even arrive.'

  const seedMiniStats = JSON.stringify([
    { label: 'Top Team',   name: 'Floyd',            value: '9–0', unit: 'record', href: '/team/floyd-varsity-football' },
    { label: 'Top Passer', name: 'Season Leaders',   value: 'See',      unit: 'list',   href: '/leaderboard?tab=Passing' },
    { label: 'Top Game',   name: 'Recent Results',   value: 'See',      unit: 'list',   href: '/section/section-xi#games' },
  ])

  await sql`
    INSERT INTO home_lead_plate (id, drop_cap, deck, hero_school_slug, mini_stats)
    VALUES (1, 'F', ${seedDeck}, 'floyd', ${seedMiniStats}::jsonb)
    ON CONFLICT (id) DO NOTHING
  `

  const row = await sql`SELECT id, kicker, drop_cap, hero_school_slug, updated_at FROM home_lead_plate WHERE id = 1`
  console.log('home_lead_plate row:', row[0])
  console.log('done.')
}

main().catch(e => { console.error(e); process.exit(1) })
