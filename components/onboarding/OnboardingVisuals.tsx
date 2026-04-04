// ── Decorative visual elements for onboarding screens 3–6 ─────────────────

export type VisualType =
  | 'card'         // screen 3 — realistic memory preview
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

// ── Realistic memory card ─────────────────────────────────────────────────
// No skeleton bars — real text, real avatars, real date, real note snippet.
// Uses a warm amber photo stand-in that feels like an actual photo, not UI.

function CardVisual() {
  return (
    <div
      className="w-72 rounded-3xl overflow-hidden bg-white"
      style={{ boxShadow: '0 6px 32px rgba(0,0,0,0.11), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      {/* "Photo" — warm amber/sunset tone, feels like a real moment */}
      <div
        className="h-44 relative"
        style={{
          background: 'linear-gradient(145deg, #D4956A 0%, #C17A4A 40%, #A85E35 100%)',
        }}
      >
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.3) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.2) 0%, transparent 50%)',
          }}
        />
        {/* Bottom scrim */}
        <div
          className="absolute inset-x-0 bottom-0 h-14"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.22), transparent)' }}
        />
        {/* Participant avatars — bottom left */}
        <div className="absolute bottom-3 left-4 flex items-center">
          {[
            { init: 'M', bg: '#8B7355' },
            { init: 'L', bg: '#7A6248' },
            { init: 'S', bg: '#6B543C' },
          ].map(({ init, bg }, i) => (
            <div
              key={init}
              className="w-6 h-6 rounded-full border-2 border-white/70 flex items-center justify-center text-white text-[8px] font-bold"
              style={{ background: bg, marginLeft: i === 0 ? 0 : '-6px', zIndex: 3 - i }}
            >
              {init}
            </div>
          ))}
        </div>
        {/* Date chip — top right */}
        <div
          className="absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[9px] text-white/90 font-medium"
          style={{ background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(4px)' }}
        >
          {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 pt-3.5 pb-4">
        {/* Title */}
        <p
          className="text-[15px] font-semibold leading-tight mb-1"
          style={{ color: '#111111' }}
        >
          Cena da Marco, finalmente
        </p>
        {/* Location */}
        <div className="flex items-center gap-1 mb-3">
          <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: 'rgba(0,0,0,0.28)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="text-[12px]" style={{ color: 'rgba(0,0,0,0.35)' }}>
            Roma, Pigneto
          </span>
        </div>
        {/* Note snippet */}
        <div
          className="rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(17,17,17,0.04)', border: '1px solid rgba(17,17,17,0.06)' }}
        >
          <p className="text-[12px] leading-relaxed" style={{ color: '#555555' }}>
            <span style={{ color: 'rgba(17,17,17,0.35)' }}>Mattia —</span>
            {' '}Ti ricordi quando siamo rimasti fino alle 2?
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Two perspectives ───────────────────────────────────────────────────────

function PerspectiveVisual() {
  return (
    <div className="flex gap-3 w-full max-w-[260px]">
      <div
        className="flex-1 rounded-2xl bg-white p-4 space-y-2.5"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[7px] font-bold text-white"
            style={{ background: '#8B7355' }}
          >
            M
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-black/30">Mattia</p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-black/08" />
        <div className="h-1.5 w-4/5 rounded-full bg-black/05" />
        <div className="h-1.5 w-2/3 rounded-full bg-black/04" />
      </div>
      <div
        className="flex-1 rounded-2xl bg-white p-4 space-y-2.5 mt-5"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[7px] font-bold text-white"
            style={{ background: '#6B543C' }}
          >
            L
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
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
          style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}
        >
          <div className="w-4 h-4 rounded-md bg-black/12" />
        </div>
        <span className="text-[9px] text-black/25 uppercase tracking-wider">Ieri</span>
      </div>
      <div className="flex-1 h-px bg-black/10" />
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
          style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}
        >
          <div className="w-4 h-4 rounded-md bg-black/12" />
        </div>
        <span className="text-[9px] text-black/25 uppercase tracking-wider">Oggi</span>
      </div>
      <div
        className="flex-1 h-px"
        style={{
          background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.10) 0, rgba(0,0,0,0.10) 4px, transparent 4px, transparent 8px)',
        }}
      />
      <div className="flex flex-col items-center gap-2 opacity-25">
        <div className="w-10 h-10 rounded-xl bg-white border border-dashed border-black/20" />
        <span className="text-[9px] text-black/25 uppercase tracking-wider">+</span>
      </div>
    </div>
  )
}

// ── Legacy / years ─────────────────────────────────────────────────────────

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
