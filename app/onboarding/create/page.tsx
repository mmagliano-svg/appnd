'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

import type { MemoryDraft } from '@/lib/onboarding/draft'
import { DRAFT_KEY } from '@/lib/onboarding/draft'

const PLACEHOLDERS = [
  'Estate insieme al mare',
  'Quel giorno sulla neve',
  'Natale tutti insieme',
  'Federico nella vasca',
  'Prima volta sui pattini',
  'Cena da Marco, finalmente',
]

export default function OnboardingCreatePage() {
  const router = useRouter()
  const titleRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split('T')[0]
  const todayLabel = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  // ── Cycling placeholder ───────────────────────────────────────────────────
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Dagli un nome per continuare.')
      titleRef.current?.focus()
      return
    }
    const draft: MemoryDraft = { title: trimmed, description: description.trim(), start_date: today }
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch { /* noop */ }
    router.push('/auth/login?next=' + encodeURIComponent('/onboarding/restore'))
  }

  // Preview title: user's typed value or empty
  const previewTitle = title.trim()

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

        {/* ── Live preview card ────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden mb-8"
          style={{
            boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
            background: 'white',
            transition: 'box-shadow 200ms',
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
            {/* Avatars */}
            <div className="absolute bottom-2.5 left-3 flex">
              {['M'].map((init, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border-[1.5px] border-white/60 flex items-center justify-center text-white text-[7px] font-bold"
                  style={{ background: 'rgba(60,40,20,0.70)' }}
                >
                  {init}
                </div>
              ))}
            </div>
            {/* Date chip */}
            <div
              className="absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[8px] font-medium text-white/90"
              style={{ background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(6px)' }}
            >
              {todayLabel}
            </div>
          </div>

          {/* Card text */}
          <div className="px-3.5 py-3">
            {previewTitle ? (
              <p
                className="text-[14px] font-semibold leading-tight transition-all duration-150"
                style={{ color: '#111111' }}
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

        {/* ── Main naming field ─────────────────────────────────────── */}
        <div className="mb-7">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError('') }}
            placeholder={placeholderVisible ? PLACEHOLDERS[placeholderIndex] : ''}
            autoFocus
            className="w-full bg-transparent text-[21px] font-semibold focus:outline-none border-b pb-3 leading-snug tracking-tight"
            style={{
              color: '#111111',
              borderColor: title ? 'rgba(17,17,17,0.20)' : 'rgba(17,17,17,0.10)',
              caretColor: '#6B5FE8',
              transition: 'border-color 200ms',
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

        {/* Privacy note */}
        <p
          className="text-center text-[11px] pb-3"
          style={{ color: 'rgba(17,17,17,0.20)' }}
        >
          Per salvarlo ti chiediamo solo un&apos;email.
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
