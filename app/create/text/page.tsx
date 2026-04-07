'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DRAFT_KEY } from '@/lib/onboarding/draft'
import type { MemoryDraft, DraftPerson } from '@/lib/onboarding/draft'
import { saveDraft } from '@/actions/drafts'

export default function CreateTextPage() {
  const router    = useRouter()
  const titleRef  = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split('T')[0]

  // ── State ──────────────────────────────────────────────────────────────────
  const [title,           setTitle]           = useState('')
  const [description,     setDescription]     = useState('')
  const [people,          setPeople]          = useState<DraftPerson[]>([])
  const [inputFocused,    setInputFocused]    = useState(false)
  const [textareaFocused, setTextareaFocused] = useState(false)
  const [isSubmitting,    setIsSubmitting]    = useState(false)

  // Auto-focus on mount
  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return
    setIsSubmitting(true)

    // Small delay so the button shows "Un momento…" before the async work starts
    await new Promise(r => setTimeout(r, 100))

    const filteredPeople = people.filter(p => p.value.trim()).map(p => ({ value: p.value.trim() }))

    // ── 1. Persist draft server-side (primary — survives cross-browser magic link) ──
    let draftToken: string | undefined
    try {
      const result = await saveDraft({
        title:       title.trim(),
        description: description.trim(),
        start_date:  today,
        people:      filteredPeople,
      })
      draftToken = result.token
    } catch (err) {
      // Server draft failed — fall through to localStorage-only path
      console.error('[create/text] saveDraft failed:', err)
    }

    // ── 2. Also write to localStorage as secondary fallback (same-browser) ──
    const draft: MemoryDraft = {
      title:       title.trim(),
      description: description.trim(),
      start_date:  today,
      people:      filteredPeople,
    }
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch { /* noop */ }

    // ── 3. Navigate to auth — flat params, no nested query strings ──────────
    const authParams = new URLSearchParams({
      next:  '/onboarding/restore',
      title: title.trim(),
    })
    if (draftToken) authParams.set('draft', draftToken)

    router.push('/auth/login?' + authParams.toString())
  }

  // ── People helpers ─────────────────────────────────────────────────────────
  function addPerson() {
    if (people.length >= 5) return
    setPeople([...people, { value: '' }])
  }
  function updatePerson(i: number, value: string) {
    setPeople(people.map((p, idx) => idx === i ? { value } : p))
  }
  function removePerson(i: number) {
    setPeople(people.filter((_, idx) => idx !== i))
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const hasTitle         = title.trim().length > 0
  const inputBorderColor = inputFocused
    ? '#6B5FE8'
    : hasTitle
    ? 'rgba(17,17,17,0.20)'
    : 'rgba(17,17,17,0.10)'

  return (
    <main
      className="h-[100dvh] flex flex-col overflow-hidden"
      style={{ background: '#F7F7F5' }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────── */}
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

      {/* ── Form ────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col px-6 pt-4 overflow-y-auto"
      >
        {/* Heading */}
        <div className="mb-10">
          <p className="text-[13px] mb-3" style={{ color: 'rgba(17,17,17,0.35)' }}>
            Ogni momento inizia da una frase
          </p>
          <h1
            className="text-[28px] font-semibold leading-tight tracking-[-0.02em] mb-2"
            style={{ color: '#111111' }}
          >
            Come lo chiami?
          </h1>
          <p className="text-[15px]" style={{ color: '#ABABAB' }}>
            Il nome che gli daresti se lo raccontassi a qualcuno.
          </p>
        </div>

        {/* Title input */}
        <div className="mb-8">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Natale tutti insieme"
            className="w-full bg-transparent text-[24px] focus:outline-none border-b pb-3 leading-snug tracking-tight"
            style={{
              color:      hasTitle ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0.45)',
              fontWeight: hasTitle ? 600 : 400,
              borderColor: inputBorderColor,
              caretColor:  '#6B5FE8',
              transition:  'border-color 180ms ease, color 120ms ease, font-weight 120ms ease',
            }}
          />
        </div>

        {/* Optional description */}
        <div className="mb-6">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
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
            onFocus={() => setTextareaFocused(true)}
            onBlur={() => setTextareaFocused(false)}
            placeholder="Com'era? Chi c'era? Come ti sentivi?"
            rows={4}
            className="w-full rounded-2xl px-4 py-3 text-[15px] focus:outline-none resize-none leading-relaxed"
            style={{
              background:  'rgba(17,17,17,0.04)',
              border:      `1px solid ${textareaFocused ? 'rgba(107,95,232,1)' : 'rgba(17,17,17,0.07)'}`,
              color:       '#111111',
              caretColor:  '#6B5FE8',
              transition:  'border-color 150ms ease',
            }}
          />
        </div>

        {/* ── People section ──────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(17,17,17,0.28)' }}
            >
              Chi era con te?
            </p>
            <span className="text-[10px]" style={{ color: 'rgba(17,17,17,0.18)' }}>
              — facoltativo
            </span>
          </div>

          {/* Person rows */}
          {people.length > 0 && (
            <div className="space-y-2 mb-2">
              {people.map((person, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={person.value}
                    onChange={(e) => updatePerson(i, e.target.value)}
                    placeholder="Nome o email"
                    autoFocus={i === people.length - 1}
                    className="flex-1 rounded-xl px-3.5 py-2.5 text-[14px] focus:outline-none"
                    style={{
                      background: 'rgba(17,17,17,0.04)',
                      border:     '1px solid rgba(17,17,17,0.07)',
                      color:      '#111111',
                      caretColor: '#6B5FE8',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removePerson(i)}
                    className="w-8 h-8 flex items-center justify-center rounded-full shrink-0 active:scale-90 transition-transform"
                    aria-label="Rimuovi"
                    style={{ color: 'rgba(17,17,17,0.28)' }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add person button */}
          {people.length < 5 && (
            <button
              type="button"
              onClick={addPerson}
              className="flex items-center gap-1.5 text-[13px] active:opacity-50 transition-opacity"
              style={{ color: '#6B5FE8' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Aggiungi una persona
            </button>
          )}
        </div>

        <div className="flex-1 min-h-4" />

        {/* CTA */}
        <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 40px)' }}>
          <button
            type="submit"
            disabled={!hasTitle || isSubmitting}
            className="w-full rounded-2xl py-4 text-[16px] font-medium tracking-[-0.01em] active:scale-[0.97]"
            style={{
              background:    '#6B5FE8',
              color:         '#ffffff',
              opacity:       hasTitle ? 1 : 0.4,
              transition:    'all 150ms ease',
              pointerEvents: hasTitle ? 'auto' : 'none',
            }}
          >
            {isSubmitting ? 'Un momento…' : 'Fatto'}
          </button>
        </div>
      </form>
    </main>
  )
}
