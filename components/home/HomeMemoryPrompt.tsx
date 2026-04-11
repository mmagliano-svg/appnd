'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * HomeMemoryPrompt
 *
 * A lightweight "memory activation" block rendered on the home screen.
 * Shows ONE soft, emotional prompt at a time to help the user remember
 * something meaningful. Clicking a CTA navigates to /memories/new with
 * the prompt pre-filled as the title.
 *
 * Selection logic:
 *  - Random pick on mount
 *  - Avoids repeating the last shown prompt (via localStorage)
 *
 * This is intentionally minimal — no AI, no backend, no carousel.
 */

const PROMPTS = [
  'Ti ricordi il tuo primo viaggio da solo?',
  'Ti ricordi tutte le case in cui hai vissuto?',
  'Con chi passavi più tempo in quel periodo?',
  'Questo momento esiste… ma manca qualcosa',
  'C’è qualcuno che potrebbe ricordarlo meglio di te?',
]

const LAST_PROMPT_KEY = 'appnd_last_prompt'

function pickPrompt(): string {
  // Read "last shown" — safe on SSR (will be null, then recomputed client-side)
  const last =
    typeof window !== 'undefined'
      ? window.localStorage.getItem(LAST_PROMPT_KEY)
      : null

  const pool = PROMPTS.filter((p) => p !== last)
  const chosen = pool[Math.floor(Math.random() * pool.length)] ?? PROMPTS[0]

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LAST_PROMPT_KEY, chosen)
  }

  return chosen
}

export function HomeMemoryPrompt() {
  // Start null on SSR to avoid hydration mismatch, then fill on mount
  const [prompt, setPrompt] = useState<string | null>(null)

  useEffect(() => {
    setPrompt(pickPrompt())
  }, [])

  if (!prompt) {
    // Render an invisible placeholder with the same vertical space so the
    // layout doesn't jump when the prompt appears on mount.
    return <div className="px-4 h-[170px]" aria-hidden />
  }

  const newMemoryHref = `/memories/new?title=${encodeURIComponent(prompt)}&source=prompt_home`

  return (
    <div className="px-4">
      <div
        className="rounded-2xl px-5 py-6"
        style={{
          background: 'rgba(107,95,232,0.05)',
        }}
      >
        {/* Soft label */}
        <p className="text-[11px] text-muted-foreground/45 lowercase tracking-wide">
          ti è tornato in mente questo?
        </p>

        {/* Main prompt — the emotional focus */}
        <p className="text-[18px] font-medium text-foreground/85 leading-snug mt-3">
          {prompt}
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          <Link
            href={newMemoryHref}
            className="inline-flex items-center rounded-full bg-foreground text-background px-5 py-2.5 text-[13px] font-medium active:scale-[0.98] transition-transform"
          >
            Salvalo
          </Link>
          <Link
            href={newMemoryHref}
            className="inline-flex items-center rounded-full px-5 py-2.5 text-[13px] text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            Coinvolgi chi c&rsquo;era
          </Link>
        </div>
      </div>
    </div>
  )
}
