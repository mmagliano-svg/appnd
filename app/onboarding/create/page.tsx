'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export interface MemoryDraft {
  title: string
  description: string
  start_date: string
}

export const DRAFT_KEY = 'appnd_ob_draft'

// Placeholder examples that cycle to show possibility
const PLACEHOLDERS = [
  'Compleanno di Margherita',
  'Quella giornata al lago',
  'Prima volta a Parigi',
  'Cena da Marco, finalmente',
  'Il concerto di sabato',
  'Natale in montagna',
]

export default function OnboardingCreatePage() {
  const router = useRouter()
  const titleRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split('T')[0]
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  // ── Cycling placeholder ───────────────────────────────────────────────────
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [placeholderVisible, setPlaceholderVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderVisible(false)
      setTimeout(() => {
        setPlaceholderIndex(i => (i + 1) % PLACEHOLDERS.length)
        setPlaceholderVisible(true)
      }, 250)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Dagli un nome per continuare.')
      titleRef.current?.focus()
      return
    }

    const draft: MemoryDraft = {
      title: trimmed,
      description: description.trim(),
      start_date: today,
    }

    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch { /* noop */ }
    router.push('/auth/login?next=' + encodeURIComponent('/onboarding/restore'))
  }

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
        className="flex-1 flex flex-col px-7 pt-6 overflow-y-auto"
      >

        {/* Heading */}
        <div className="mb-10">
          <h1
            className="text-[30px] font-semibold leading-tight tracking-[-0.02em] mb-2"
            style={{ color: '#111111' }}
          >
            Come lo chiameresti?
          </h1>
          <p className="text-[15px]" style={{ color: '#ABABAB' }}>
            Il nome che gli daresti se lo raccontassi a qualcuno.
          </p>
        </div>

        {/* ── Main naming field ── */}
        <div className="mb-8">
          <div className="relative">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError('') }}
              placeholder={placeholderVisible ? PLACEHOLDERS[placeholderIndex] : ''}
              autoFocus
              className="w-full bg-transparent text-[22px] font-semibold focus:outline-none border-b pb-3 leading-snug tracking-tight transition-all"
              style={{
                color: '#111111',
                borderColor: title ? 'rgba(17,17,17,0.20)' : 'rgba(17,17,17,0.10)',
                caretColor: '#6B5FE8',
              }}
            />
          </div>
          {error && (
            <p className="mt-2.5 text-[13px]" style={{ color: '#E05252' }}>{error}</p>
          )}
        </div>

        {/* ── Optional note ── */}
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(17,17,17,0.28)' }}
          >
            Qualcosa che vuoi ricordare
            <span className="ml-1 normal-case font-normal" style={{ color: 'rgba(17,17,17,0.18)' }}>
              — facoltativo
            </span>
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Com'era? Chi c'era? Come ti sentivi?"
            rows={4}
            className="w-full rounded-2xl px-4 py-3 text-[15px] focus:outline-none resize-none leading-relaxed"
            style={{
              background: 'rgba(17,17,17,0.04)',
              border: '1px solid rgba(17,17,17,0.07)',
              color: '#111111',
              caretColor: '#6B5FE8',
            }}
          />
        </div>

        <div className="flex-1 min-h-6" />

        {/* Privacy note */}
        <p
          className="text-center text-[11px] pb-3"
          style={{ color: 'rgba(17,17,17,0.20)' }}
        >
          Per salvarlo ti chiediamo solo un'email.
        </p>

        {/* CTA */}
        <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 40px)' }}>
          <button
            type="submit"
            className="w-full rounded-2xl py-4 text-[16px] font-medium tracking-[-0.01em] transition-transform active:scale-[0.97]"
            style={{ background: '#6B5FE8', color: '#ffffff' }}
          >
            Salva questo momento
          </button>
        </div>

      </form>
    </main>
  )
}
