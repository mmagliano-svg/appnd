'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createPeriodPrototype } from '@/actions/periods'

/**
 * /periods/new
 *
 * Minimal dedicated page to create a "period" — a life phase with a
 * start and end date. In Appnd's data model a period is a memory with
 * end_date set, so we call the same server action.
 *
 * Arrives from HomeMemoryPrompt when a `period`-typed prompt is tapped.
 * The prompt text is shown as context above the title input — it's
 * NOT used as the final title.
 */

function NewPeriodForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const titleRef = useRef<HTMLInputElement>(null)

  const promptText = searchParams.get('prompt') ?? ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [place, setPlace] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    // Focus the title after a short delay so the fade-in feels intentional
    const id = window.setTimeout(() => titleRef.current?.focus(), 200)
    return () => window.clearTimeout(id)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Dai un titolo a questo periodo.')
      return
    }
    if (!startDate) {
      setError('Indica quando è iniziato.')
      return
    }

    setLoading(true)
    try {
      // Period persistence is isolated behind createPeriodPrototype().
      // This page does not know (and must not assume) how a period is stored.
      // See actions/periods.ts for the prototype seam.
      const { href } = await createPeriodPrototype({
        title: title.trim(),
        start_date: startDate,
        end_date: endDate || undefined,
        location_name: place.trim() || undefined,
        description: description.trim() || undefined,
      })
      router.push(href.includes('?') ? `${href}&created=1` : `${href}?created=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Qualcosa è andato storto. Riprova.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-5 pt-6 pb-24">

        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
          </svg>
          Torna indietro
        </Link>

        {/* Header */}
        <div className="mt-10">
          <p className="text-[10px] text-muted-foreground/35 lowercase tracking-wide">
            un periodo della tua vita
          </p>

          {promptText && (
            <p className="mt-4 text-[15px] italic text-foreground/55 leading-relaxed">
              {promptText}
            </p>
          )}

          <p className="mt-4 text-sm text-muted-foreground/55 leading-relaxed">
            Una fase della tua vita — una relazione, un lavoro, una casa.
            Non un singolo giorno.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-10 space-y-7">

          {/* Title */}
          <div>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ti ricordi che fase della tua vita era?"
              className="w-full bg-transparent text-2xl font-bold placeholder:text-foreground/30 focus:outline-none border-b border-border pb-3 leading-snug tracking-tight"
            />
            <p className="text-[10px] text-muted-foreground/30 mt-2 italic">
              Dagli un nome che abbia senso per te — anche imperfetto.
            </p>
          </div>

          {/* When */}
          <div className="space-y-3">
            <p className="text-[13px] text-foreground/70">
              Ti ricordi quando è iniziato?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-transparent border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-foreground/30 transition-colors"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-transparent border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-foreground/30 transition-colors"
              />
            </div>
            <p className="text-[11px] text-muted-foreground/45 italic">
              E quando è finito, se è finito.
            </p>
          </div>

          {/* Where */}
          <div className="space-y-3">
            <p className="text-[13px] text-foreground/70">
              Dove vivevi o passavi le giornate?
            </p>
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Una città, un quartiere, un luogo"
              className="w-full bg-transparent border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-foreground/30 transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <p className="text-[13px] text-foreground/70">
              Com&rsquo;era la tua vita in quei giorni?
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dove eri ogni giorno? Chi c'era? Cosa facevi?"
              rows={6}
              className="w-full rounded-2xl border border-border/50 bg-muted/20 px-4 py-3 text-base placeholder:text-muted-foreground/40 focus:outline-none focus:border-border focus:bg-background transition-colors resize-none leading-relaxed"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-foreground text-background py-4 text-sm font-semibold hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all"
          >
            {loading ? 'Salvataggio…' : 'Salva questo periodo'}
          </button>
        </form>

      </div>
    </main>
  )
}

export default function NewPeriodPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <NewPeriodForm />
    </Suspense>
  )
}
