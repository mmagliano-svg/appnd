'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingProgress } from './OnboardingProgress'
import { OnboardingVisual, type VisualType } from './OnboardingVisuals'
import { DRAFT_KEY } from '@/lib/onboarding/draft'

// ── Screen config ─────────────────────────────────────────────────────────

interface ScreenData {
  key: string
  title: string
  subtitle: string
  body?: string
  visual: VisualType
  ctaLabel?: string
  accentCta?: boolean
}

const SCREENS: ScreenData[] = [
  {
    key: 'hook',
    title: 'Un giorno tornerai qui',
    subtitle: 'E tutto questo avrà ancora un senso',
    visual: 'none',
  },
  {
    key: 'reality',
    title: 'I momenti passano',
    subtitle: 'Ma quello che hai vissuto no',
    visual: 'none',
  },
  {
    key: 'definition',
    title: 'Questo è un momento',
    subtitle: 'Non solo una foto',
    body: 'È dove eri davvero.',
    visual: 'card',
  },
  {
    key: 'perspective',
    title: 'Non solo il tuo punto di vista',
    subtitle: 'Chi era con te può aggiungere il suo',
    body: 'Ogni ricordo diventa condiviso',
    visual: 'perspective',
  },
  {
    key: 'continuity',
    title: 'E continua a crescere',
    subtitle: 'Ogni volta che ci torni',
    visual: 'timeline',
  },
  {
    key: 'legacy',
    title: 'Tra anni, sarà ancora lì',
    subtitle: 'E racconterà di più',
    visual: 'legacy',
  },
  {
    key: 'create',
    title: 'Inizia dal tuo\nprimo momento',
    subtitle: '',
    visual: 'none',
    ctaLabel: 'Crea il tuo primo momento',
    accentCta: true,
  },
]

// ── Cycling placeholders ──────────────────────────────────────────────────
const PLACEHOLDERS = [
  'Estate insieme al mare',
  'Quel giorno sulla neve',
  'Natale tutti insieme',
  'Prima volta sui pattini',
  'Cena da Marco, finalmente',
]

// ── Create-form animation phases ─────────────────────────────────────────
// card      → card springs in (150–400ms)
// input     → input area fades up (400–600ms)
// breathing → card pulse (600–900ms), steady afterward
type CreatePhase = 'card' | 'input' | 'breathing'

// ── Component ─────────────────────────────────────────────────────────────

