'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DRAFT_KEY } from '@/lib/onboarding/draft'
import type { MemoryDraft, DraftPerson } from '@/lib/onboarding/draft'
import { saveDraft } from '@/actions/drafts'

// ── Image compression ────────────────────────────────────────────────────────
// Shrinks user photo to ≤ 1280px wide at 80% JPEG quality before encoding to
// base64.  Typical result: 80–250 KB as base64 string — well inside the 5 MB
// localStorage budget.

async function compressImageToDataUrl(file: File): Promise<string> {
  const MAX_WIDTH = 1280
  const QUALITY  = 0.80

  return new Promise((resolve, reject) => {
    const img    = new Image()
    const blobUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(blobUrl)

      let { width, height } = img
      if (width > MAX_WIDTH) {
        height = Math.round(height * MAX_WIDTH / width)
        width  = MAX_WIDTH
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas ctx')); return }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', QUALITY))
    }

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl)
      reject(new Error('image load failed'))
    }
    img.src = blobUrl
  })
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CreatePhotoPage() {
  const router      = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const titleRef    = useRef<HTMLInputElement>(null)

  const today      = new Date().toISOString().split('T')[0]
  const todayLabel = new Date().toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // ── State ──────────────────────────────────────────────────────────────────
  const [imageUrl,          setImageUrl]          = useState<string | null>(null)
  const [imageFile,         setImageFile]         = useState<File | null>(null)
  const [title,             setTitle]             = useState('')
  const [description,       setDescription]       = useState('')
  const [people,            setPeople]            = useState<DraftPerson[]>([])
  const [inputFocused,      setInputFocused]      = useState(false)
  const [textareaFocused,   setTextareaFocused]   = useState(false)
  const [isSubmitting,      setIsSubmitting]      = useState(false)
  const [submitError,       setSubmitError]       = useState('')

  // Auto-focus title once image is selected
  useEffect(() => {
    if (!imageUrl) return
    const t = setTimeout(() => titleRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [imageUrl])

  // ── Handlers ───────────────────────────────────────────────────────────────

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImageUrl(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !imageUrl || !imageFile || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError('')

    // ── 1. Compress image to base64 ─────────────────────────────────────────
    let image_data_url: string | undefined
    try {
      image_data_url = await compressImageToDataUrl(imageFile)
    } catch {
      // Compression failed — continue without image rather than blocking the flow.
    }

    const filteredPeople = people.filter(p => p.value.trim()).map(p => ({ value: p.value.trim() }))

    // ── 2. Persist draft server-side (primary — survives cross-browser magic link) ──
    let draftToken: string | undefined
    try {
      const result = await saveDraft({
        title:       title.trim(),
        description: description.trim(),
        start_date:  today,
        image_data:  image_data_url,
        people:      filteredPeople,
      })
      draftToken = result.token
    } catch (err) {
      // Server draft failed — log and fall through to localStorage-only path.
      // The user can still complete the flow if they stay in the same browser.
      console.error('[create/photo] saveDraft failed:', err)
    }

    // ── 3. Also write to localStorage as secondary fallback (same-browser) ──
    const draft: MemoryDraft = {
      title:         title.trim(),
      description:   description.trim(),
      start_date:    today,
      image_data_url,
      people:        filteredPeople,
    }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // localStorage full — retry without the image
      if (image_data_url) {
        try {
          const { image_data_url: _dropped, ...withoutImage } = draft
          localStorage.setItem(DRAFT_KEY, JSON.stringify(withoutImage))
        } catch {
          // Ignore — server draft is the primary store
        }
      }
    }

    // ── 4. Navigate to auth — flat params, no nested query strings ──────────
    // draft and next are separate top-level params so they survive the full
    // emailRedirectTo → callback → redirect chain without nested encoding.
    const authParams = new URLSearchParams({
      next:  '/onboarding/restore',
      title: title.trim(),
    })
    if (draftToken) authParams.set('draft', draftToken)

    router.push('/auth/login?' + authParams.toString())
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const hasTitle    = title.trim().length > 0
  const canSubmit   = hasTitle && !!imageUrl
  const borderColor = inputFocused
    ? '#6B5FE8'
    : hasTitle
    ? 'rgba(17,17,17,0.20)'
    : 'rgba(17,17,17,0.10)'

  // ── STEP 1 — no image selected ─────────────────────────────────────────────
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
            <div className="absolute inset-0 bg-black/25" />
            <div
              className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.10))' }}
            />
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
            <span className="text-[15px] font-medium" style={{ color: 'rgba(17,17,17,0.40)' }}>
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

  // ── STEP 2 — image selected, show card preview + form ──────────────────────
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
          onClick={() => { setImageUrl(null); setImageFile(null) }}
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
              borderColor: borderColor,
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

        {/* ── People section ──────────────────────────────────────── */}
        <div className="mt-6 mb-2">
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
          {submitError && (
            <p className="text-center text-[12px] pb-2" style={{ color: '#E05252' }}>
              {submitError}
            </p>
          )}
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
              opacity: canSubmit && !isSubmitting ? 1 : 0.4,
              transition: 'all 150ms ease',
              pointerEvents: canSubmit && !isSubmitting ? 'auto' : 'none',
            }}
          >
            {isSubmitting ? 'Un momento…' : 'Salva questo momento'}
          </button>
        </div>
      </form>
    </main>
  )
}
