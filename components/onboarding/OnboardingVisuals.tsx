// ── Decorative visual elements for onboarding screens 4–7 ─────────────────
// Screens 1–3 use no visual — pure text, emotional space.
// Screens 4–6 use white cards on warm gray, subtle shadow.
// Screen 7 uses typography-only year stack.

export type VisualType =
  | 'card'         // screen 4 — what a moment looks like
  | 'perspective'  // screen 5 — two contributors
  | 'timeline'     // screen 6 — continuity
  | 'legacy'       // screen 7 — years
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

// ── Mock memory card ───────────────────────────────────────────────────────
// White card on warm gray background — clean, Apple Photos energy

function CardVisual() {
  return (
    <div
      className="w-64 rounded-2xl overflow-hidden bg-white"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      {/* Photo placeholder */}
      <div className="h-36 bg-gradient-to-br from-stone-100 to-stone-200 relative">
        {/* Subtle avatar dots bottom-left */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-white/40" />
          <div className="w-5 h-5 rounded-full bg-white/30 -ml-2" />
        </div>
      </div>
      {/* Info rows */}
      <div className="px-4 py-3.5 space-y-2 bg-white">
        <div className="h-2.5 w-2/3 rounded-full bg-black/10" />
        <div className="flex items-center gap-2">
          <div className="h-2 w-1/4 rounded-full bg-black/06" />
          <div className="h-2 w-1/3 rounded-full bg-black/06" />
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
        <p className="text-[10px] font-semibold uppercase tracking-widest text-black/30">Mattia</p>
        <div className="h-1.5 w-full rounded-full bg-black/08" />
        <div className="h-1.5 w-4/5 rounded-full bg-black/05" />
        <div className="h-1.5 w-2/3 rounded-full bg-black/04" />
      </div>
      {/* Contributor B — offset for depth */}
      <div
        className="flex-1 rounded-2xl bg-white p-4 space-y-2.5 mt-5"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest text-black/30">Luca</p>
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
      {/* Dashed line */}
      <div
        className="flex-1 h-px"
        style={{
          background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.10) 0, rgba(0,0,0,0.10) 4px, transparent 4px, transparent 8px)',
        }}
      />
      {/* Point C — future, faded */}
      <div className="flex flex-col items-center gap-2 opacity-25">
        <div
          className="w-10 h-10 rounded-xl bg-white border border-dashed border-black/20"
        />
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
    { year: '2026', opacity: 0.55,  size: 'text-[42px] font-semibold' },
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
