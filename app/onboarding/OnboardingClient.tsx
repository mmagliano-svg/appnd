'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createMemoryReturnId } from '@/actions/memories'
import { addMediaContribution } from '@/actions/contributions'
import { createClient } from '@/lib/supabase/client'

// ── Value proposition slides ─────────────────────────────────────────────────

const SLIDES = [
  {
    emoji: '📸',
    title: 'Salva ogni momento',
    desc: 'Foto, date, luoghi. Tutto in un posto solo, per sempre.',
  },
  {
    emoji: '⏳',
    title: 'Rivivi la tua storia',
    desc: 'Una timeline dei tuoi ricordi, anno dopo anno.',
  },
  {
    emoji: '🔗',
    title: 'Scopri le connessioni',
    desc: 'Persone, luoghi e momenti che si ripetono nella tua vita.',
  },
] as const

// ── Component ────────────────────────────────────────────────────────────────

export function OnboardingClient() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [slideIndex, setSlideIndex] = useState(0)

  // Step 3 state
  const [title, setTitle] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
  }

  function nextSlide() {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex((i) => i + 1)
    } else {
      setStep(3)
    }
  }

  async function handleSave() {
    if (!title.trim()) return
    setLoading(true)
    setError('')

    try {
      const today = new Date().toISOString().split('T')[0]
      const memoryId = await createMemoryReturnId({
        title: title.trim(),
        start_date: today,
        categories: [],
        tags: [],
      })

      if (mediaFile) {
        const supabase = createClient()
        const ext = mediaFile.name.split('.').pop() ?? 'jpg'
        const path = `${memoryId}/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('memory-media')
          .upload(path, mediaFile, { upsert: false })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('memory-media')
            .getPublicUrl(path)
          await addMediaContribution(memoryId, publicUrl)
        }
      }

      router.push(`/memories/${memoryId}`)
    } catch {
      setError('Qualcosa è andato storto. Riprova.')
      setLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-12">

        {/* ── STEP 1: Emotion ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex-1 flex flex-col justify-center">
              {/* Visual accent */}
              <div className="w-12 h-1 rounded-full bg-foreground mb-10" />

              <h1 className="text-4xl font-bold leading-tight tracking-tight mb-5">
                La tua vita è fatta di momenti.{' '}
                <span className="text-muted-foreground/50">Non lasciarli sparire.</span>
              </h1>

              <p className="text-base text-muted-foreground leading-relaxed">
                Appnd ti aiuta a conservarli, organizzarli e riviverli — quando vuoi.
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full rounded-full bg-foreground text-background py-4 text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Inizia
            </button>
          </div>
        )}

        {/* ── STEP 2: Value slides ─────────────────────────────────────────── */}
        {step === 2 && (
          <div className="flex-1 flex flex-col justify-between">
            {/* Progress dots */}
            <div className="flex gap-1.5 mb-12">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === slideIndex
                      ? 'w-6 bg-foreground'
                      : 'w-2 bg-foreground/20'
                  }`}
                />
              ))}
            </div>

            {/* Slide content */}
            <div className="flex-1 flex flex-col justify-center">
              <div
                key={slideIndex}
                className="animate-in fade-in slide-in-from-right-4 duration-300"
              >
                <p className="text-5xl mb-8">{SLIDES[slideIndex].emoji}</p>
                <h2 className="text-3xl font-bold leading-tight mb-4">
                  {SLIDES[slideIndex].title}
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {SLIDES[slideIndex].desc}
                </p>
              </div>
            </div>

            <button
              onClick={nextSlide}
              className="w-full rounded-full bg-foreground text-background py-4 text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              {slideIndex < SLIDES.length - 1 ? 'Continua' : 'Iniziamo'}
            </button>
          </div>
        )}

        {/* ── STEP 3: Create first moment ──────────────────────────────────── */}
        {step === 3 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex-1 flex flex-col">
              <div className="mb-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40 mb-3">
                  Il tuo primo momento
                </p>
                <h2 className="text-3xl font-bold leading-tight">
                  Di cosa vuoi ricordarti?
                </h2>
              </div>

              {/* Title input */}
              <div className="mb-6">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es. Cena con Lalli, primo giorno di Federico…"
                  autoFocus
                  className="w-full bg-transparent text-xl font-medium placeholder:text-muted-foreground/40 focus:outline-none border-b border-border pb-3 leading-snug"
                />
              </div>

              {/* Photo picker */}
              {!mediaPreview ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  Aggiungi una foto
                </button>
              ) : (
                <div className="relative rounded-2xl overflow-hidden mb-2">
                  <img
                    src={mediaPreview}
                    alt="Anteprima"
                    className="w-full object-cover max-h-56"
                  />
                  <button
                    type="button"
                    onClick={() => { setMediaFile(null); setMediaPreview(null) }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80"
                  >
                    ✕
                  </button>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive mb-4">{error}</p>
            )}

            {/* CTA */}
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={!title.trim() || loading}
                className="w-full rounded-full bg-foreground text-background py-4 text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvataggio…' : 'Salva il momento'}
              </button>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Salta per ora
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
