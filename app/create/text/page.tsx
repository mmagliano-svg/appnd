'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DRAFT_KEY } from '@/lib/onboarding/draft'

export default function CreateTextPage() {
  const router = useRouter()
  const titleRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split('T')[0]

  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-focus on mount
  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [])

  // Navigate after submit animation
  useEffect(() => {
    if (!isSubmitting) return
    const t = setTimeout(() => {
      const draft = { title: title.trim(), description: description.trim(), start_date: today }
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch { /* noop */ }
      router.push('/auth/login?next=' + encodeURIComponent('/onboarding/restore'))
    }, 180)
    return () => clearTimeout(t)
  }, [isSubmitting, title, description, today, router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setIsSubmitting(true)
  }

  const hasTitle         = title.trim().length > 0
  const inputBorderColor = inputFocused ? '#6B5FE8' : hasTitle ? 'rgba(17,17,17,0.20)' : 'rgba(17,17,17,0.10)'

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
          <h1
            className="text-[28px] font-semibold leading-tight tracking-[-0.02em] mb-2"
            style={{ color: '#111111' }}
          >
            Come lo chiameresti?
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
            className="w-full bg-transparent text-[24px] font-semibold focus:outline-none border-b pb-3 leading-snug tracking-tight"
            style={{
              color: '#111111',
              borderColor: inputBorderColor,
              caretColor: '#6B5FE8',
              transition: 'border-color 180ms ease',
            }}
          />
        </div>

        {/* Optional description */}
        <div>
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

        <div className="flex-1 min-h-8" />

        {/* CTA */}
        <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 40px)' }}>
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
            Fatto
          </button>
        </div>
      </form>
    </main>
  )
}
