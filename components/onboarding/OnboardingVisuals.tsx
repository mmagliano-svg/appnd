// ── Decorative visual elements for onboarding screens 3–6 ─────────────────
// Screen 3 — card: real memory card UI mock
// Screen 4 — perspective: two contributor cards
// Screen 5 — timeline: continuity line
// Screen 6 — legacy: typography-only years

export type VisualType =
  | 'card'         // screen 3 — real memory card UI
  | 'perspective'  // screen 4 — two contributors
  | 'timeline'     // screen 5 — continuity
  | 'legacy'       // screen 6 — years
  | 'none'

export function OnboardingVisual({ type }: { type: VisualType }) {
  switch (type) {
    case 'card':        return <CardVisual />
    case 'perspective': return <PerspectiveVisual />
    case 'timeline':    return <TimelineVisual />
    case 'legacy':      return <LegacyVisual />
    default:            return null
  }
}

// ── Real memory card UI mock ───────────────────────────────────────────────
// Looks like actual product — photo, title, date, contributor avatars

function CardVisual() {
  return (
    <div
      className="w-72 rounded-3xl overflow-hidden bg-white"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      {/* Photo area */}
      <div className="h-44 bg-gradient-to-br from-stone-100 to-stone-200 relative">
        {/* Overlay bottom gradient */}
        <div
          className="absolute inset-x-0 bottom-0 h-16"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.18), transparent)' }}
        />
        {/* Participant avatars bottom-left */}
        <div className="absolute bottom-3 left-4 flex items-center">
          <div className="w-6 h-6 rounded-full bg-white/80 border-2 border-white flex items-center justify-center">
            <span className="text-[7px] font-bold text-stone-500">M</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-white/80 border-2 border-white -ml-1.5 flex items-center justify-center">
            <span className="text-[7px] font-bold text-stone-500">L</span>
          </div>
        </div>
        {/* Date chip top-right */}
        <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
          <span className="text-[9px] text-white/90">15 mar</span>
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 pt-3 pb-4 space-y-2.5">
        {/* Title */}
        <div className="h-3.5 w-3/4 rounded-full bg-black/12" />
        {/* Location row */}
        <div className="flex items-center gap-1.5">
          <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: 'rgba(0,0,0,0.25)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <div className="h-2 w-1/3 rounded-full bg-black/07" />
        </div>
        {/* Contribution text preview */}
        <div className="pt-1 space-y-1.5 border-t border-black/[0.05]">
          <div className="h-2 w-full rounded-full bg-black/06" />
          <div className="h-2 w-4/5 rounded-full bg-black/04" />
        </div>
      </div>
    </div>
  )
}

// ── Two perspectives ───────────────────────────────────────────────────────

function PerspectiveVisual() {
  return (
    <div className="flex gap-3 w-full max-w-[260px]">
      {/* Contributor A */}
      <div
        className="flex-1 rounded-2xl bg-white p-4 space-y-2.5"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
            <span className="text-[7px] font-bold text-stone-500">M</span>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-black/30">Mattia</p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-black/08" />
        <div className="h-1.5 w-4/5 rounded-full bg-black/05" />
        <div className="h-1.5 w-2/3 rounded-full bg-black/04" />
      </div>
      {/* Contributor B — offset for depth */}
      <div
        className="flex-1 rounded-2xl bg-white p-4 space-y-2.5 mt-5"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
            <span className="text-[7px] font-bold text-stone-500">L</span>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-black/30">Luca</p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-black/08" />
        <div className="h-1.5 w-3/4 rounded-full bg-black/05" />
        <div className="h-1.5 w-1/2 rounded-full bg-black/04" />
      </div>
    </div>
  )
}

// ── Continuity timeline ────────────────────────────────────────────────────

function TimelineVisual() {
  return (
    <div className="flex items-center gap-0 w-full max-w-[240px]">
      {/* Point A */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
          style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}
        >
          <div className="w-4 h-4 rounded-md bg-black/12" />
        </div>
        <span className="text-[9px] text-black/25 uppercase tracking-wider">Ieri</span>
      </div>
      {/* Solid line */}
      <div className="flex-1 h-px bg-black/10" />
      {/* Point B */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
          style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}
        >
          <div className="w-4 h-4 rounded-md bg-black/12" />
        </div>
        <span className="text-[9px] text-black/25 uppercase tracking-wider">Oggi</span>
      </div>
      {/* Dashed extension */}
      <div
        className="flex-1 h-px"
        style={{
          background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.10) 0, rgba(0,0,0,0.10) 4px, transparent 4px, transparent 8px)',
        }}
      />
      {/* Point C — future, faded */}
      <div className="flex flex-col items-center gap-2 opacity-25">
        <div className="w-10 h-10 rounded-xl bg-white border border-dashed border-black/20" />
        <span className="text-[9px] text-black/25 uppercase tracking-wider">+</span>
      </div>
    </div>
  )
}

// ── Legacy / years — typography only ──────────────────────────────────────

function LegacyVisual() {
  const entries = [
    { year: '2024', opacity: 0.07,  size: 'text-lg'   },
    { year: '2025', opacity: 0.13,  size: 'text-2xl'  },
    { year: '2026', opacity: 0.55,  size: 'text-[44px] font-semibold' },
    { year: '2027', opacity: 0.15,  size: 'text-2xl'  },
    { year: '2030', opacity: 0.07,  size: 'text-lg'   },
  ]
  return (
    <div className="flex flex-col items-center gap-1">
      {entries.map(({ year, opacity, size }) => (
        <span
          key={year}
          className={`${size} tracking-tight leading-none tabular-nums`}
          style={{ color: `rgba(17,17,17,${opacity})` }}
        >
          {year}
        </span>
      ))}
    </div>
  )
}
