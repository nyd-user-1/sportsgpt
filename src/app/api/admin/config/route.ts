import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

const ALLOWED = new Set([
  'APP_NAME', 'APP_TAGLINE', 'ACCENT_COLOR',
  'CHAT_PLACEHOLDER', 'CHAT_PLACEHOLDER_PANEL', 'CHAT_PANEL_INTRO',
])

export async function POST(req: Request) {
  let body: Record<string, string>
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const entries = Object.entries(body).filter(([k]) => ALLOWED.has(k))
  if (entries.length === 0) return Response.json({ error: 'No valid keys' }, { status: 400 })

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `
    for (const [key, value] of entries) {
      await sql`
        INSERT INTO app_config (key, value) VALUES (${key}, ${value})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
      `
    }
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'DB error' }, { status: 500 })
  }
}
