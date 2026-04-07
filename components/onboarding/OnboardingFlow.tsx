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
  screenType?: 'standard' | 'choice'  // 'choice' renders two-card picker instead of standard
  heroImage?: string                   // passed into create card so same image "becomes" the card
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
    title: 'Quel momento\nesiste già',
    subtitle: 'Adesso puoi iniziare',
    visual: 'create',
    heroImage: '/onboarding/photo-christmas.jpg',
    ctaLabel: 'Continua',
  },
  {
    key: 'choice',
    title: 'Da dove vuoi partire?',
    subtitle: '',
    visual: 'none',
    screenType: 'choice',
    heroImage: '/onboarding/photo-christmas.jpg', // carried into create card
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
type CreatePhase = 'card' | 'input' | 'breathing'

// ── Component ─────────────────────────────────────────────────────────────

export function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [screenKey, setScreenKey] = useState(0)

  // ── Layout switch ──────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false)
  const [headingFading, setHeadingFading] = useState(false)
  const [createPhase, setCreatePhase] = useState<CreatePhase>('card')

  // ── Hero image carried from last onboarding screen into create card ───
  const [lastOnboardingImage, setLastOnboardingImage] = useState<string | null>(null)

  // ── Create-form state ──────────────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [createError, setCreateError] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [placeholderVisible, setPlaceholderVisible] = useState(true)
  const titleRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split('T')[0]
  const todayLabel = new Date().toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // ── Cycling placeholder ────────────────────────────────────────────────
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

  // ── Auto-focus on input phase ──────────────────────────────────────────
  useEffect(() => {
    if (createPhase === 'input') {
      const t = setTimeout(() => titleRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [createPhase])

  // ── Submit: animate card then navigate ────────────────────────────────
  useEffect(() => {
    if (!isSubmitting) return
    const t = setTimeout(() => {
      const trimmed = title.trim()
      const draft = { title: trimmed, description: description.trim(), start_date: today }
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch { /* noop */ }
      router.push('/auth/login?next=' + encodeURIComponent('/onboarding/restore'))
    }, 200)
    return () => clearTimeout(t)
  }, [isSubmitting, title, description, today, router])

  // ── Transition sequence ────────────────────────────────────────────────
  function startCreateTransition() {
    // Carry the hero image from the current screen (screen 7) into the card
    setLastOnboardingImage(screen.heroImage ?? null)
    setHeadingFading(true)
    setTimeout(() => {
      setShowCreate(true)
      setCreatePhase('card')
      setTimeout(() => setCreatePhase('input'), 250)
      setTimeout(() => setCreatePhase('breathing'), 450)
    }, 150)
  }

  // ── Navigate with View Transition (fade-out → new page) ──────────────
  function navigateTo(path: string) {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void })
        .startViewTransition(() => router.push(path))
    } else {
      router.push(path)
    }
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
    setIsSubmitting(true)
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
      setShowCreate(false)
      setHeadingFading(false)
      setCreatePhase('card')
      setTitle('')
      setDescription('')
      setCreateError('')
      setIsSubmitting(false)
      setLastOnboardingImage(null)
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

  // ── Animation flags ───────────────────────────────────────────────────
  const cardIn    = createPhase === 'card' || createPhase === 'input' || createPhase === 'breathing'
  const inputIn   = createPhase === 'input' || createPhase === 'breathing'
  const doBreathe = createPhase === 'breathing' && !isSubmitting

  // ── CTA + input styles ────────────────────────────────────────────────
  const ctaStyle  = screen.accentCta
    ? { background: '#6B5FE8', color: '#ffffff' }
    : { background: '#E8E8E5', color: '#111111' }

  const previewTitle = title.trim()
  const hasTitle     = previewTitle.length > 0

  // Input border: purple when focused, standard otherwise
  const inputBorderColor = inputFocused
    ? '#6B5FE8'
    : hasTitle ? 'rgba(17,17,17,0.20)' : 'rgba(17,17,17,0.10)'

  // ── CREATE LAYOUT ─────────────────────────────────────────────────────
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

          {/* ── Preview card — spring-in wrapper ──────────────────── */}
          <div
            style={{
              opacity: cardIn ? 1 : 0,
              transform: cardIn ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(40px)',
              transition: 'opacity 250ms ease, transform 250ms cubic-bezier(0.22, 1, 0.36, 1)',
              animation: doBreathe ? 'ob-card-breathe 300ms ease-in-out' : undefined,
              marginBottom: '2rem',
            }}
          >
            {/* Tilt wrapper */}
            <div style={{ transform: 'rotate(-0.8deg)' }}>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  boxShadow: '0 4px 28px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.05)',
                  background: 'white',
                  animation: isSubmitting ? 'ob-card-submit 200ms ease-in-out' : undefined,
                }}
              >
                {/* Photo area — real image if carried from onboarding, else warm gradient */}
                <div
                  className="h-28 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #E8E6E1, #DCD8CF)' }}
                >
                  {lastOnboardingImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lastOnboardingImage}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ objectPosition: 'center 25%' }}
                    />
                  )}
                  {/* Subtle overlay — keeps date chip readable */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.12))' }}
                  />
                  {/* Date chip */}
                  <div
                    className="absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[8px] font-medium"
                    style={{
                      background: 'rgba(0,0,0,0.28)',
                      backdropFilter: 'blur(6px)',
                      color: 'rgba(255,255,255,0.90)',
                    }}
                  >
                    {todayLabel}
                  </div>
                </div>

                {/* Live title preview */}
                <div className="px-3.5 py-3 min-h-[52px]">
                  {previewTitle ? (
                    <p
                      key="title-set"
                      className="text-[14px] font-bold leading-tight animate-ob-title-in"
                      style={{ color: '#000000' }}
                    >
                      {previewTitle}
                    </p>
                  ) : (
                    <p
                      key="title-empty"
                      className="text-[14px] font-medium leading-tight"
                      style={{ color: 'rgba(17,17,17,0.22)' }}
                    >
                      Il nome del tuo momento…
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Heading ──────────────────────────────────────────────── */}
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

          {/* ── Title input ───────────────────────────────────────────── */}
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
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={placeholderVisible ? PLACEHOLDERS[placeholderIndex] : ''}
              className="w-full bg-transparent text-[21px] font-semibold focus:outline-none border-b pb-3 leading-snug tracking-tight"
              style={{
                color: '#111111',
                borderColor: inputBorderColor,
                caretColor: '#6B5FE8',
                transition: 'border-color 180ms ease',
              }}
            />
            {createError && (
              <p className="mt-2.5 text-[12px]" style={{ color: '#E05252' }}>{createError}</p>
            )}
          </div>

          {/* ── Optional description ──────────────────────────────────── */}
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
              C&apos;era qualcosa che non vuoi dimenticare?
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

          {/* ── Privacy note + CTA ────────────────────────────────────── */}
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
              disabled={!hasTitle || isSubmitting}
              className="w-full rounded-2xl py-4 text-[16px] font-medium tracking-[-0.01em] active:scale-[0.97]"
              style={{
                background: '#6B5FE8',
                color: '#ffffff',
                opacity: hasTitle ? 1 : 0.4,
                transition: 'opacity 150ms ease, transform 100ms ease',
                pointerEvents: hasTitle ? 'auto' : 'none',
              }}
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

      {/* Top bar */}
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

      {/* Screen content */}
      <div
        key={screenKey}
        className={`flex-1 flex flex-col items-center px-6 animate-ob-screen ${
          screen.visual === 'create' ? 'justify-start pt-8 px-8'
          : screen.screenType === 'choice' ? 'justify-center'
          : 'justify-center px-8'
        }`}
      >
        {/* ── Choice screen ─────────────────────────────────────────── */}
        {screen.screenType === 'choice' ? (
          <div className="w-full max-w-sm">
            <h1
              className="text-[28px] font-semibold leading-tight tracking-[-0.02em] mb-8 text-center"
              style={{ color: '#111111' }}
            >
              {screen.title}
            </h1>

            <div className="space-y-4">
              {/* Option: photo */}
              <button
                onClick={() => navigateTo('/create/photo')}
                className="w-full text-left rounded-2xl px-5 py-4 transition-transform active:scale-[0.97]"
                style={{
                  background: 'white',
                  border: '1px solid rgba(17,17,17,0.08)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[18px]"
                    style={{ background: 'rgba(17,17,17,0.05)' }}
                  >
                    🖼️
                  </div>
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold leading-none" style={{ color: '#111111' }}>
                      Aggiungi una foto
                    </p>
                    <p className="text-[13px] mt-1 leading-snug" style={{ color: 'rgba(17,17,17,0.40)' }}>
                      Da qualcosa che hai già
                    </p>
                  </div>
                  <svg className="w-4 h-4 shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(17,17,17,0.20)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Option: text */}
              <button
                onClick={() => navigateTo('/create/text')}
                className="w-full text-left rounded-2xl px-5 py-4 transition-transform active:scale-[0.97]"
                style={{
                  background: 'white',
                  border: '1px solid rgba(17,17,17,0.08)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[18px]"
                    style={{ background: 'rgba(17,17,17,0.05)' }}
                  >
                    ✏️
                  </div>
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold leading-none" style={{ color: '#111111' }}>
                      Scrivi un momento
                    </p>
                    <p className="text-[13px] mt-1 leading-snug" style={{ color: 'rgba(17,17,17,0.40)' }}>
                      Parti da quello che ricordi
                    </p>
                  </div>
                  <svg className="w-4 h-4 shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(17,17,17,0.20)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

        ) : (
          /* ── Standard screen ──────────────────────────────────────── */
          <>
            {screen.visual !== 'none' && (
              <div className="mb-12 flex justify-center w-full">
                <OnboardingVisual type={screen.visual} />
              </div>
            )}

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
                <p className="text-[17px] leading-snug font-medium" style={{ color: '#555555' }}>
                  {screen.subtitle}
                </p>
              ) : null}
              {screen.body ? (
                <p className="text-[15px] leading-snug" style={{ color: '#ABABAB' }}>
                  {screen.body}
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>

      {/* CTA — hidden for choice screen (cards are the CTAs) */}
      {screen.screenType !== 'choice' && (
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
      )}

    </div>
  )
}
