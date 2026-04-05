'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

import type { MemoryDraft } from '@/lib/onboarding/draft'
import { DRAFT_KEY } from '@/lib/onboarding/draft'

const PLACEHOLDERS = [
  'Estate insieme al mare',
  'Quel giorno sulla neve',
  'Natale tutti insieme',
  'Prima volta sui pattini',
  'Cena da Marco, finalmente',
]

export default function OnboardingCreatePage() {
  const router = useRouter()
  const titleRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split('T')[0]
  const todayLabel = new Date().toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [error, setError]               = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Cycling placeholder ───────────────────────────────────────────────
  const [placeholderIndex, setPlaceholderIndex]   = useState(0)
  const [placeholderVisible, setPlaceholderVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderVisible(false)
      setTimeout(() => {
        setPlaceholderIndex(i => (i + 1) % PLACEHOLDERS.length)
        setPlaceholderVisible(true)
      }, 220)
    }, 2800)
    return () => clearInterval(id)
  }, [])

  // ── Submit: card animates for 200ms then navigate ─────────────────────
  useEffect(() => {
    if (!isSubmitting) return
    const t = setTimeout(() => {
      const draft: MemoryDraft = {
        title: title.trim(),
        description: description.trim(),
        start_date: today,
      }
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch { /* noop */ }
      router.push('/auth/login?next=' + encodeURIComponent('/onboarding/restore'))
    }, 200)
    return () => clearTimeout(t)
  }, [isSubmitting, title, description, today, router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Dagli un nome per continuare.')
      titleRef.current?.focus()
      return
    }
    setIsSubmitting(true)
  }

  const previewTitle     = title.trim()
  const hasTitle         = previewTitle.length > 0
  const inputBorderColor = inputFocused
    ? '#6B5FE8'
    : hasTitle ? 'rgba(17,17,17,0.20)' : 'rgba(17,17,17,0.10)'

  return (
    <main
      className="h-[100dvh] flex flex-col overflow-hidden"
      style={{ background: '#F7F7F5' }}
    >

      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div
        className="flex items-center px-5 pb-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 20px)' }}
      >
        <button
          type="button"
          onClick={() => router.back()}
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
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col px-6 pt-2 overflow-y-auto"
      >

        {/* ── Preview card ─────────────────────────────────────────── */}
        {/* Tilt wrapper */}
        <div style={{ transform: 'rotate(-0.8deg)', marginBottom: '2rem' }}>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              boxShadow: '0 4px 28px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.05)',
              background: 'white',
              animation: isSubmitting ? 'ob-card-submit 200ms ease-in-out' : undefined,
            }}
          >
            {/* Photo area — soft warm gradient */}
            <div
              className="h-28 relative"
              style={{ background: 'linear-gradient(135deg, #E8E6E1, #DCD8CF)' }}
            >
              <div
                className="absolute inset-x-0 bottom-0 h-10"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.08), transparent)' }}
              />
              {/* Date chip — light style for light background */}
              <div
                className="absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[8px] font-medium"
                style={{
                  background: 'rgba(255,255,255,0.70)',
                  backdropFilter: 'blur(6px)',
                  color: 'rgba(17,17,17,0.55)',
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
                  className="text-[14px] font-semibold leading-tight animate-ob-title-in"
                  style={{ color: '#111111' }}
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

        {/* ── Heading ────────────────────────────────────────────────── */}
        <div className="mb-7">
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

        {/* ── Title input ─────────────────────────────────────────────── */}
        <div className="mb-7">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError('') }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={placeholderVisible ? PLACEHOLDERS[placeholderIndex] : ''}
            autoFocus
            className="w-full bg-transparent text-[21px] font-semibold focus:outline-none border-b pb-3 leading-snug tracking-tight"
            style={{
              color: '#111111',
              borderColor: inputBorderColor,
              caretColor: '#6B5FE8',
              transition: 'border-color 180ms ease',
            }}
          />
          {error && (
            <p className="mt-2.5 text-[12px]" style={{ color: '#E05252' }}>{error}</p>
          )}
        </div>

        {/* ── Optional note ─────────────────────────────────────────── */}
        <div>
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
        <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 40px)' }}>
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
    </main>
  )
}
