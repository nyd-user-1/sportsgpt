'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/AppLayout'
import Image from 'next/image'
import {
  CheckCircle2, XCircle, AlertCircle,
  Database, Map, BarChart2, BookOpen, Rocket,
  Trophy, Globe, Zap, Star, Flame, Shield, Target, Award,
  Triangle,
} from 'lucide-react'

const AI_LOGO_BLOB = 'https://tmdolblsg0vd3laa.public.blob.vercel-storage.com/gallery/logos/ai'
const AI_LOGOS = {
  openai:    `${AI_LOGO_BLOB}/openai-logo.avif`,
  anthropic: `${AI_LOGO_BLOB}/anthropic-icon.webp`,
  gemini:    `${AI_LOGO_BLOB}/gemini-icon-bw.webp`,
}
import { cn } from '@/lib/utils'
import { EditorialHead } from '@/components/editorial'

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans), system-ui, sans-serif' } as const
const MONO  = { fontFamily: 'var(--font-mono), ui-monospace, monospace' } as const

type Status = {
  db: { connected: boolean; error?: string }
  mapsKey: { set: boolean }
  aiKeys: {
    vercelGateway: boolean
    openai:        boolean
    anthropic:     boolean
    gemini:        boolean
  }
  config: {
    APP_NAME: string
    APP_TAGLINE: string
    ACCENT_COLOR: string
    CHAT_PLACEHOLDER: string
    CHAT_PLACEHOLDER_PANEL: string
    CHAT_PANEL_INTRO: string
  }
  content: { charts: number; glossaryTerms: number; launchpadTabs: number }
  review?: {
    noProfile: { player_name: string; school_slug: string | null }[]
    slugConflicts: { player_name: string; school_slug: string | null; bad_slug: string }[]
  }
}

const ICON_OPTIONS = [
  { label: 'Trophy',  icon: Trophy  },
  { label: 'Globe',   icon: Globe   },
  { label: 'Zap',     icon: Zap     },
  { label: 'Star',    icon: Star    },
  { label: 'Flame',   icon: Flame   },
  { label: 'Shield',  icon: Shield  },
  { label: 'Target',  icon: Target  },
  { label: 'Award',   icon: Award   },
]

