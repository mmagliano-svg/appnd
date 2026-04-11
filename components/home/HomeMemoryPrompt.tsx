'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MEMORY_PROMPT_TEXTS } from '@/lib/constants/memory-prompts'

/**
 * HomeMemoryPrompt
 *
 * A lightweight "memory activation" block rendered on the home screen.
 * Shows ONE soft, emotional prompt at a time to help the user remember
 * something meaningful. Clicking a CTA navigates to /memories/new with
 * the prompt pre-filled as the title.
 *
 * Selection logic:
 *  - Random pick on mount from the MEMORY_PROMPT_TEXTS library
 *  - Avoids repeating the last few shown prompts (via localStorage)
 *
 * This is intentionally minimal — no AI, no backend, no carousel.
 * The prompt library lives in lib/constants/memory-prompts.ts and is
 * organised by life-area category.
 */

const LAST_PROMPTS_KEY = 'appnd_recent_prompts'
const RECENT_WINDOW = 8  // how many recent prompts to avoid repeating

function readRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LAST_PROMPTS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

function writeRecent(list: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LAST_PROMPTS_KEY, JSON.stringify(list))
  } catch {
    // quota / parse issues — silent, best-effort
  }
}

function pickPrompt(): string {
  const recent = readRecent()
  const pool = MEMORY_PROMPT_TEXTS.filter((p) => !recent.includes(p))
  // If the user has cycled through most of the library, fall back to the full list.
  const source = pool.length > 0 ? pool : MEMORY_PROMPT_TEXTS
  const chosen = source[Math.floor(Math.random() * source.length)] ?? MEMORY_PROMPT_TEXTS[0]

  // Keep a rolling window of the last N shown prompts so rotation doesn't repeat too soon.
  const nextRecent = [chosen, ...recent.filter((p) => p !== chosen)].slice(0, RECENT_WINDOW)
  writeRecent(nextRecent)

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
