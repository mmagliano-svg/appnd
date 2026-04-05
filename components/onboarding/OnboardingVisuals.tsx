// ── Real-photo onboarding visuals ─────────────────────────────────────────
//
// Photos must live at:
//   /public/onboarding/photo-beach.jpg      (Screen 3 — beach/water family)
//   /public/onboarding/photo-snow.jpg       (Screen 4 — snow selfie)
//   /public/onboarding/photo-christmas.jpg  (Screen 5 — Christmas portrait)
//
// Each component has a <noscript>-safe warm fallback gradient so the screen
// is never broken if the image fails to load.

export type VisualType =
  | 'card'         // screen 3 — realistic memory card with beach photo
  | 'perspective'  // screen 4 — snow photo with note bubbles
  | 'timeline'     // screen 5 — christmas photo with time hints
  | 'legacy'       // screen 6 — year typography
  | 'create'       // screen 7 — conversion: christmas photo, full frame
  | 'none'

export function OnboardingVisual({ type }: { type: VisualType }) {
  switch (type) {
    case 'card':        return <CardVisual />
    case 'perspective': return <PerspectiveVisual />
    case 'timeline':    return <TimelineVisual />
    case 'legacy':      return <LegacyVisual />
    case 'create':      return <CreateVisual />
    default:            return null
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

// Subtle bottom scrim so text/chips over photos stay readable
function PhotoScrim({ top = false }: { top?: boolean }) {
  return (
    <div
      className="absolute inset-x-0 pointer-events-none"
      style={
        top
          ? { top: 0, height: 48, background: 'linear-gradient(to bottom, rgba(0,0,0,0.18), transparent)' }
          : { bottom: 0, height: 72, background: 'linear-gradient(to top, rgba(0,0,0,0.30), transparent)' }
      }
    />
  )
}

// ── SCREEN 3 — realistic memory card ─────────────────────────────────────
// Uses photo-beach.jpg. Shows title, location, avatars, note snippet.

function CardVisual() {
  return (
    <div
      className="w-72 rounded-3xl overflow-hidden bg-white"
      style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      {/* Photo */}
      <div className="relative h-44 overflow-hidden bg-amber-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/onboarding/photo-beach.jpg"
          alt=""
          className="w-full h-full object-cover animate-ob-photo"
          style={{ transformOrigin: 'center center' }}
        />
        <PhotoScrim />

        {/* Avatars — bottom left, overlapping */}
        <div className="absolute bottom-3 left-3.5 flex items-center">
          {[
            { init: 'M', bg: 'rgba(60,40,20,0.75)' },
            { init: 'L', bg: 'rgba(40,30,15,0.70)' },
            { init: 'F', bg: 'rgba(80,50,25,0.65)' },
          ].map(({ init, bg }, i) => (
            <div
              key={init}
              className="w-6 h-6 rounded-full border-[1.5px] border-white/60 flex items-center justify-center text-white text-[8px] font-bold backdrop-blur-sm"
              style={{ background: bg, marginLeft: i === 0 ? 0 : '-5px', zIndex: 3 - i }}
            >
              {init}
            </div>
          ))}
        </div>

        {/* Date chip — top right */}
        <div
          className="absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[9px] font-medium text-white/90"
          style={{ background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(6px)' }}
        >
          {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 pt-3.5 pb-4 space-y-2">
        {/* Title */}
        <p className="text-[14px] font-semibold leading-tight" style={{ color: '#111111' }}>
          Mattina al mare tutti insieme
        </p>
        {/* Location */}
        <div className="flex items-center gap-1">
          <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: 'rgba(0,0,0,0.28)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="text-[11px]" style={{ color: 'rgba(0,0,0,0.32)' }}>Sardegna</span>
        </div>
        {/* Note snippet */}
        <div
          className="rounded-xl px-3 py-2 mt-0.5"
          style={{ background: 'rgba(17,17,17,0.04)', border: '1px solid rgba(17,17,17,0.06)' }}
        >
          <p className="text-[11.5px] leading-relaxed" style={{ color: '#555555' }}>
            <span style={{ color: 'rgba(17,17,17,0.32)' }}>Mamma —</span>
            {' '}Federico rideva ogni volta che l&apos;acqua gli toccava i piedi
          </p>
        </div>
      </div>
    </div>
  )
}

// ── SCREEN 4 — shared perspective with note bubbles ───────────────────────
// Uses photo-snow.jpg. Shows that other people contribute their own view.

function PerspectiveVisual() {
  return (
    <div className="relative w-[280px]">

      {/* Photo card */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{ boxShadow: '0 6px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)' }}
      >
        <div className="relative h-52 overflow-hidden bg-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/onboarding/photo-snow.jpg"
            alt=""
            className="w-full h-full object-cover animate-ob-photo"
          />
          <PhotoScrim />
          <PhotoScrim top />
        </div>
      </div>

      {/* Note bubble 1 — left, below center */}
      <div
        className="absolute left-0 -bottom-1 max-w-[160px] rounded-2xl rounded-bl-sm px-3 py-2 translate-y-2"
        style={{
          background: 'white',
          boxShadow: '0 2px 12px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)',
        }}
      >
        <p className="text-[11px] leading-snug" style={{ color: '#333333' }}>
          <span className="font-semibold" style={{ color: '#6B5FE8' }}>Cate </span>
          Le maschere erano troppo forti 😂
        </p>
      </div>

      {/* Note bubble 2 — right, overlapping photo bottom-right */}
      <div
        className="absolute right-0 bottom-8 max-w-[155px] rounded-2xl rounded-br-sm px-3 py-2"
        style={{
          background: 'white',
          boxShadow: '0 2px 12px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)',
        }}
      >
        <p className="text-[11px] leading-snug" style={{ color: '#333333' }}>
          <span className="font-semibold" style={{ color: '#8B7355' }}>Mamma </span>
          Stava per venire giù il temporale
        </p>
      </div>

    </div>
  )
}

// ── SCREEN 5 — memory grows over time ────────────────────────────────────
// Uses photo-christmas.jpg. Shows continuity with subtle time labels.

function TimelineVisual() {
  return (
    <div className="flex flex-col items-center gap-4 w-[260px]">

      {/* Photo card */}
      <div
        className="w-full rounded-3xl overflow-hidden"
        style={{ boxShadow: '0 6px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)' }}
      >
        <div className="relative h-52 overflow-hidden bg-red-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/onboarding/photo-christmas.jpg"
            alt=""
            className="w-full h-full object-cover animate-ob-photo"
          />
          <PhotoScrim />
        </div>
      </div>

      {/* Time continuity hints */}
      <div className="flex items-center gap-2 px-2 w-full">
        <div
          className="rounded-full px-3 py-1 text-[10px] font-medium"
          style={{ background: 'rgba(17,17,17,0.07)', color: 'rgba(17,17,17,0.55)' }}
        >
          Quel giorno
        </div>
        {/* Dotted line */}
        <div
          className="flex-1 h-px"
          style={{
            background: 'repeating-linear-gradient(90deg, rgba(17,17,17,0.12) 0, rgba(17,17,17,0.12) 4px, transparent 4px, transparent 8px)',
          }}
        />
        <div
          className="rounded-full px-3 py-1 text-[10px] font-medium"
          style={{ background: 'rgba(107,95,232,0.10)', color: '#6B5FE8' }}
        >
          1 anno dopo
        </div>
      </div>

    </div>
  )
}

// ── SCREEN 7 — conversion: "this moment already exists, save it" ─────────
// Uses photo-christmas.jpg. Full-frame card, no decorations — the image
// that will visually "become" the create card when the user taps CTA.

function CreateVisual() {
  return (
    <div
      className="w-[280px] rounded-3xl overflow-hidden"
      style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      <div className="relative h-56 overflow-hidden bg-red-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/onboarding/photo-christmas.jpg"
          alt=""
          className="w-full h-full object-cover animate-ob-photo"
          style={{ transformOrigin: 'center center' }}
        />
        {/* Very subtle warm overlay — almost invisible */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.05))' }}
        />
      </div>
    </div>
  )
}

// ── SCREEN 6 — legacy / years ─────────────────────────────────────────────

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
