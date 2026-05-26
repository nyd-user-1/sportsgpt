'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/AppLayout'
import {
  CheckCircle2, XCircle, AlertCircle,
  Database, Map, BarChart2, BookOpen, Rocket,
  Trophy, Globe, Zap, Star, Flame, Shield, Target, Award,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = {
  db: { connected: boolean; error?: string }
  mapsKey: { set: boolean }
  config: {
    APP_NAME: string
    APP_TAGLINE: string
    ACCENT_COLOR: string
    CHAT_PLACEHOLDER: string
    CHAT_PLACEHOLDER_PANEL: string
    CHAT_PANEL_INTRO: string
  }
  content: { charts: number; glossaryTerms: number; launchpadTabs: number }
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
  if (loading) return <AlertCircle className="h-4 w-4 text-[var(--muted2)]" />
  if (ok) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  return <XCircle className="h-4 w-4 text-red-400" />
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h2 className="text-[15px] font-semibold text-[var(--txt)]">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-start gap-4">
      <div className="pt-2.5">
        <p className="text-[13px] font-medium text-[var(--txt)]">{label}</p>
        {hint && <p className="text-[11px] text-[var(--muted)] mt-0.5">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

const input = 'w-full bg-[var(--inp-bg)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--txt)] placeholder:text-[var(--muted2)] outline-none focus:border-[var(--txt)] transition-colors'

export default function AdminPage() {
  const [status, setStatus]     = useState<Status | null>(null)
  const [brand, setBrand]       = useState({ APP_NAME: '', APP_TAGLINE: '', ACCENT_COLOR: '#033882', CHAT_PLACEHOLDER: '', CHAT_PLACEHOLDER_PANEL: '', CHAT_PANEL_INTRO: '' })
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [saveErr, setSaveErr]   = useState<string | null>(null)
  const [templateTab, setTemplateTab] = useState<'editorial' | 'basic'>('editorial')

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
    <AppLayout>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-[var(--txt)]">Admin</h1>
            <p className="text-sm text-[var(--muted)] mt-1">Setup, brand, content, and infrastructure.</p>
          </div>

          {/* Setup progress */}
          <Section id="setup" title="Setup">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--txt)]">
                    {pct === 100 ? 'Ready to ship' : `${doneCount} of ${steps.length} required steps complete`}
                  </span>
                  <span className="text-xs text-[var(--muted)]">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: accent }} />
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
                      <p className={cn('text-sm', s.ok ? 'text-[var(--txt)]' : 'text-[var(--muted)]')}>{s.label}</p>
                      {!s.ok && status && <p className="text-[11px] text-[var(--muted2)] mt-0.5">{s.action}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                    className="h-10 w-12 rounded-lg cursor-pointer border border-[var(--border)] bg-transparent" />
                  <input value={brand.ACCENT_COLOR} onChange={e => setBrand(b => ({ ...b, ACCENT_COLOR: e.target.value }))}
                    className={cn(input, 'flex-1 font-mono')} placeholder="#033882" />
                  <div className="h-10 w-10 rounded-lg border border-[var(--border)] shrink-0" style={{ background: accent }} />
                </div>
              </Field>
              <Field label="App Logo" hint="Icon shown in header and home page">
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(({ label, icon: Icon }) => (
                    <button key={label} title={label}
                      className={cn('h-10 w-10 rounded-xl border flex items-center justify-center transition-colors',
                        'border-[var(--border)] hover:border-[var(--txt)] text-[var(--muted)] hover:text-[var(--txt)]'
                      )}>
                      <Icon className="h-5 w-5" style={{ stroke: accent }} />
                    </button>
                  ))}
                  <p className="w-full text-[11px] text-[var(--muted)] mt-1">To change: edit <code className="bg-[var(--inp-bg)] px-1 rounded">src/components/AppLogo.tsx</code></p>
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

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                <div>
                  {!dbOk && <p className="text-[11px] text-amber-500">Connect a database first to save brand overrides.</p>}
                  {saveErr && <p className="text-[11px] text-red-400">{saveErr}</p>}
                  {!saveErr && dbOk && <p className="text-[11px] text-[var(--muted)]">Saves to DB · takes effect on next page load</p>}
                </div>
                <button onClick={saveBrand} disabled={saving || !dbOk}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40 hover:opacity-85 transition-opacity"
                  style={{ background: accent }}>
                  {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Brand'}
                </button>
              </div>
            </div>
          </Section>

          {/* Template */}
          <Section id="template" title="Template">
            <div className="flex items-center gap-6 border-b border-[var(--border)] -mt-1 mb-5">
              {[
                { id: 'editorial' as const, label: 'Editorial design', badge: 'Current' },
                { id: 'basic'     as const, label: 'Basic design',     badge: 'Legacy'  },
              ].map(t => {
                const active = templateTab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setTemplateTab(t.id)}
                    className={cn(
                      'flex items-center gap-2 -mb-px pb-3 pt-1 border-b-2 transition-colors text-[13px] font-medium',
                      active
                        ? 'border-[var(--txt)] text-[var(--txt)]'
                        : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]'
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    {t.label}
                    <span className={cn(
                      'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded',
                      t.id === 'editorial'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-[var(--inp-bg)] text-[var(--muted)]'
                    )}>{t.badge}</span>
                  </button>
                )
              })}
            </div>

            {templateTab === 'editorial' && <EditorialTemplate />}
            {templateTab === 'basic'     && <BasicTemplate />}
          </Section>

          {/* Content */}
          <Section id="content" title="Content">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { icon: BarChart2, label: 'Charts',    count: status?.content.charts ?? '—',        file: 'src/lib/chart-configs.ts',    href: '/charts'    },
                { icon: BookOpen,  label: 'Glossary',  count: status?.content.glossaryTerms ?? '—', file: 'src/lib/glossary-terms.ts',   href: '/glossary'  },
                { icon: Rocket,    label: 'Launchpad', count: status?.content.launchpadTabs ?? '—', file: 'src/lib/launchpad-data.ts',   href: '/launchpad' },
              ].map(({ icon: Icon, label, count, file, href }) => (
                <a key={label} href={href} className="rounded-xl border border-[var(--border)] p-4 text-center hover:border-[var(--txt)] transition-colors group">
                  <Icon className="h-5 w-5 mx-auto mb-2 text-[var(--muted)] group-hover:text-[var(--txt)] transition-colors" />
                  <p className="text-2xl font-bold text-[var(--txt)]">{count}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{label}</p>
                  <p className="text-[10px] text-[var(--muted2)] mt-2 font-mono break-all">{file}</p>
                </a>
              ))}
            </div>
            <div className="rounded-xl bg-[var(--inp-bg)] px-4 py-3.5 text-[12px] text-[var(--muted)] space-y-1.5">
              <p className="font-semibold text-[var(--txt)]">Adding content</p>
              <p>Charts: add entries to <code className="bg-[var(--border)] px-1 rounded">chart-configs.ts</code> + matching cases in <code className="bg-[var(--border)] px-1 rounded">chart/[slug]/page.tsx</code></p>
              <p>Glossary: add to <code className="bg-[var(--border)] px-1 rounded">glossary-terms.ts</code></p>
              <p>Launchpad cards: add to <code className="bg-[var(--border)] px-1 rounded">launchpad-data.ts</code></p>
            </div>
          </Section>

          {/* Navigation */}
          <Section id="navigation" title="Navigation">
            <p className="text-[12px] text-[var(--muted)] mb-4">Edit <code className="bg-[var(--inp-bg)] px-1.5 py-0.5 rounded">src/lib/app-config.ts</code> to change sidebar items, routes, and page titles.</p>
            <div className="rounded-xl border border-[var(--border)] overflow-hidden text-sm">
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
                <div key={item.label} className={cn('flex items-center justify-between px-4 py-2.5', i < arr.length - 1 && 'border-b border-[var(--border)]')}>
                  <span className="font-medium text-[var(--txt)]">{item.label}</span>
                  <code className="text-[11px] text-[var(--muted)] bg-[var(--inp-bg)] px-2 py-0.5 rounded">{item.href}</code>
                </div>
              ))}
            </div>
          </Section>

          {/* Infrastructure */}
          <Section id="infrastructure" title="Infrastructure">
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
            </div>
            {!dbOk && status && (
              <div className="mt-4 rounded-xl bg-[var(--inp-bg)] px-4 py-3.5 text-[12px] text-[var(--muted)]">
                <p className="font-semibold text-[var(--txt)] mb-1">Database setup (once you have DATABASE_URL)</p>
                <p>1. Create a project at <span className="text-sky-500">neon.tech</span></p>
                <p>2. Copy the connection string → Vercel env var <code className="bg-[var(--border)] px-1 rounded">DATABASE_URL</code></p>
                <p>3. Redeploy → come back here to verify the connection</p>
                <p>4. Once connected, brand config saves to the <code className="bg-[var(--border)] px-1 rounded">app_config</code> table (auto-created)</p>
              </div>
            )}
          </Section>

        </div>
      </div>
    </AppLayout>
  )
}

function TemplateBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] mb-2.5">{title}</p>
      <div className="text-[13px] text-[var(--txt)] leading-relaxed space-y-1.5">{children}</div>
    </div>
  )
}

function Token({ name, role, swatch }: { name: string; role: string; swatch?: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[12px]">
      {swatch && <span className="h-3.5 w-3.5 rounded-sm border border-[var(--border)] shrink-0" style={{ background: swatch }} />}
      <code className="font-mono text-[var(--txt)]">{name}</code>
      <span className="text-[var(--muted)]">— {role}</span>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--inp-bg)] text-[11px] font-mono text-[var(--txt)] border border-[var(--border)]">
      {children}
    </span>
  )
}

function EditorialTemplate() {
  return (
    <div className="space-y-6">
      <p className="text-[13px] text-[var(--muted)] leading-relaxed">
        Magazine-grade dark template. Paper palette on near-black, serif display type, ruled section heads, ranked rows.
        Used for all reader-facing surfaces — teams, players, games, sections, chat.
      </p>

      <div className="grid grid-cols-2 gap-6">
        <TemplateBlock title="Palette">
          <Token name="--paper"           role="panel background"        swatch="#0e0e0e" />
          <Token name="--paper-text"      role="primary text"            swatch="#ece6d8" />
          <Token name="--paper-strong"    role="accent — links only"     swatch="#033882" />
          <Token name="--paper-muted"     role="secondary text"          swatch="#9b9489" />
          <Token name="--paper-faint"     role="tertiary / labels"       swatch="#6c655b" />
          <Token name="--paper-quiet"     role="hover wash"              swatch="#1a1a1a" />
          <Token name="--paper-rule"      role="primary divider"         swatch="#2a2a2a" />
          <Token name="--paper-rule-soft" role="row divider"             swatch="#1f1f1f" />
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
            {['/chat','/launchpad','/team-2','/team/[slug]','/player/[slug]','/game/[id]','/section/section-xi','/division/[slug]'].map(p => <Chip key={p}>{p}</Chip>)}
          </div>
        </TemplateBlock>
      </div>

      <div className="rounded-xl bg-[var(--inp-bg)] px-4 py-3.5 text-[12px] text-[var(--muted)] space-y-1">
        <p className="font-semibold text-[var(--txt)]">Reference</p>
        <p>Full rule set: <code className="bg-[var(--border)] px-1 rounded">CLAUDE.md → Editorial Design System (Paper Palette)</code></p>
        <p>CSS variables defined in <code className="bg-[var(--border)] px-1 rounded">src/app/globals.css</code></p>
      </div>
    </div>
  )
}

