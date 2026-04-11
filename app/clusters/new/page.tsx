'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

/**
 * /clusters/new
 *
 * Minimal 2-step flow for "cluster" prompts — things that happened
 * multiple times and share one anchor (a city visited many times,
 * all the weddings you've been to, every Sunday lunch).
 *
 * Step 1 — ask the anchor ("Qual è la città?" / "Quanti?")
 * Step 2 — confirm and jump into memory creation with the anchor
 *          prefilled as location. The user can come back and add
 *          another moment to the same cluster.
 *
 * V1 has no dedicated "cluster" entity in the DB. Clusters are
 * expressed as memories sharing a location. This keeps it simple
 * and uses existing data without a schema change.
 */

function NewClusterForm() {
  const searchParams = useSearchParams()
  const promptText = searchParams.get('prompt') ?? ''
  const anchorInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<1 | 2>(1)
  const [anchor, setAnchor] = useState('')

  useEffect(() => {
    const id = window.setTimeout(() => anchorInputRef.current?.focus(), 200)
    return () => window.clearTimeout(id)
  }, [step])

  function handleAdvance(e: React.FormEvent) {
    e.preventDefault()
    if (!anchor.trim()) return
    setStep(2)
  }

  const newMemoryHref = `/memories/new?prompt=${encodeURIComponent(promptText)}&source=prompt&location=${encodeURIComponent(anchor.trim())}`

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
            qualcosa che si è ripetuto
          </p>

          {promptText && (
            <p className="mt-4 text-[17px] italic text-foreground/60 leading-relaxed">
              {promptText}
            </p>
          )}
        </div>

        {/* ── Step 1 ─────────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleAdvance} className="mt-12 space-y-6">
            <p className="text-[13px] text-muted-foreground/60 leading-relaxed">
              Prima di tutto, dimmi cosa accomuna questi momenti.
              Può essere una città, un luogo, una persona, un tema.
            </p>

            <div>
              <input
                ref={anchorInputRef}
                type="text"
                value={anchor}
                onChange={(e) => setAnchor(e.target.value)}
                placeholder="es. Hong Kong"
                className="w-full bg-transparent text-2xl font-bold placeholder:text-foreground/25 focus:outline-none border-b border-border pb-3 leading-snug tracking-tight"
              />
              <p className="text-[10px] text-muted-foreground/30 mt-2 italic">
                Scrivi una parola sola — la userai per ritrovarli tutti insieme.
              </p>
            </div>

            <button
              type="submit"
              disabled={!anchor.trim()}
              className="w-full rounded-2xl bg-foreground text-background py-4 text-sm font-semibold hover:opacity-90 active:scale-[0.99] disabled:opacity-40 transition-all"
            >
              Continua →
            </button>
          </form>
        )}

        {/* ── Step 2 ─────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="mt-12 space-y-8">
            <div>
              <p className="text-[10px] text-muted-foreground/35 lowercase tracking-wide">
                tema
              </p>
              <p className="mt-2 text-[26px] font-semibold tracking-tight leading-tight">
                {anchor}
              </p>
            </div>

            <div className="rounded-2xl bg-foreground/[0.04] px-5 py-5">
              <p className="text-[13px] text-foreground/70 leading-relaxed">
                Ora aggiungi i momenti che ti ricordi di <span className="font-semibold">{anchor}</span>.
              </p>
              <p className="text-[12px] text-muted-foreground/50 leading-relaxed mt-2">
                Ognuno sarà un ricordo separato, collegato tra loro.
                Puoi tornare qui ogni volta che te ne viene in mente uno nuovo.
              </p>
            </div>

            <div className="space-y-2.5">
              <Link
                href={newMemoryHref}
                className="flex items-center justify-center w-full rounded-2xl bg-foreground text-background py-4 text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition-all"
              >
                Crea il primo momento →
              </Link>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center justify-center w-full rounded-2xl py-3 text-sm text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                ← Cambia tema
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}

export default function NewClusterPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <NewClusterForm />
    </Suspense>
  )
}