export function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [screenKey, setScreenKey] = useState(0)

  // ── Layout switch (shows create form instead of onboarding screen) ─────
  const [showCreate, setShowCreate] = useState(false)

  // ── Heading fade on last screen (before layout switch) ────────────────
  const [headingFading, setHeadingFading] = useState(false)

  // ── Create-form animation phase ────────────────────────────────────────
  const [createPhase, setCreatePhase] = useState<CreatePhase>('card')

  // ── Create-form state ──────────────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [createError, setCreateError] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [placeholderVisible, setPlaceholderVisible] = useState(true)
  const titleRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split('T')[0]
  const todayLabel = new Date().toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // Cycling placeholder — only active when input is visible
  useEffect(() => {
    if (createPhase !== 'input' && createPhase !== 'breathing') return
    const id = setInterval(() => {
      setPlaceholderVisible(false)
      setTimeout(() => {
        setPlaceholderIndex(i => (i + 1) % PLACEHOLDERS.length)
        setPlaceholderVisible(true)
      }, 220)
    }, 2800)
    return () => clearInterval(id)
  }, [createPhase])

  // Auto-focus title input when it becomes interactive
  useEffect(() => {
    if (createPhase === 'input') {
      const t = setTimeout(() => titleRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [createPhase])

  // ── Transition sequence ────────────────────────────────────────────────
  // Step 1 (0–150ms):  fade out heading on onboarding screen
  // Step 2 (150ms):    switch to create layout, card starts at scale(0.92)
  // Step 3 (400ms):    input area fades up
  // Step 4 (600ms):    breathing pulse on card
  function startCreateTransition() {
    setHeadingFading(true)
    setTimeout(() => {
      setShowCreate(true)
      setCreatePhase('card')
      setTimeout(() => setCreatePhase('input'), 250)
      setTimeout(() => setCreatePhase('breathing'), 450)
    }, 150)
  }

  // ── Create-form submit ─────────────────────────────────────────────────
  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setCreateError('Dagli un nome per continuare.')
      titleRef.current?.focus()
      return
    }
    const draft = { title: trimmed, description: description.trim(), start_date: today }
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch { /* noop */ }
    router.push('/auth/login?next=' + encodeURIComponent('/onboarding/restore'))
  }

  // ── Onboarding navigation ──────────────────────────────────────────────
  const screen = SCREENS[step]
  const isLastScreen = step === SCREENS.length - 1

  const advance = useCallback((fn: () => void) => {
    fn()
    setScreenKey(k => k + 1)
  }, [])

  const handleNext = useCallback(() => {
    if (isLastScreen) {
      startCreateTransition()
      return
    }
    advance(() => setStep(s => s + 1))
  }, [isLastScreen, advance])

  const handleBack = useCallback(() => {
    if (showCreate) {
      // Return to last onboarding screen
      setShowCreate(false)
      setHeadingFading(false)
      setCreatePhase('card')
      setTitle('')
      setDescription('')
      setCreateError('')
      return
    }
    if (step > 0) {
      advance(() => setStep(s => s - 1))
    }
  }, [step, advance, showCreate])

  const handleSkip = useCallback(() => {
    router.push('/auth/login')
  }, [router])

  const canGoBack = showCreate || step > 0

  // ── Computed animation values ─────────────────────────────────────────
  const cardIn   = createPhase === 'card' || createPhase === 'input' || createPhase === 'breathing'
  const inputIn  = createPhase === 'input' || createPhase === 'breathing'
  const doBreathe = createPhase === 'breathing'

  // ── CTA style ─────────────────────────────────────────────────────────
  const ctaStyle = screen.accentCta
    ? { background: '#6B5FE8', color: '#ffffff' }
    : { background: '#E8E8E5', color: '#111111' }

  // ── Preview card title ────────────────────────────────────────────────
  const previewTitle = title.trim()

  // ── CREATE LAYOUT ──────────────────────────────────────────────────────
  if (showCreate) {
    return (
      <div
        className="h-[100dvh] flex flex-col overflow-hidden"
        style={{ background: '#F7F7F5' }}
      >
        {/* Top bar */}
        <div
          className="flex items-center px-5 pb-3"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 20px)' }}
        >
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 -ml-2 flex items-center justify-center transition-opacity active:opacity-50"
            aria-label="Indietro"
            style={{ color: 'rgba(17,17,17,0.30)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleCreateSubmit}
          className="flex-1 flex flex-col px-6 pt-2 overflow-y-auto"
        >

          {/* ── Preview card — springs in ──────────────────────────── */}
          <div
            style={{
              opacity: cardIn ? 1 : 0,
              transform: cardIn ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(40px)',
              transition: 'opacity 250ms ease, transform 250ms cubic-bezier(0.22, 1, 0.36, 1)',
              animation: doBreathe ? 'ob-card-breathe 300ms ease-in-out' : undefined,
              marginBottom: '2rem',
            }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
                background: 'white',
              }}
            >
              {/* Card photo area */}
              <div
                className="h-28 relative"
                style={{
                  background: 'linear-gradient(145deg, #D4956A 0%, #C17A4A 45%, #A85E35 100%)',
                }}
              >
                <div
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 25% 35%, rgba(255,255,255,0.4) 0%, transparent 55%)',
                  }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-10"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.20), transparent)' }}
                />
                {/* Avatar placeholder */}
                <div className="absolute bottom-2.5 left-3 flex">
                  <div
                    className="w-5 h-5 rounded-full border-[1.5px] border-white/60 flex items-center justify-center text-white text-[7px] font-bold"
                    style={{ background: 'rgba(60,40,20,0.70)' }}
                  >
                    ○
                  </div>
                </div>
                {/* Date chip */}
                <div
                  className="absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[8px] font-medium text-white/90"
                  style={{ background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(6px)' }}
                >
                  {todayLabel}
                </div>
              </div>

              {/* Live title preview */}
              <div className="px-3.5 py-3">
                {previewTitle ? (
                  <p
                    className="text-[14px] font-semibold leading-tight"
                    style={{ color: '#111111', transition: 'color 150ms' }}
                  >
                    {previewTitle}
                  </p>
                ) : (
                  <p
                    className="text-[14px] font-medium leading-tight"
                    style={{ color: 'rgba(17,17,17,0.22)' }}
                  >
                    Il nome del tuo momento…
                  </p>
                )}
                <p className="text-[11px] mt-1" style={{ color: 'rgba(17,17,17,0.30)' }}>
                  in creazione
                </p>
              </div>
            </div>
          </div>

          {/* ── Heading — fades up with input ─────────────────────── */}
          <div
            style={{
              opacity: inputIn ? 1 : 0,
              transform: inputIn ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 200ms ease, transform 200ms ease',
              marginBottom: '1.75rem',
            }}
          >
            <h1
              className="text-[26px] font-semibold leading-tight tracking-[-0.02em] mb-1.5"
              style={{ color: '#111111' }}
            >
              Come lo chiameresti?
            </h1>
            <p className="text-[14px]" style={{ color: '#ABABAB' }}>
              Il nome che gli daresti se lo raccontassi a qualcuno.
            </p>
          </div>

          {/* ── Title input ──────────────────────────────────────────── */}
          <div
            style={{
              opacity: inputIn ? 1 : 0,
              transform: inputIn ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 200ms ease 40ms, transform 200ms ease 40ms',
              marginBottom: '1.75rem',
            }}
          >
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setCreateError('') }}
              placeholder={placeholderVisible ? PLACEHOLDERS[placeholderIndex] : ''}
              className="w-full bg-transparent text-[21px] font-semibold focus:outline-none border-b pb-3 leading-snug tracking-tight"
              style={{
                color: '#111111',
                borderColor: title ? 'rgba(17,17,17,0.20)' : 'rgba(17,17,17,0.10)',
                caretColor: '#6B5FE8',
                transition: 'border-color 200ms',
              }}
            />
            {createError && (
              <p className="mt-2.5 text-[12px]" style={{ color: '#E05252' }}>{createError}</p>
            )}
          </div>

          {/* ── Optional description ──────────────────────────────── */}
          <div
            style={{
              opacity: inputIn ? 1 : 0,
              transform: inputIn ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 200ms ease 80ms, transform 200ms ease 80ms',
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-2.5"
              style={{ color: 'rgba(17,17,17,0.28)' }}
            >
              C&apos;è qualcosa che vuoi ricordare subito?
              <span className="ml-1 normal-case font-normal" style={{ color: 'rgba(17,17,17,0.18)' }}>
                — facoltativo
              </span>
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Com'era? Chi c'era? Come ti sentivi?"
              rows={3}
              className="w-full rounded-2xl px-4 py-3 text-[14px] focus:outline-none resize-none leading-relaxed"
              style={{
                background: 'rgba(17,17,17,0.04)',
                border: '1px solid rgba(17,17,17,0.07)',
                color: '#111111',
                caretColor: '#6B5FE8',
              }}
            />
          </div>

          <div className="flex-1 min-h-4" />

          {/* ── Privacy note + CTA ───────────────────────────────── */}
          <div
            style={{
              opacity: inputIn ? 1 : 0,
              transition: 'opacity 200ms ease 120ms',
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 40px)',
            }}
          >
            <p
              className="text-center text-[11px] pb-3"
              style={{ color: 'rgba(17,17,17,0.20)' }}
            >
              Per salvarlo ti chiediamo solo un&apos;email.
            </p>
            <button
              type="submit"
              className="w-full rounded-2xl py-4 text-[16px] font-medium tracking-[-0.01em] transition-transform active:scale-[0.97]"
              style={{ background: '#6B5FE8', color: '#ffffff' }}
            >
              Salva questo momento
            </button>
          </div>

        </form>
      </div>
    )
  }

  // ── ONBOARDING SCREEN ─────────────────────────────────────────────────
  return (
    <div
      className="h-[100dvh] flex flex-col overflow-hidden"
      style={{ background: '#F7F7F5' }}
    >

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 pb-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 20px)' }}
      >
        {canGoBack ? (
          <button
            onClick={handleBack}
            className="w-9 h-9 -ml-2 flex items-center justify-center transition-opacity active:opacity-50"
            aria-label="Indietro"
            style={{ color: 'rgba(17,17,17,0.30)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <div className="w-9" />
        )}

        <OnboardingProgress total={SCREENS.length} current={step} />

        {step < SCREENS.length - 1 ? (
          <button
            onClick={handleSkip}
            className="text-[12px] px-1 transition-opacity active:opacity-50"
            style={{ color: 'rgba(17,17,17,0.22)' }}
          >
            Salta
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* ── Screen content ────────────────────────────────────────── */}
      <div
        key={screenKey}
        className="flex-1 flex flex-col items-center justify-center px-8 animate-ob-screen"
      >
        {screen.visual !== 'none' && (
          <div className="mb-12 flex justify-center w-full">
            <OnboardingVisual type={screen.visual} />
          </div>
        )}

        {/* Heading block — fades out on last screen when CTA is clicked */}
        <div
          className="text-center space-y-3 max-w-[300px]"
          style={{
            opacity: headingFading ? 0 : 1,
            transition: headingFading ? 'opacity 150ms ease' : undefined,
          }}
        >
          <h1
            className="text-[32px] font-semibold leading-tight tracking-[-0.02em] whitespace-pre-line"
            style={{ color: '#111111' }}
          >
            {screen.title}
          </h1>
          {screen.subtitle ? (
            <p
              className="text-[17px] leading-snug font-medium"
              style={{ color: '#555555' }}
            >
              {screen.subtitle}
            </p>
          ) : null}
          {screen.body ? (
            <p
              className="text-[15px] leading-snug"
              style={{ color: '#ABABAB' }}
            >
              {screen.body}
            </p>
          ) : null}
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <div
        className="px-6 pt-4"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 40px)' }}
      >
        <button
          onClick={handleNext}
          className="w-full rounded-2xl py-4 text-[16px] font-medium tracking-[-0.01em] transition-transform active:scale-[0.97]"
          style={ctaStyle}
        >
          {screen.ctaLabel ?? 'Continua'}
        </button>
      </div>

    </div>
  )
}