function BasicTemplate() {
  return (
    <div className="space-y-6">
      <p className="text-[13px] text-[var(--muted)] leading-relaxed">
        The original light-mode dashboard template. Rounded cards, neutral sans, utilitarian forms. Being phased out as
        each surface is rebuilt in the editorial template.
      </p>

      <div className="grid grid-cols-2 gap-6">
        <TemplateBlock title="Palette">
          <Token name="--surface" role="card / panel background" swatch="#ffffff" />
          <Token name="--border"  role="dividers, card edges"    swatch="#e5e5e5" />
          <Token name="--txt"     role="primary text"            swatch="#0a0a0a" />
          <Token name="--muted"   role="secondary text"          swatch="#737373" />
          <Token name="--muted2"  role="tertiary / placeholder"  swatch="#a3a3a3" />
          <Token name="--inp-bg"  role="input / chip background" swatch="#f5f5f5" />
          <Token name="--row-hover" role="table row hover"       swatch="#f5f5f5" />
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
            {['/admin','/charts','/leaderboard','/player','/team','/school','/maps','/glossary'].map(p => <Chip key={p}>{p}</Chip>)}
          </div>
          <p className="text-[12px] text-[var(--muted)] pt-1.5">Migration target: every surface above will move to the editorial template.</p>
        </TemplateBlock>
      </div>

      <div className="rounded-xl bg-[var(--inp-bg)] px-4 py-3.5 text-[12px] text-[var(--muted)] space-y-1">
        <p className="font-semibold text-[var(--txt)]">Reference</p>
        <p>Variables defined in <code className="bg-[var(--border)] px-1 rounded">src/app/globals.css</code> (:root scope)</p>
        <p>This <code className="bg-[var(--border)] px-1 rounded">/admin</code> page is itself a basic-template surface.</p>
      </div>
    </div>
  )
}

function InfraRow({ icon: Icon, label, ok, loading, okText, failText, detail }: {
  icon: React.ComponentType<{ className?: string }>
  label: string; ok: boolean; loading: boolean
  okText: string; failText: string; detail?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 mt-0.5 text-[var(--muted)] shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--txt)]">{label}</span>
          {!loading && (
            ok
              ? <span className="text-xs text-emerald-500 font-medium">{okText}</span>
              : <span className="text-xs text-red-400 font-medium">Not configured</span>
          )}
        </div>
        {!loading && !ok && <p className="text-[11px] text-[var(--muted)] mt-0.5">{failText}</p>}
        {!loading && !ok && detail && <p className="text-[10px] text-red-300 mt-0.5 font-mono truncate">{detail}</p>}
      </div>
      <StatusDot ok={ok} loading={loading} />
    </div>
  )
}
