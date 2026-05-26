'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X, ChevronRight, ArrowLeft, Cpu, Lightbulb, Map, MapPin } from 'lucide-react'

/* ── Model icons ─────────────────────────────────────────────────────── */

const OPENAI_ICON = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
  </svg>
)

const ANTHROPIC_ICON = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.304 3.541H13.86L7.432 20.46h3.047l1.374-3.768h5.656l1.374 3.768h3.048L17.304 3.54zM12.79 13.695l1.941-5.31 1.94 5.31h-3.88zM6.696 3.541H3.25L9.678 20.46h3.047L6.696 3.54z" />
  </svg>
)

const GEMINI_ICON = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#4285F4">
    <path d="M12 1.5C12 1.5 8.5 8.5 1.5 12C8.5 15.5 12 22.5 12 22.5C12 22.5 15.5 15.5 22.5 12C15.5 8.5 12 1.5 12 1.5Z" />
  </svg>
)

const GROK_ICON = (
  <svg className="h-5 w-5" viewBox="0 0 2000 1920" fill="currentColor">
    <path d="M1997.505,5.546c-1.276,1.84-2.543,3.686-3.831,5.517c-44.395,63.091-89.508,125.693-132.964,189.424c-35.057,51.414-65.323,105.683-89.053,163.428c-34.447,83.828-47.232,171.046-42.05,261.249c3.355,58.404,12.861,115.859,25.887,172.786c16.297,71.216,24.256,143.247,20.188,216.29c-10.123,181.765-76.927,339.812-201.209,472.789c-107.86,115.406-239.56,189.915-394.446,221.624c-157.969,32.34-310.586,13.132-457.667-52.146c-43.51-19.311-84.795-42.677-124.218-69.344c-1.094-.74-2.147-1.54-3.745-2.692c1.543-.883,2.689-1.656,3.927-2.231c72.526-33.658,145.071-67.276,217.555-101.023c3.285-1.53,5.91-1.054,8.984.124c74.663,28.608,151.849,42.899,231.896,39.624c123.328-5.045,232.105-47.967,325.71-128.201c99.013-84.869,160.993-191.673,184.036-320.194c18.823-104.981,7.281-207.124-32.8-305.964c-13.942-34.381-52.565-47.733-86.226-30.057c-4.108,2.157-7.994,4.818-11.734,7.582c-216.828,160.265-433.63,320.565-650.436,480.86c-1.834,1.356-3.69,2.684-5.536,4.025c-.344-.374-.689-.747-1.033-1.121C1184.605,820.085,1590.468,412.274,1996.331,4.463C1996.722,4.824,1997.114,5.185,1997.505,5.546z" />
    <path d="M635.931,1353.173C425.433,1541.452,215.15,1729.537,4.867,1917.623c-.275-.19-.551-.38-.826-.57c1.039-1.478,2.041-2.984,3.123-4.431c29.898-39.969,63.26-76.964,97.26-113.421c40.804-43.752,82.042-87.114,122.109-131.532c35.108-38.921,66.724-80.614,91.953-126.809c19.879-36.398,34.424-74.673,40.535-115.893c7.782-52.496,1.059-103.422-17.762-152.706c-13.437-35.185-26.864-70.312-36.291-106.847c-21.394-82.908-28.324-166.979-21.201-252.304c19.974-239.28,151.763-453.739,355.913-578.35c90.292-55.114,188.023-89.471,292.95-102.908c130.165-16.669,256.024-.09,377.981,48.558c52.942,21.118,102.709,47.566,149.092,80.552c1.22.868,2.42,1.767,3.601,2.688c.244.19.36.544.758,1.179c-1.649.801-3.241,1.608-4.86,2.357c-71.815,33.205-143.623,66.428-215.499,99.5c-2.256,1.038-5.598,1.456-7.816.587c-152.615-59.802-303.123-52.584-449.63,18.494c-142.377,69.074-234.294,183.195-283.161,332.63c-22.431,68.594-30.403,139.234-23.761,211.172c11.547,125.044,63.341,231.057,152.534,319.089c1.067,1.053,2.142,2.099,3.193,3.168C635.287,1352.055,635.421,1352.372,635.931,1353.173z" />
  </svg>
)

/* ── Dummy data ──────────────────────────────────────────────────────── */

