'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DRAFT_KEY } from '@/lib/onboarding/draft'

export default function CreatePhotoPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split('T')[0]
  const todayLabel = new Date().toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const [imageUrl, setImageUrl]         = useState<string | null>(null)
  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [inputFocused, setInputFocused]     = useState(false)
  const [textareaFocused, setTextareaFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-focus title once image is selected
  useEffect(() => {
    if (!imageUrl) return
    const t = setTimeout(() => titleRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [imageUrl])

  // Navigate after submit animation
  useEffect(() => {
    if (!isSubmitting) return
    const t = setTimeout(() => {
      const draft = { title: title.trim(), description: description.trim(), start_date: today }
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch { /* noop */ }
      const authUrl = '/auth/login?next=' + encodeURIComponent('/onboarding/restore') +
        '&title=' + encodeURIComponent(title.trim())
      router.push(authUrl)
    }, 180)
    return () => clearTimeout(t)
  }, [isSubmitting, title, description, today, router])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImageUrl(url)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !imageUrl) return
    setIsSubmitting(true)
  }

  const hasTitle         = title.trim().length > 0
  const canSubmit        = hasTitle && !!imageUrl
  const inputBorderColor = inputFocused ? '#6B5FE8' : hasTitle ? 'rgba(17,17,17,0.20)' : 'rgba(17,17,17,0.10)'

  // ── STEP 1 — no image selected ────────────────────────────────────────────
  if (!imageUrl) {
    return (
      <main
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

        <div className="flex-1 flex flex-col px-6 pt-2 overflow-y-auto">

          {/* ── Visual block ─────────────────────────────────────────────── */}
          <div
            className="w-full rounded-2xl overflow-hidden relative mb-8"
            style={{ aspectRatio: '16/9' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/onboarding/photo-christmas.jpg"
              alt=""
              className="w-full h-full object-cover"
              style={{ opacity: 0.75, filter: 'blur(1px)', transform: 'scale(1.04)' }}
            />
            {/* Dark scrim for text legibility */}
            <div className="absolute inset-0 bg-black/25" />
            {/* Bottom fade */}
            <div
              className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.10))' }}
            />
            {/* Overlay text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <p className="text-[19px] font-semibold leading-snug tracking-[-0.02em] mb-1 text-white">
                Parti da una foto che conta
              </p>
              <p className="text-[13px] text-white/80">
                Ogni momento inizia da qualcosa che hai già
              </p>
            </div>
          </div>

          {/* Upload area */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-transform"
            style={{
              aspectRatio: '4/3',
              background: 'rgba(17,17,17,0.04)',
              border: '1.5px dashed rgba(17,17,17,0.18)',
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(17,17,17,0.06)' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: 'rgba(17,17,17,0.35)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span
              className="text-[15px] font-medium"
              style={{ color: 'rgba(17,17,17,0.40)' }}
            >
              Scegli dalla libreria
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />

          <div className="flex-1 min-h-8" />
        </div>
      </main>
    )
  }

  // ── STEP 2 — image selected, show card preview + form ─────────────────────
  return (
    <main
      className="h-[100dvh] flex flex-col overflow-hidden animate-create-step2-in"
      style={{ background: '#F7F7F5' }}
    >
      {/* Top bar */}
      <div
        className="flex items-center px-5 pb-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 20px)' }}
      >
        <button
          type="button"
          onClick={() => setImageUrl(null)}
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
        {/* Card preview */}
        <div style={{ transform: 'rotate(-0.8deg)', marginBottom: '2rem' }}>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              boxShadow: '0 4px 28px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.05)',
              background: 'white',
              animation: isSubmitting ? 'ob-card-submit 200ms ease-in-out' : undefined,
            }}
          >
            {/* Photo */}
            <div className="h-40 relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                className="w-full h-full"
                style={{ objectFit: 'cover', objectPosition: 'center 25%' }}
              />
              <div
                className="absolute inset-x-0 bottom-0 h-10 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.08), transparent)' }}
              />
              {/* Date chip */}
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
            <div className="px-3.5 pt-4 pb-3 min-h-[56px]">
              {title.trim() ? (
                <p
                  key="title-set"
                  className="text-[14px] font-bold leading-tight animate-ob-title-in"
                  style={{ color: '#000000' }}
                >
                  {title.trim()}
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

        {/* Title input */}
        <div className="mb-8">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Come si chiama questo momento?"
            className="w-full bg-transparent text-[21px] font-semibold focus:outline-none border-b pb-3 leading-snug tracking-tight"
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
            onFocus={() => setTextareaFocused(true)}
            onBlur={() => setTextareaFocused(false)}
            placeholder="Com'era? Chi c'era? Come ti sentivi?"
            rows={3}
            className="w-full rounded-2xl px-4 py-3 text-[14px] focus:outline-none resize-none leading-relaxed"
            style={{
              background: 'rgba(17,17,17,0.04)',
              border: `1px solid ${textareaFocused ? 'rgba(107,95,232,1)' : 'rgba(17,17,17,0.07)'}`,
              color: '#111111',
              caretColor: '#6B5FE8',
              transition: 'border-color 150ms ease',
            }}
          />
        </div>

        <div className="flex-1 min-h-4" />

        {/* CTA */}
        <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 40px)' }}>
          <p
            className="text-center text-[11px] pb-3"
            style={{ color: 'rgba(17,17,17,0.20)' }}
          >
            Per salvarlo ti chiediamo solo un&apos;email.
          </p>
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full rounded-2xl py-4 text-[16px] font-medium tracking-[-0.01em] active:scale-[0.97]"
            style={{
              background: '#6B5FE8',
              color: '#ffffff',
              opacity: canSubmit ? 1 : 0.4,
              transition: 'all 150ms ease',
              pointerEvents: canSubmit ? 'auto' : 'none',
            }}
          >
            Salva questo momento
          </button>
        </div>
      </form>
    </main>
  )
}
