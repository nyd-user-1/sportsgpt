import { sql } from '@/lib/db'
import { CHART_CONFIGS } from '@/lib/chart-configs'
import { GLOSSARY_TERMS } from '@/lib/glossary-terms'
import { LAUNCHPAD_TABS } from '@/lib/launchpad-data'
import {
  APP_NAME, APP_TAGLINE, ACCENT_COLOR,
  CHAT_PLACEHOLDER, CHAT_PLACEHOLDER_PANEL, CHAT_PANEL_INTRO,
} from '@/lib/app-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  let dbConnected = false
  let dbError: string | undefined

  try {
    await sql`SELECT 1`
    dbConnected = true
  } catch (e) {
    dbError = e instanceof Error ? e.message.split('\n')[0] : 'Connection failed'
  }

  // Load DB overrides if connected
  const config: Record<string, string> = {
    APP_NAME, APP_TAGLINE, ACCENT_COLOR,
    CHAT_PLACEHOLDER, CHAT_PLACEHOLDER_PANEL, CHAT_PANEL_INTRO,
  }
  if (dbConnected) {
    try {
      const rows = await sql`SELECT key, value FROM app_config`
      for (const r of rows) config[r.key as string] = r.value as string
    } catch { /* table not yet created */ }
  }

  // Player-slug review queues (see scripts/{backfill,reconcile,dedup}-*.mjs).
  // noProfile: appear in stats but have no players row → render as plain text.
  // slugConflicts: a buggy season-stats slug whose numbers disagree with the
  //   canonical row — needs a human to pick the correct figure.
  let review: {
    noProfile: { player_name: string; school_slug: string | null }[]
    slugConflicts: { player_name: string; school_slug: string | null; bad_slug: string }[]
  } = { noProfile: [], slugConflicts: [] }
  if (dbConnected) {
    try {
      const noProfile = await sql`
        SELECT DISTINCT player_name, school_slug FROM (
          SELECT pgs.player_name, pgs.school_slug
          FROM player_game_stats pgs
          WHERE pgs.player_slug IS NULL
            AND NOT EXISTS (
              SELECT 1 FROM players p WHERE p.school_slug = pgs.school_slug
                AND lower(trim(regexp_replace(p.name,' +',' ','g'))) = lower(trim(regexp_replace(pgs.player_name,' +',' ','g'))))
          UNION
          SELECT pss.player_name, pss.school_slug
          FROM player_season_stats pss
          LEFT JOIN players p0 ON p0.slug = pss.player_slug
          WHERE p0.slug IS NULL
            AND NOT EXISTS (
              SELECT 1 FROM players p WHERE p.school_slug = pss.school_slug
                AND lower(trim(regexp_replace(p.name,' +',' ','g'))) = lower(trim(regexp_replace(pss.player_name,' +',' ','g'))))
        ) u
        ORDER BY school_slug NULLS LAST, player_name`
      const slugConflicts = await sql`
        SELECT DISTINCT pss.player_name, pss.school_slug, pss.player_slug AS bad_slug
        FROM player_season_stats pss
        LEFT JOIN players p0 ON p0.slug = pss.player_slug
        WHERE p0.slug IS NULL
          AND EXISTS (
            SELECT 1 FROM players p WHERE p.school_slug = pss.school_slug
              AND lower(trim(regexp_replace(p.name,' +',' ','g'))) = lower(trim(regexp_replace(pss.player_name,' +',' ','g'))))
        ORDER BY school_slug, player_name`
      review = {
        noProfile: noProfile as { player_name: string; school_slug: string | null }[],
        slugConflicts: slugConflicts as { player_name: string; school_slug: string | null; bad_slug: string }[],
      }
    } catch { /* tables not present */ }
  }

  return Response.json({
    review,
    db: { connected: dbConnected, error: dbError },
    mapsKey: { set: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY },
    aiKeys: {
      vercelGateway: !!process.env.SPORTSGPT_VERCEL_API,
      openai:        !!process.env.OPENAI_API_KEY,
      anthropic:     !!(process.env.ANTHROPIC_API_KEY_SPORTSGPT2 || process.env.ANTHROPIC_API_KEY),
      gemini:        !!(process.env.GEMINI_FLASH_API_KEY || process.env.Gemini_API_Key),
    },
    config,
    content: {
      charts: CHART_CONFIGS.length,
      glossaryTerms: GLOSSARY_TERMS.length,
      launchpadTabs: LAUNCHPAD_TABS.length,
    },
  })
}