function StatusDot({ ok, loading }: { ok: boolean; loading?: boolean }) {
  if (loading) return <AlertCircle className="h-4 w-4 text-[var(--paper-faint)]" />
  if (ok) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  return <XCircle className="h-4 w-4 text-red-400" />
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      className="border border-[var(--paper-rule)] bg-[var(--paper-quiet)] overflow-hidden"
      style={{ borderRadius: 3 }}
    >
      <div className="px-6 py-4 border-b border-[var(--paper-rule)] flex items-center gap-2">
        <span aria-hidden className="inline-block w-6 h-px bg-[var(--paper-rule)]" />
        <h2 className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>
          {title}
        </h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-start gap-4">
      <div className="pt-2.5">
        <p className="text-[13px] text-[var(--paper-text)]" style={SERIF}>{label}</p>
        {hint && <p className="text-[11px] text-[var(--paper-muted)] mt-1 italic" style={SERIF}>{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

const input = 'w-full bg-[var(--paper)] border border-[var(--paper-rule)] rounded-[3px] px-3.5 py-2.5 text-sm text-[var(--paper-text)] placeholder:text-[var(--paper-faint)] outline-none focus:border-[var(--paper-text)] transition-colors'

export default function AdminPage() {
  const [status, setStatus]     = useState<Status | null>(null)
  const [brand, setBrand]       = useState({ APP_NAME: '', APP_TAGLINE: '', ACCENT_COLOR: '#033882', CHAT_PLACEHOLDER: '', CHAT_PLACEHOLDER_PANEL: '', CHAT_PANEL_INTRO: '' })
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [saveErr, setSaveErr]   = useState<string | null>(null)
  const [templateTab, setTemplateTab] = useState<'editorial' | 'basic'>('editorial')
  const [systemTab,   setSystemTab]   = useState<'setup' | 'infrastructure'>('setup')
  const [contentTab,  setContentTab]  = useState<'content' | 'navigation'>('content')

  useEffect(() => {
    fetch('/api/admin/status').then(r => r.json()).then((s: Status) => {
      setStatus(s)
      setBrand({
        APP_NAME:              s.config.APP_NAME,
        APP_TAGLINE:           s.config.APP_TAGLINE,
        ACCENT_COLOR:          s.config.ACCENT_COLOR,
        CHAT_PLACEHOLDER:      s.config.CHAT_PLACEHOLDER,
        CHAT_PLACEHOLDER_PANEL: s.config.CHAT_PLACEHOLDER_PANEL,
        CHAT_PANEL_INTRO:      s.config.CHAT_PANEL_INTRO,
      })
    })
  }, [])

  async function saveBrand() {
    setSaving(true); setSaveErr(null)
    try {
      const r = await fetch('/api/admin/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(brand) })
      const j = await r.json()
      if (j.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
      else setSaveErr(j.error ?? 'Unknown error')
    } catch { setSaveErr('Network error') }
    setSaving(false)
  }

  const dbOk      = status?.db.connected ?? false
  const mapsOk    = status?.mapsKey.set  ?? false
  const chartsOk  = (status?.content.charts ?? 0) > 0
  const steps     = [dbOk, mapsOk, chartsOk]
  const doneCount = steps.filter(Boolean).length
  const pct       = Math.round((doneCount / steps.length) * 100)

  const accent = brand.ACCENT_COLOR || '#033882'

  return (
    <AppLayout paperMode>
      <div className="flex-1 overflow-y-auto no-scrollbar bg-[var(--paper)] text-[var(--paper-text)]">
        <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">

          <EditorialHead
            eyebrow="Console · Section XI"
            size="md"
            subhead="Setup, brand, content, and infrastructure — the levers that ship the site."
            meta={[
              `${doneCount}/${steps.length} required`,
              `${pct}%`,
              dbOk ? 'DB connected' : 'DB pending',
            ]}
          >
            Admin
          </EditorialHead>

          {/* Setup + Infrastructure (tabbed) */}
          <Section id="setup" title="Setup">
            {(() => {
              const tabs = [
                { id: 'setup'          as const, label: 'Setup'          },
                { id: 'infrastructure' as const, label: 'Infrastructure' },
              ]
              return (
                <>
                  <div className="flex items-center border-b border-[var(--paper-rule)] -mt-1 mb-6">
                    {tabs.map(t => {
                      const active = systemTab === t.id
                      return (
                        <button
                          key={t.id}
                          onClick={() => setSystemTab(t.id)}
                          className={cn(
                            'px-4 py-3 text-[11px] uppercase tracking-[0.22em] whitespace-nowrap border-b-2 -mb-px transition-colors first:pl-0',
                            active
                              ? 'border-[var(--paper-strong)] text-[var(--paper-strong)]'
                              : 'border-transparent text-[var(--paper-muted)] hover:text-[var(--paper-text)]'
                          )}
                          style={SANS}
                        >
                          {t.label}
                        </button>
                      )
                    })}
                  </div>

                  {systemTab === 'setup' && (
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-baseline justify-between mb-2.5">
                          <span className="text-[15px] text-[var(--paper-text)]" style={SERIF}>
                            {pct === 100 ? 'Ready to ship.' : `${doneCount} of ${steps.length} required steps complete.`}
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--paper-faint)] tabular-nums" style={MONO}>{pct}%</span>
                        </div>
                        <div className="h-px bg-[var(--paper-rule)] overflow-hidden">
                          <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: 'var(--paper-text)' }} />
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          { ok: dbOk,     label: 'Database connected',          action: 'Add DATABASE_URL to Vercel → Settings → Environment Variables → redeploy' },
                          { ok: mapsOk,   label: 'Google Maps API key set',      action: 'Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to Vercel env vars → redeploy' },
                          { ok: chartsOk, label: 'Charts defined',               action: 'Add chart configs below, or edit src/lib/chart-configs.ts' },
                        ].map(s => (
                          <div key={s.label} className="flex items-start gap-3">
                            <div className="mt-0.5"><StatusDot ok={s.ok} loading={!status} /></div>
                            <div>
                              <p className={cn('text-[14px]', s.ok ? 'text-[var(--paper-text)]' : 'text-[var(--paper-muted)]')} style={SERIF}>{s.label}</p>
                              {!s.ok && status && <p className="text-[11px] text-[var(--paper-faint)] mt-0.5" style={SANS}>{s.action}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {systemTab === 'infrastructure' && (
                    <div className="space-y-4">
                      <InfraRow icon={Database} label="Database" ok={dbOk} loading={!status}
                        okText="Connected"
                        failText="Add DATABASE_URL to Vercel → Settings → Environment Variables"
                        detail={status?.db.error}
                      />
                      <InfraRow icon={Map} label="Google Maps" ok={mapsOk} loading={!status}
                        okText="API key set"
                        failText="Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to Vercel env vars"
                      />

                      <div className="flex items-center gap-2 pt-3">
                        <span aria-hidden className="inline-block w-6 h-px bg-[var(--paper-rule)]" />
                        <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>AI Providers</span>
                      </div>

                      <InfraRow icon={Triangle} label="Vercel AI Gateway" ok={status?.aiKeys.vercelGateway ?? false} loading={!status}
                        okText="Token set"
                        failText="Add SPORTSGPT_VERCEL_API to Vercel env vars"
                      />
                      <InfraRow logo={AI_LOGOS.openai} label="OpenAI" ok={status?.aiKeys.openai ?? false} loading={!status}
                        okText="API key set"
                        failText="Add OPENAI_API_KEY to Vercel env vars"
                      />
                      <InfraRow logo={AI_LOGOS.anthropic} label="Claude" ok={status?.aiKeys.anthropic ?? false} loading={!status}
                        okText="API key set"
                        failText="Add AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (Bedrock) to Vercel env vars"
                      />
                      <InfraRow logo={AI_LOGOS.gemini} label="Gemini" ok={status?.aiKeys.gemini ?? false} loading={!status}
                        okText="API key set"
                        failText="Add GEMINI_FLASH_API_KEY to Vercel env vars"
                      />

                      {!dbOk && status && (
                        <div className="mt-2 rounded-[3px] border border-[var(--paper-rule)] bg-[var(--paper)] px-4 py-3.5 text-[12px] text-[var(--paper-muted)] space-y-1" style={SERIF}>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--paper-faint)] mb-1 not-italic" style={SANS}>Database setup (once you have DATABASE_URL)</p>
                          <p>1. Create a project at <span className="text-[var(--paper-strong)] not-italic">neon.tech</span></p>
                          <p>2. Copy the connection string → Vercel env var <code className="not-italic bg-[var(--paper-quiet)] border border-[var(--paper-rule)] px-1 rounded-[2px]" style={MONO}>DATABASE_URL</code></p>
                          <p>3. Redeploy → come back here to verify the connection</p>
                          <p>4. Once connected, brand config saves to the <code className="not-italic bg-[var(--paper-quiet)] border border-[var(--paper-rule)] px-1 rounded-[2px]" style={MONO}>app_config</code> table (auto-created)</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )
            })()}
          </Section>

          {/* Content + Navigation (tabbed) */}
          <Section id="content" title="Content">
            <div className="flex items-center border-b border-[var(--paper-rule)] -mt-1 mb-6">
              {[
                { id: 'content'    as const, label: 'Content'    },
                { id: 'navigation' as const, label: 'Navigation' },
              ].map(t => {
                const active = contentTab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setContentTab(t.id)}
                    className={cn(
                      'px-4 py-3 text-[11px] uppercase tracking-[0.22em] whitespace-nowrap border-b-2 -mb-px transition-colors first:pl-0',
                      active
                        ? 'border-[var(--paper-strong)] text-[var(--paper-strong)]'
                        : 'border-transparent text-[var(--paper-muted)] hover:text-[var(--paper-text)]'
                    )}
                    style={SANS}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>

            {contentTab === 'content' && (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { icon: BarChart2, label: 'Charts',    count: status?.content.charts ?? '—',        file: 'src/lib/chart-configs.ts',    href: '/charts'    },
                    { icon: BookOpen,  label: 'Glossary',  count: status?.content.glossaryTerms ?? '—', file: 'src/lib/glossary-terms.ts',   href: '/glossary'  },
                    { icon: Rocket,    label: 'Launchpad', count: status?.content.launchpadTabs ?? '—', file: 'src/lib/launchpad-data.ts',   href: '/launchpad' },
                  ].map(({ icon: Icon, label, count, file, href }) => (
                    <a key={label} href={href} className="rounded-[3px] border border-[var(--paper-rule)] bg-[var(--paper)] p-4 text-center hover:border-[var(--paper-text)] transition-colors group">
                      <Icon className="h-5 w-5 mx-auto mb-2 text-[var(--paper-faint)] group-hover:text-[var(--paper-text)] transition-colors" />
                      <p className="text-[28px] tabular-nums text-[var(--paper-text)] leading-none" style={SERIF}>{count}</p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--paper-faint)] mt-2" style={SANS}>{label}</p>
                      <p className="text-[10px] text-[var(--paper-faint)] mt-2 break-all" style={MONO}>{file}</p>
                    </a>
                  ))}
                </div>
                <div className="rounded-[3px] border border-[var(--paper-rule)] bg-[var(--paper)] px-4 py-3.5 text-[12px] text-[var(--paper-muted)] space-y-1.5" style={SERIF}>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--paper-faint)] not-italic" style={SANS}>Adding content</p>
                  <p>Charts: add entries to <code className="bg-[var(--paper-quiet)] border border-[var(--paper-rule)] px-1 rounded-[2px]" style={MONO}>chart-configs.ts</code> + matching cases in <code className="bg-[var(--paper-quiet)] border border-[var(--paper-rule)] px-1 rounded-[2px]" style={MONO}>chart/[slug]/page.tsx</code></p>
                  <p>Glossary: add to <code className="bg-[var(--paper-quiet)] border border-[var(--paper-rule)] px-1 rounded-[2px]" style={MONO}>glossary-terms.ts</code></p>
                  <p>Launchpad cards: add to <code className="bg-[var(--paper-quiet)] border border-[var(--paper-rule)] px-1 rounded-[2px]" style={MONO}>launchpad-data.ts</code></p>
                </div>
              </>
            )}

            {contentTab === 'navigation' && (
              <>
                <p className="text-[12px] text-[var(--paper-muted)] mb-4 italic" style={SERIF}>Edit <code className="not-italic bg-[var(--paper)] border border-[var(--paper-rule)] px-1.5 py-0.5 rounded-[2px]" style={MONO}>src/lib/app-config.ts</code> to change sidebar items, routes, and page titles.</p>
                <div className="rounded-[3px] border border-[var(--paper-rule)] bg-[var(--paper)] overflow-hidden text-sm">
                  {[
                    { label: 'Chat',       href: '/'          },
                    { label: 'Charts',     href: '/charts'    },
                    { label: 'Maps',       href: '/maps'      },
                    { label: 'Teams',      href: '/team'      },
                    { label: 'Schools',    href: '/school'    },
                    { label: 'Schedule',   href: '/schedule'  },
                    { label: 'Section XI', href: '/section'   },
                    { label: 'Launchpad',  href: '/launchpad' },
                  ].map((item, i, arr) => (
                    <div key={item.label} className={cn('flex items-center justify-between px-4 py-2.5', i < arr.length - 1 && 'border-b border-[var(--paper-rule-soft)]')}>
                      <span className="text-[13px] text-[var(--paper-text)]" style={SERIF}>{item.label}</span>
                      <code className="text-[10px] text-[var(--paper-faint)] bg-[var(--paper-quiet)] border border-[var(--paper-rule)] px-2 py-0.5 rounded-[2px]" style={MONO}>{item.href}</code>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Section>

          {/* Needs Review — player-slug data hygiene */}
          <Section id="review" title="Needs Review">
            <p className="text-[12px] text-[var(--paper-muted)] mb-4 italic" style={SERIF}>
              Players surfaced by the slug-reconciliation scripts (<code className="not-italic bg-[var(--paper)] border border-[var(--paper-rule)] px-1.5 py-0.5 rounded-[2px]" style={MONO}>scripts/*-season-stat-slugs.mjs</code>). These render as plain text (no broken links) until resolved.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'No profile page', count: status?.review?.noProfile.length ?? '—',     note: 'In stats, not in players table' },
                { label: 'Slug conflicts',  count: status?.review?.slugConflicts.length ?? '—', note: 'Season-stat numbers disagree' },
              ].map(({ label, count, note }) => (
                <div key={label} className="rounded-[3px] border border-[var(--paper-rule)] bg-[var(--paper)] p-4 text-center">
                  <p className="text-[28px] tabular-nums text-[var(--paper-text)] leading-none" style={SERIF}>{count}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--paper-faint)] mt-2" style={SANS}>{label}</p>
                  <p className="text-[10px] text-[var(--paper-faint)] mt-1.5" style={SERIF}>{note}</p>
                </div>
              ))}
            </div>

            {(status?.review?.slugConflicts.length ?? 0) > 0 && (
              <div className="mb-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--paper-faint)] mb-2" style={SANS}>Slug conflicts — pick the correct season-stats row</p>
                <div className="rounded-[3px] border border-[var(--paper-rule)] bg-[var(--paper)] overflow-hidden max-h-56 overflow-y-auto">
                  {status!.review!.slugConflicts.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 px-4 py-2 border-b border-[var(--paper-rule-soft)] last:border-b-0">
                      <span className="text-[13px] text-[var(--paper-text)] truncate" style={SERIF}>{r.player_name}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <code className="text-[10px] text-[var(--paper-faint)] bg-[var(--paper-quiet)] border border-[var(--paper-rule)] px-2 py-0.5 rounded-[2px]" style={MONO}>{r.bad_slug}</code>
                        <span className="text-[10px] text-[var(--paper-faint)]" style={MONO}>{r.school_slug ?? '—'}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(status?.review?.noProfile.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--paper-faint)] mb-2" style={SANS}>No profile page — box-score-only players</p>
                <div className="rounded-[3px] border border-[var(--paper-rule)] bg-[var(--paper)] overflow-hidden max-h-56 overflow-y-auto">
                  {status!.review!.noProfile.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 px-4 py-2 border-b border-[var(--paper-rule-soft)] last:border-b-0">
                      <span className="text-[13px] text-[var(--paper-text)] truncate" style={SERIF}>{r.player_name}</span>
                      <span className="text-[10px] text-[var(--paper-faint)] shrink-0" style={MONO}>{r.school_slug ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Brand */}
          <Section id="brand" title="Brand">
            <div className="space-y-5">
              <Field label="App Name" hint="Shown in the header and browser tab">
                <input value={brand.APP_NAME} onChange={e => setBrand(b => ({ ...b, APP_NAME: e.target.value }))} className={input} placeholder="SportsGPT" />
              </Field>
              <Field label="Tagline" hint="Shown on the home page and meta description">
                <input value={brand.APP_TAGLINE} onChange={e => setBrand(b => ({ ...b, APP_TAGLINE: e.target.value }))} className={input} placeholder="AI-powered sports intelligence" />
              </Field>
              <Field label="Accent Color" hint="Icon stroke, progress bar, active states">
                <div className="flex items-center gap-2">
                  <input type="color" value={brand.ACCENT_COLOR} onChange={e => setBrand(b => ({ ...b, ACCENT_COLOR: e.target.value }))}
                    className="h-10 w-12 rounded-[3px] cursor-pointer border border-[var(--paper-rule)] bg-transparent" />
                  <input value={brand.ACCENT_COLOR} onChange={e => setBrand(b => ({ ...b, ACCENT_COLOR: e.target.value }))}
                    className={cn(input, 'flex-1')} style={MONO} placeholder="#033882" />
                  <div className="h-10 w-10 rounded-[3px] border border-[var(--paper-rule)] shrink-0" style={{ background: accent }} />
                </div>
              </Field>
              <Field label="App Logo" hint="Icon shown in header and home page">
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(({ label, icon: Icon }) => (
                    <button key={label} title={label}
                      className={cn('h-10 w-10 rounded-[3px] border flex items-center justify-center transition-colors',
                        'border-[var(--paper-rule)] hover:border-[var(--paper-text)] text-[var(--paper-muted)] hover:text-[var(--paper-text)]'
                      )}>
                      <Icon className="h-5 w-5" style={{ stroke: accent }} />
                    </button>
                  ))}
                  <p className="w-full text-[11px] text-[var(--paper-faint)] mt-1.5 italic" style={SERIF}>To change: edit <code className="not-italic bg-[var(--paper)] border border-[var(--paper-rule)] px-1 rounded-[2px]" style={MONO}>src/components/AppLogo.tsx</code></p>
                </div>
              </Field>
              <Field label="Home Placeholder" hint="Text shown in the main chat input">
                <input value={brand.CHAT_PLACEHOLDER} onChange={e => setBrand(b => ({ ...b, CHAT_PLACEHOLDER: e.target.value }))} className={input} placeholder="Ask about Section XI football..." />
              </Field>
              <Field label="Panel Placeholder" hint="Text in the slide-out chat panel">
                <input value={brand.CHAT_PLACEHOLDER_PANEL} onChange={e => setBrand(b => ({ ...b, CHAT_PLACEHOLDER_PANEL: e.target.value }))} className={input} placeholder="Ask about this team..." />
              </Field>
              <Field label="Panel Intro" hint="Empty-state message in the chat panel">
                <input value={brand.CHAT_PANEL_INTRO} onChange={e => setBrand(b => ({ ...b, CHAT_PANEL_INTRO: e.target.value }))} className={input} />
              </Field>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--paper-rule)]">
                <div>
                  {!dbOk && <p className="text-[11px] text-amber-500 italic" style={SERIF}>Connect a database first to save brand overrides.</p>}
                  {saveErr && <p className="text-[11px] text-red-400" style={SANS}>{saveErr}</p>}
                  {!saveErr && dbOk && <p className="text-[11px] text-[var(--paper-faint)] italic" style={SERIF}>Saves to DB — takes effect on next page load.</p>}
                </div>
                <button onClick={saveBrand} disabled={saving || !dbOk}
                  className="px-5 py-2 rounded-[3px] text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--paper)] bg-[var(--paper-text)] disabled:opacity-40 hover:opacity-85 transition-opacity"
                  style={SANS}>
                  {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Brand'}
                </button>
              </div>
            </div>
          </Section>

          {/* Template */}
          <Section id="template" title="Template">
            <div className="flex items-center border-b border-[var(--paper-rule)] -mt-1 mb-6">
              {[
                { id: 'editorial' as const, label: 'Editorial design' },
                { id: 'basic'     as const, label: 'Basic design'     },
              ].map(t => {
                const active = templateTab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setTemplateTab(t.id)}
                    className={cn(
                      'px-4 py-3 text-[11px] uppercase tracking-[0.22em] whitespace-nowrap border-b-2 -mb-px transition-colors first:pl-0',
                      active
                        ? 'border-[var(--paper-strong)] text-[var(--paper-strong)]'
                        : 'border-transparent text-[var(--paper-muted)] hover:text-[var(--paper-text)]'
                    )}
                    style={SANS}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>

            {templateTab === 'editorial' && <EditorialTemplate />}
            {templateTab === 'basic'     && <BasicTemplate />}
          </Section>

        </div>
      </div>
    </AppLayout>
  )
}

function TemplateBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)] mb-3" style={SANS}>{title}</p>
      <div className="text-[13px] text-[var(--paper-text)] leading-relaxed space-y-1.5" style={SERIF}>{children}</div>
    </div>
  )
}

function Token({ name, role, swatch }: { name: string; role: string; swatch?: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[12px]">
      {swatch && <span className="h-3.5 w-3.5 rounded-[2px] border border-[var(--paper-rule)] shrink-0" style={{ background: swatch }} />}
      <code className="text-[var(--paper-text)]" style={MONO}>{name}</code>
      <span className="text-[var(--paper-muted)] italic" style={SERIF}>— {role}</span>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-[2px] bg-[var(--paper)] text-[11px] text-[var(--paper-text)] border border-[var(--paper-rule)]"
      style={MONO}
    >
      {children}
    </span>
  )
}

function EditorialTemplate() {
  return (
    <div className="space-y-7">
      <p className="text-[14px] text-[var(--paper-muted)] leading-relaxed italic max-w-2xl" style={SERIF}>
        Magazine-grade dark template. Paper palette on near-black, serif display type, ruled section heads, ranked rows.
        Used for all reader-facing surfaces — teams, players, games, sections, chat — and now the operator console.
      </p>

      <div className="grid grid-cols-2 gap-6">
        <TemplateBlock title="Palette">
          <Token name="--paper"           role="panel background"        swatch="var(--paper)"           />
          <Token name="--paper-text"      role="primary text"            swatch="var(--paper-text)"      />
          <Token name="--paper-strong"    role="accent — links only"     swatch="var(--paper-strong)"    />
          <Token name="--paper-muted"     role="secondary text"          swatch="var(--paper-muted)"     />
          <Token name="--paper-faint"     role="tertiary / labels"       swatch="var(--paper-faint)"     />
          <Token name="--paper-quiet"     role="hover wash"              swatch="var(--paper-quiet)"     />
          <Token name="--paper-rule"      role="primary divider"         swatch="var(--paper-rule)"      />
          <Token name="--paper-rule-soft" role="row divider"             swatch="var(--paper-rule-soft)" />
        </TemplateBlock>

        <TemplateBlock title="Typography">
          <p><Chip>Fraunces</Chip> <span className="text-[var(--muted)]">— display, names, paragraphs</span></p>
          <p><Chip>DM Sans</Chip> <span className="text-[var(--muted)]">— UI, labels, buttons</span></p>
          <p><Chip>JetBrains Mono</Chip> <span className="text-[var(--muted)]">— stats, scores, ranks (tabular-nums)</span></p>
          <p className="text-[12px] text-[var(--muted)] pt-1">Section heads: 10px uppercase tracking-[0.24em] in <code className="font-mono">--paper-faint</code></p>
        </TemplateBlock>
      </div>

      <TemplateBlock title="Signature components">
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {['EditorialHead','SectionHead','Tablet','EmptyTablet','ScrollTable','HeroStrip','ContentsNav','StickyControlBar','EditorialButtonGroup','SearchInput','PanelTeam','PanelPlayer','CardCarousel'].map(c => <Chip key={c}>{c}</Chip>)}
        </div>
      </TemplateBlock>

      <div className="grid grid-cols-2 gap-6">
        <TemplateBlock title="Voice & tone">
          <p>Editorial, sportswriter cadence. Names italicized in serif, stats neutral in mono. Blue is reserved exclusively for interactive elements — never decoration.</p>
        </TemplateBlock>
        <TemplateBlock title="Surfaces live">
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {['/chat','/launchpad','/team/[slug]','/player/[slug]','/game/[id]','/section/section-xi','/division/[slug]','/position/[slug]','/admin','/sign-in','/sign-up'].map(p => <Chip key={p}>{p}</Chip>)}
          </div>
        </TemplateBlock>
      </div>

      <div className="rounded-[3px] border border-[var(--paper-rule)] bg-[var(--paper)] px-4 py-3.5 text-[12px] text-[var(--paper-muted)] space-y-1" style={SERIF}>
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--paper-faint)] not-italic" style={SANS}>Reference</p>
        <p>Full rule set: <code className="bg-[var(--paper-quiet)] border border-[var(--paper-rule)] px-1 rounded-[2px] not-italic" style={MONO}>CLAUDE.md → Editorial Design System (Paper Palette)</code></p>
        <p>CSS variables defined in <code className="bg-[var(--paper-quiet)] border border-[var(--paper-rule)] px-1 rounded-[2px] not-italic" style={MONO}>src/app/globals.css</code></p>
      </div>
    </div>
  )
}

function BasicTemplate() {
  return (
    <div className="space-y-7">
      <p className="text-[14px] text-[var(--paper-muted)] leading-relaxed italic max-w-2xl" style={SERIF}>
        The original light-mode dashboard template. Rounded cards, neutral sans, utilitarian forms. Retired from the
        operator console and auth flows as of 2026-05-26 — still in place on legacy data surfaces below.
      </p>

      <div className="grid grid-cols-2 gap-6">
        <TemplateBlock title="Palette">
          <Token name="--surface"   role="card / panel background" swatch="var(--surface)"   />
          <Token name="--border"    role="dividers, card edges"    swatch="var(--border)"    />
          <Token name="--txt"       role="primary text"            swatch="var(--txt)"       />
          <Token name="--muted"     role="secondary text"          swatch="var(--muted)"     />
          <Token name="--muted2"    role="tertiary / placeholder"  swatch="var(--muted2)"    />
          <Token name="--inp-bg"    role="input / chip background" swatch="var(--inp-bg)"    />
          <Token name="--row-hover" role="table row hover"         swatch="var(--row-hover)" />
        </TemplateBlock>

        <TemplateBlock title="Typography">
          <p><Chip>system sans</Chip> <span className="text-[var(--muted)]">— all text</span></p>
          <p><Chip>Geist Mono</Chip> <span className="text-[var(--muted)]">— code, hrefs, hints</span></p>
          <p className="text-[12px] text-[var(--muted)] pt-1">Section heads: 15px font-semibold in <code className="font-mono">--txt</code></p>
        </TemplateBlock>
      </div>

      <TemplateBlock title="Signature components">
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {['Section','Field','InfraRow','StatusDot','rounded-2xl cards','rounded-xl inputs','TeamTable','LeaderboardTable','PlayerIndexTable','PanelChart'].map(c => <Chip key={c}>{c}</Chip>)}
        </div>
      </TemplateBlock>

      <div className="grid grid-cols-2 gap-6">
        <TemplateBlock title="Voice & tone">
          <p>Direct, utilitarian. Form-first. Labels left, controls right. Status dots and progress bars over prose.</p>
        </TemplateBlock>
        <TemplateBlock title="Surfaces live">
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {['/charts','/leaderboard','/player','/team','/school','/maps','/glossary'].map(p => <Chip key={p}>{p}</Chip>)}
          </div>
          <p className="text-[12px] text-[var(--paper-muted)] pt-2 italic" style={SERIF}>Migration target — every surface above will move to the editorial template.</p>
        </TemplateBlock>
      </div>

      <div className="rounded-[3px] border border-[var(--paper-rule)] bg-[var(--paper)] px-4 py-3.5 text-[12px] text-[var(--paper-muted)] space-y-1" style={SERIF}>
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--paper-faint)] not-italic" style={SANS}>Reference</p>
        <p>Variables defined in <code className="bg-[var(--paper-quiet)] border border-[var(--paper-rule)] px-1 rounded-[2px] not-italic" style={MONO}>src/app/globals.css</code> (:root scope)</p>
        <p>This <code className="bg-[var(--paper-quiet)] border border-[var(--paper-rule)] px-1 rounded-[2px] not-italic" style={MONO}>/admin</code> page itself moved to the editorial template on 2026-05-26.</p>
      </div>
    </div>
  )
}

