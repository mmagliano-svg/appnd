'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingProgress } from './OnboardingProgress'
import { OnboardingVisual, type VisualType } from './OnboardingVisuals'

// ── Screen config ─────────────────────────────────────────────────────────

interface ScreenData {
  key: string
  title: string
  subtitle: string
  body?: string        // second line — softer, explanatory
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
    subtitle: 'Ma i dettagli no',
    body: 'Foto, persone, emozioni. Tutto insieme.',
    visual: 'none',
  },
  {
    key: 'definition',
    title: 'Questo è un momento',
    subtitle: 'Non solo una foto',
    body: 'È dove succede tutto.',
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
    title: 'E non finisce lì',
    subtitle: 'Puoi tornarci quando vuoi',
    body: 'Aggiungere, completare, ricordare meglio',
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

// ── Component ─────────────────────────────────────────────────────────────

export function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  // screenKey changes on each step change — triggers CSS re-animation
  const [screenKey, setScreenKey] = useState(0)

  const screen = SCREENS[step]
  const isLastScreen = step === SCREENS.length - 1
  const showProgress = true

  const advance = useCallback((fn: () => void) => {
    fn()
    setScreenKey(k => k + 1)
  }, [])

  const handleNext = useCallback(() => {
    if (isLastScreen) {
      // Go directly to memory creation — no auth required yet
      router.push('/onboarding/create')
      return
    }
    advance(() => setStep(s => s + 1))
  }, [isLastScreen, advance, router])

  const handleBack = useCallback(() => {
    if (step > 0) {
      advance(() => setStep(s => s - 1))
    }
  }, [step, advance])

  const handleSkip = useCallback(() => {
    router.push('/auth/login')
  }, [router])

  const canGoBack = step > 0

  // CTA styles
  const ctaStyle = screen.accentCta
    ? { background: '#6B5FE8', color: '#ffffff' }
    : { background: 'rgba(17,17,17,0.06)', color: '#111111' }

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
        {/* Back */}
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

        {/* Progress bar */}
        {showProgress && (
          <OnboardingProgress total={SCREENS.length} current={step} />
        )}

        {/* Skip — only on screens 0–5 */}
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
        {/* Visual area */}
        {screen.visual !== 'none' && (
          <div className="mb-12 flex justify-center w-full">
            <OnboardingVisual type={screen.visual} />
          </div>
        )}

        {/* Text */}
        <div className="text-center space-y-3 max-w-[300px]">
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
          className="w-full rounded-2xl py-4 text-[16px] font-medium tracking-[-0.01em] transition-transform active:scale-[0.985]"
          style={ctaStyle}
        >
          {screen.ctaLabel ?? 'Continua'}
        </button>
      </div>

    </div>
  )
}
