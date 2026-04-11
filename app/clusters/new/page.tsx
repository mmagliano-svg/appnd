'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

/**
 * /clusters/new
 *
 * Entry flow for "cluster" prompts — things that happened multiple
 * times (a city revisited, every wedding, all the Sunday lunches).
 *
 * Design principle: clusters emerge FROM moments, not BEFORE moments.
 * So this page does NOT ask the user to define an abstract theme up
 * front. It shows the prompt, invites the user to start from the
 * first moment they remember, and optionally lets them type a
 * loose anchor (a city, a person, an activity) that will be
 * prefilled on /memories/new.
 *
 * No new DB entity — clusters are expressed as memories sharing a
 * loose anchor string (location / tag). V1 keeps the data model
 * untouched.
 */

function NewClusterForm() {
  const searchParams = useSearchParams()
  const promptText = searchParams.get('prompt') ?? ''
  const inputRef = useRef<HTMLInputElement>(null)

  const [anchor, setAnchor] = useState('')

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 250)
    return () => window.clearTimeout(id)
  }, [])

  // If the user typed something, we pass it to /memories/new as a
  // location prefill. Empty → no prefill, user fills everything.
  const newMemoryHref = (() => {
    const params = new URLSearchParams()
    params.set('prompt', promptText)
    params.set('source', 'prompt')
    if (anchor.trim()) params.set('location', anchor.trim())
    return `/memories/new?${params.toString()}`
  })()

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

        {/* Title = prompt */}
        <div className="mt-10">
          <p className="text-[10px] text-muted-foreground/35 lowercase tracking-wide">
            qualcosa che si è ripetuto
          </p>

          {promptText && (
            <h1 className="mt-4 text-[22px] font-semibold text-foreground/85 leading-snug">
              {promptText}
            </h1>
          )}
        </div>

        {/* Subtitle */}
        <p className="mt-8 text-[16px] text-foreground/65 leading-relaxed">
          Inizia dal primo che ricordi.
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground/45 leading-relaxed">
          Potrai aggiungerne altri dopo.
        </p>

        {/* Optional loose anchor */}
        <div className="mt-10">
          <input
            ref={inputRef}
            type="text"
            value={anchor}
            onChange={(e) => setAnchor(e.target.value)}
            placeholder="es. Hong Kong, con papà, vacanze al mare"
            className="w-full bg-transparent text-[17px] placeholder:text-foreground/25 focus:outline-none border-b border-border pb-3 leading-snug"
          />
          <p className="text-[10px] text-muted-foreground/30 mt-2 italic">
            Facoltativo — puoi saltare e aggiungerlo dopo.
          </p>
        </div>

        {/* CTA */}
        <Link
          href={newMemoryHref}
          className="flex items-center justify-center w-full rounded-full bg-foreground text-background py-4 text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition-all mt-10"
        >
          Crea il primo momento →
        </Link>

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