function InfraRow({ icon: Icon, logo, label, ok, loading, okText, failText, detail }: {
  icon?: React.ComponentType<{ className?: string }>
  logo?: string
  label: string; ok: boolean; loading: boolean
  okText: string; failText: string; detail?: string
}) {
  return (
    <div className="flex items-start gap-3">
      {logo ? (
        <Image
          src={logo}
          alt=""
          width={16}
          height={16}
          className="mt-0.5 shrink-0 object-contain opacity-70 dark:invert"
          unoptimized
        />
      ) : Icon ? (
        <Icon className="h-4 w-4 mt-0.5 text-[var(--paper-faint)] shrink-0" />
      ) : null}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[14px] text-[var(--paper-text)]" style={SERIF}>{label}</span>
          {!loading && (
            ok
              ? <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-500" style={SANS}>{okText}</span>
              : <span className="text-[10px] uppercase tracking-[0.18em] text-red-400" style={SANS}>Not configured</span>
          )}
        </div>
        {!loading && !ok && <p className="text-[11px] text-[var(--paper-muted)] mt-1 italic" style={SERIF}>{failText}</p>}
        {!loading && !ok && detail && <p className="text-[10px] text-red-300 mt-0.5 truncate" style={MONO}>{detail}</p>}
      </div>
      <StatusDot ok={ok} loading={loading} />
    </div>
  )
}