const MODELS = [
  { id: 'gpt-4o',                  label: 'GPT-4o',                icon: OPENAI_ICON    },
  { id: 'gpt-4o-mini',             label: 'GPT-4o Mini',           icon: OPENAI_ICON    },
  { id: 'gpt-4-turbo',             label: 'GPT-4 Turbo',           icon: OPENAI_ICON    },
  { id: 'claude-sonnet',           label: 'Claude Sonnet',         icon: ANTHROPIC_ICON },
  { id: 'claude-haiku',            label: 'Claude Haiku',          icon: ANTHROPIC_ICON },
  { id: 'gemini-3-flash-preview',  label: 'Gemini 3 Flash',        icon: GEMINI_ICON    },
  { id: 'gemini-2.5-flash',        label: 'Gemini 2.5 Flash',      icon: GEMINI_ICON    },
  { id: 'gemini-2.5-flash-lite',   label: 'Gemini 2.5 Flash Lite', icon: GEMINI_ICON    },
  { id: 'grok-fast',               label: 'Grok Fast',             icon: GROK_ICON      },
]

const SAMPLE_QUESTIONS = [
  'Who were the top rushing leaders in Section XI last season?',
  'How did Sayville perform over the last five seasons?',
  'Which Division I teams have the best all-time win percentage?',
  'Who are the best quarterbacks Section XI has seen in recent years?',
  'Compare Ward Melville and William Floyd head to head historically',
]

type Panel = 'main' | 'models' | 'questions' | 'states' | 'counties'

interface PlusMenuProps {
  onSelect?: (text: string) => void
}

export function PlusMenu({ onSelect }: PlusMenuProps) {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>('main')
  const [search, setSearch] = useState('')
  const [selectedModel, setSelectedModel] = useState('gpt-4o')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function close() { setOpen(false); setPanel('main'); setSearch('') }
  function goBack() { setPanel('main'); setSearch('') }
  function drillTo(p: Panel) { setPanel(p); setSearch('') }

  const panelLabel = panel === 'models' ? 'Models' : panel === 'questions' ? 'Sample Questions' : panel === 'states' ? 'States' : 'Counties'

  const filteredModels = MODELS.filter(m => !search || m.label.toLowerCase().includes(search.toLowerCase()))
  const filteredQuestions = SAMPLE_QUESTIONS.filter(q => !search || q.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative" ref={ref}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => open ? close() : setOpen(true)}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          open
            ? 'ring-2 ring-blue-500 text-[var(--txt)]'
            : 'text-[var(--muted)] hover:bg-black/7 hover:text-[var(--txt)]'
        }`}
      >
        {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </button>

      {/* Main panel */}
      {open && panel === 'main' && (
        <div className="absolute left-0 bottom-full mb-2 w-56 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden z-20">
          {[
            { key: 'models',    label: 'Models',           icon: <Cpu className="h-5 w-5" />       },
            { key: 'questions', label: 'Sample Questions',  icon: <Lightbulb className="h-5 w-5" /> },
            { key: 'states',    label: 'Teams',             icon: <Map className="h-5 w-5" />       },
            { key: 'counties',  label: 'Players',           icon: <MapPin className="h-5 w-5" />    },
          ].map(({ key, label, icon }, i) => (
            <button
              key={key}
              onClick={() => drillTo(key as Panel)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-[var(--inp-bg)] transition-colors ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
            >
              <span className="text-[var(--muted)]">{icon}</span>
              <span className="flex-1 text-left text-[var(--txt)]">{label}</span>
              <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
            </button>
          ))}
        </div>
      )}

      {/* Drill-down panel */}
      {open && panel !== 'main' && (
        <div className="absolute left-0 bottom-full mb-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden z-20">
          {/* Search header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)]">
            <button onClick={goBack} className="text-[var(--muted)] hover:text-[var(--txt)] shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${panelLabel}...`}
              autoFocus
              className="flex-1 bg-transparent text-base text-[var(--txt)] outline-none placeholder:text-[var(--muted2)]"
            />
          </div>

          <div className="max-h-80 overflow-y-auto no-scrollbar">
            {/* Models */}
            {panel === 'models' && filteredModels.map((m, i) => (
              <button
                key={m.id}
                onClick={() => { setSelectedModel(m.id); close() }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--inp-bg)] transition-colors ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
              >
                <span className="text-[var(--muted)] shrink-0">{m.icon}</span>
                <span className="flex-1 text-left font-medium text-[var(--txt)]">{m.label}</span>
                {m.id === selectedModel && (
                  <svg className="h-4 w-4 shrink-0 text-[var(--txt)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}

            {/* Sample Questions */}
            {panel === 'questions' && filteredQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => { onSelect?.(q); close() }}
                className={`flex w-full items-start px-4 py-3 hover:bg-[var(--inp-bg)] transition-colors ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
              >
                <span className="text-sm text-[var(--txt)] text-left">{q}</span>
              </button>
            ))}

            {/* States / Counties — placeholder */}
            {(panel === 'states' || panel === 'counties') && (
              <p className="px-4 py-3 text-xs text-[var(--muted)]">Type to search {panelLabel.toLowerCase()}…</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
