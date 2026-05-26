export default function PlayerGameLogLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto no-scrollbar"
      style={{ backgroundColor: 'var(--paper)', color: 'var(--paper-text)' }}
    >
      {/* Identity block */}
      <div className="px-5 py-5 border-b border-[var(--paper-rule)] space-y-2">
        <div className="h-6 w-44 rounded bg-[var(--paper-quiet)] animate-pulse" />
        <div className="h-[14px] w-56 rounded bg-[var(--paper-quiet)] animate-pulse" />
      </div>

      {/* Two skeleton accordion sections */}
      {[0, 1].map(i => (
        <div
          key={i}
          className="mx-3 mb-3 mt-2 border border-[var(--paper-rule)] overflow-hidden bg-[var(--paper-quiet)]"
          style={{ borderRadius: 3 }}
        >
          <div className="flex items-center justify-between px-4 h-[46px]">
            <div className="h-4 w-24 rounded bg-[color:color-mix(in_srgb,var(--paper-text)_8%,transparent)] animate-pulse" />
            <div className="h-3.5 w-3.5 rounded-sm bg-[color:color-mix(in_srgb,var(--paper-text)_8%,transparent)] animate-pulse" />
          </div>
          <div className="border-t border-[var(--paper-rule)] divide-y divide-[var(--paper-rule-soft)]">
            {[0, 1, 2, 3].map(j => (
              <div key={j} className="flex items-center justify-between px-4 py-2.5">
                <div className="h-3 w-12 rounded bg-[color:color-mix(in_srgb,var(--paper-text)_6%,transparent)] animate-pulse" />
                <div className="h-3.5 w-10 rounded bg-[color:color-mix(in_srgb,var(--paper-text)_8%,transparent)] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
