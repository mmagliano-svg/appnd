'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ── Draft stored in localStorage before auth ──────────────────────────────
export interface MemoryDraft {
  title: string
  description: string
  start_date: string
}

export const DRAFT_KEY = 'appnd_ob_draft'

// ── Pre-auth memory creation form ─────────────────────────────────────────
// User fills in title + date + description WITHOUT needing an account.
// On submit: draft is saved to localStorage, user is redirected to auth.
// After auth, /onboarding/restore reads the draft and creates the memory.

export default function OnboardingCreatePage() {
  const router = useRouter()
  const titleRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split('T')[0]
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today)
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Dai un nome al momento per continuare.')
      titleRef.current?.focus()
      return
    }

    const draft: MemoryDraft = {
      title: trimmedTitle,
      description: description.trim(),
      start_date: date || today,
    }

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // localStorage unavailable — /onboarding/restore handles missing draft gracefully
    }

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

      {/* ── Form ──────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col px-6 pt-4 pb-0 overflow-y-auto"
      >

        {/* Heading */}
        <div className="mb-8">
          <h1
            className="text-[28px] font-semibold leading-tight tracking-[-0.02em] mb-1.5"
            style={{ color: '#111111' }}
          >
            Qual è questo momento?
          </h1>
          <p className="text-[15px]" style={{ color: '#ABABAB' }}>
            Anche due parole bastano per iniziare.
          </p>
        </div>

        {/* Fields */}
        <div className="space-y-7">

          {/* Title */}
          <div>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError('') }}
              placeholder="Dagli un nome…"
              autoFocus
              className="w-full bg-transparent text-[22px] font-semibold placeholder:font-normal focus:outline-none border-b pb-3 leading-snug tracking-tight"
              style={{
                color: '#111111',
                borderColor: 'rgba(17,17,17,0.12)',
                caretColor: '#6B5FE8',
              }}
            />
            {error && (
              <p className="mt-2 text-[13px]" style={{ color: '#E05252' }}>{error}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'rgba(17,17,17,0.35)' }}
            >
              Quando è successo?
            </p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={today}
              className="w-full bg-transparent text-base focus:outline-none border-b pb-2.5 min-h-[44px]"
              style={{
                color: '#111111',
                borderColor: 'rgba(17,17,17,0.12)',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'rgba(17,17,17,0.35)' }}
            >
              Qualcosa che vuoi ricordare
              <span className="ml-1 normal-case font-normal" style={{ color: 'rgba(17,17,17,0.22)' }}>
                — facoltativo
              </span>
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Com'era? Chi c'era? Come ti sentivi?"
              rows={4}
              className="w-full rounded-2xl px-4 py-3 text-base focus:outline-none resize-none leading-relaxed"
              style={{
                background: 'rgba(17,17,17,0.04)',
                border: '1px solid rgba(17,17,17,0.08)',
                color: '#111111',
                caretColor: '#6B5FE8',
              }}
            />
          </div>

        </div>

        {/* Flex spacer pushes CTA note up naturally with form */}
        <div className="flex-1 min-h-6" />

        {/* Privacy note above CTA */}
        <p
          className="text-center text-[12px] pb-3"
          style={{ color: 'rgba(17,17,17,0.22)' }}
        >
          Per salvarlo hai bisogno di un account gratuito.
        </p>

        {/* CTA inside the form so Enter submits */}
        <div
          className="px-0 pt-0"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 40px)' }}
        >
          <button
            type="submit"
            className="w-full rounded-2xl py-4 text-[16px] font-medium tracking-[-0.01em] transition-transform active:scale-[0.985]"
            style={{ background: '#6B5FE8', color: '#ffffff' }}
          >
            Salva questo momento
          </button>
        </div>

      </form>
    </main>
  )
}
