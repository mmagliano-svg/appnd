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
  visual: VisualType
  ctaLabel?: string
  // purple accent CTA override
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
    subtitle: 'Anche quelli che sembravano importanti',
    visual: 'none',
  },
  {
    key: 'shift',
    title: 'E se non finissero davvero?',
    subtitle: 'Se potessero continuare a vivere',
    visual: 'none',
  },
  {
    key: 'definition',
    title: 'Questo è un momento',
    subtitle: 'Foto, persone e dettagli nello stesso posto',
    visual: 'card',
  },
  {
    key: 'perspective',
    title: 'Non solo il tuo punto di vista',
    subtitle: 'Chi era con te può aggiungere il suo',
    visual: 'perspective',
  },
  {
    key: 'continuity',
    title: 'E non finisce lì',
    subtitle: 'Puoi tornarci e aggiungere ciò che conta',
    visual: 'timeline',
  },
  {
    key: 'legacy',
    title: 'Tra anni, sarà ancora lì',
    subtitle: 'E racconterà qualcosa in più',
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

const SAVE_SCREEN: ScreenData = {
  key: 'save',
  title: 'Non perderlo',
  subtitle: "Salvalo. È solo l'inizio",
  visual: 'none',
  ctaLabel: 'Continua',
}

// ── Component ─────────────────────────────────────────────────────────────

export function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isSaveStep, setIsSaveStep] = useState(false)
  const [screenKey, setScreenKey] = useState(0)

  const screen = isSaveStep ? SAVE_SCREEN : SCREENS[step]
  const isLastEducational = step === SCREENS.length - 1
  const showProgress = !isSaveStep

  const advance = useCallback((fn: () => void) => {
    fn()
    setScreenKey(k => k + 1)
  }, [])

  const handleNext = useCallback(() => {
    if (isSaveStep) {
      router.push('/auth/login?next=' + encodeURIComponent('/memories/new?from=onboarding'))
      return
    }
    if (isLastEducational) {
      advance(() => setIsSaveStep(true))
      return
    }
    advance(() => setStep(s => s + 1))
  }, [isSaveStep, isLastEducational, advance, router])

  const handleBack = useCallback(() => {
    if (isSaveStep) {
      advance(() => {
        setIsSaveStep(false)
        setStep(SCREENS.length - 1)
      })
      return
    }
    if (step > 0) {
      advance(() => setStep(s => s - 1))
    }
  }, [isSaveStep, step, advance])

  const handleSkip = useCallback(() => {
    router.push('/auth/login')
  }, [router])

  const canGoBack = step > 0 || isSaveStep

  // CTA styles
  const ctaStyle = screen.accentCta
    ? { background: '#6B5FE8', color: '#ffffff' }
    : isSaveStep
    ? { background: '#111111', color: '#ffffff' }
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

        {/* Skip — only on screens 0–6 */}
        {!isSaveStep && step < SCREENS.length - 1 ? (
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
          <div className="mb-12 flex justify-center">
            <OnboardingVisual type={screen.visual} />
          </div>
        )}

        {/* Save step: lock icon */}
        {isSaveStep && (
          <div className="mb-12 flex justify-center">
            <div
              className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center"
              style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: 'rgba(17,17,17,0.25)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        )}

        {/* Text */}
        <div className="text-center space-y-4 max-w-[300px]">
          <h1
            className="text-[32px] font-semibold leading-tight tracking-[-0.02em] whitespace-pre-line"
            style={{ color: '#111111' }}
          >
            {screen.title}
          </h1>
          {screen.subtitle ? (
            <p
              className="text-[17px] leading-snug"
              style={{ color: '#909090' }}
            >
              {screen.subtitle}
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
