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

  return Response.json({
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
