import Link from 'next/link'

export default function HeroCard() {
  return (
    <div className="relative mb-4 overflow-hidden rounded-xl bg-[#0e0e0e] flex flex-col"
      style={{ minHeight: '520px', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}>

      {/* Goalpost line-art background */}
      <div className="absolute inset-0 flex items-start justify-center pt-6 pointer-events-none select-none">
        <svg viewBox="0 0 320 340" fill="none" xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto opacity-[0.13]" stroke="white" strokeLinecap="round" strokeLinejoin="round">

          {/* ── Goalposts ── */}
          {/* Base pole */}
          <line x1="160" y1="310" x2="160" y2="220" strokeWidth="3" />
          {/* Crossbar */}
          <line x1="60"  y1="220" x2="260" y2="220" strokeWidth="2" />
          {/* Left upright */}
          <line x1="60"  y1="220" x2="60"  y2="80"  strokeWidth="2" />
          {/* Right upright */}
          <line x1="260" y1="220" x2="260" y2="80"  strokeWidth="2" />

          {/* ── Field perspective ── */}
          {/* Horizon line */}
          <line x1="0" y1="310" x2="320" y2="310" strokeWidth="0.75" />
          {/* Left sideline (perspective) */}
          <line x1="160" y1="310" x2="0"   y2="430" strokeWidth="0.75" />
          {/* Right sideline (perspective) */}
          <line x1="160" y1="310" x2="320" y2="430" strokeWidth="0.75" />

          {/* Yard lines (5) converging to vanishing point at 160,310 */}
          {[0.2, 0.38, 0.55, 0.7, 0.84].map((t, i) => {
            const y = 310 + t * 120
            const x1 = 160 - t * 160
            const x2 = 160 + t * 160
            return <line key={i} x1={x1} y1={y} x2={x2} y2={y} strokeWidth="0.75" />
          })}

          {/* Hash marks on left side */}
          {[0.2, 0.38, 0.55, 0.7, 0.84].map((t, i) => {
            const y  = 310 + t * 120
            const x  = 160 - t * 160 + t * 28
            return <line key={i} x1={x - 5} y1={y} x2={x + 5} y2={y} strokeWidth="1" />
          })}
          {/* Hash marks on right side */}
          {[0.2, 0.38, 0.55, 0.7, 0.84].map((t, i) => {
            const y  = 310 + t * 120
            const x  = 160 + t * 160 - t * 28
            return <line key={i} x1={x - 5} y1={y} x2={x + 5} y2={y} strokeWidth="1" />
          })}

          {/* Subtle stadium arc lines at top */}
          <path d="M 0 80 Q 160 20 320 80"  strokeWidth="0.75" />
          <path d="M 20 110 Q 160 55 300 110" strokeWidth="0.5"  />
          <path d="M 40 140 Q 160 90 280 140" strokeWidth="0.5"  />
        </svg>
      </div>

      {/* Content — pushed to bottom */}
      <div className="relative z-10 flex flex-col items-center justify-end flex-1 px-7 pb-9 pt-16 text-center">

        {/* Logo lockup */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-3xl font-black tracking-tight text-white leading-none">SPORTS</span>
          <span className="border border-white/60 px-2 py-0.5 text-xs font-bold text-white tracking-[0.18em] leading-none mt-0.5">GPT</span>
        </div>

        {/* Eyebrow */}
        <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/40 mb-3">
          Section XI · Long Island
        </p>

        {/* Title */}
        <h2 className="text-xl font-black uppercase tracking-widest text-white mb-4 leading-tight">
          Football<br />Photo Gallery
        </h2>

        {/* Body */}
        <p className="text-sm text-white/50 leading-relaxed mb-8 max-w-[220px]">
          Players, teams, and moments from the fields of Section XI varsity football.
        </p>

        {/* CTA */}
        <Link href="/team"
          className="bg-white text-black text-sm font-bold px-7 py-3 rounded-xl hover:bg-white/90 active:scale-95 transition-all">
          Explore Teams
        </Link>
      </div>

    </div>
  )
}
