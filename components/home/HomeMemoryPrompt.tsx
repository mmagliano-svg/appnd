'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PROMPTS, pickPromptFromPool, getPromptHref, type Prompt } from '@/lib/constants/memory-prompts'

/**
 * HomeMemoryPrompt
 *
 * Shows ONE structured prompt at a time. The prompt has a type
 * (moment / period / cluster) and routes to the matching creation
 * flow. Rotation avoids recently-shown prompts via a localStorage
 * rolling window.
 *
 * Pure V1 — no AI, no backend, no carousel.
 */

const RECENT_KEY = 'appnd_recent_prompt_ids'
const RECENT_WINDOW = 8

function readRecentIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

function writeRecentIds(list: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list))
  } catch {
    // silent
  }
}

function pickPrompt(): Prompt {
  const recent = readRecentIds()
  const chosen = pickPromptFromPool(recent)
  const nextRecent = [chosen.id, ...recent.filter((id) => id !== chosen.id)].slice(0, RECENT_WINDOW)
  writeRecentIds(nextRecent)
  return chosen
}

// Subtle label varies by prompt type — each type invites a different kind
// of recall, so the eyebrow copy follows.
function labelForType(type: Prompt['type']): string {
  switch (type) {
    case 'moment':  return 'ti è tornato in mente questo?'
    case 'period':  return 'un periodo della tua vita'
    case 'cluster': return 'qualcosa che si è ripetuto'
  }
}

// Primary CTA label also varies by type to stay honest about what the
// next screen will do.
function primaryCtaForType(type: Prompt['type']): string {
  switch (type) {
    case 'moment':  return 'Salvalo'
    case 'period':  return 'Racconta quel periodo'
    case 'cluster': return 'Raggruppa questi momenti'
  }
}

export function HomeMemoryPrompt() {
  const [prompt, setPrompt] = useState<Prompt | null>(null)

  useEffect(() => {
    setPrompt(pickPrompt())
  }, [])

  if (!prompt) {
    // Invisible placeholder preserves vertical space to avoid layout jump
    return <div className="px-4 h-[170px]" aria-hidden />
  }

  const href = getPromptHref(prompt)

  return (
    <div className="px-4">
      <div
        className="rounded-2xl px-5 py-6"
        style={{ background: 'rgba(107,95,232,0.05)' }}
      >
        <p className="text-[11px] text-muted-foreground/45 lowercase tracking-wide">
          {labelForType(prompt.type)}
        </p>

        <p className="text-[18px] font-medium text-foreground/85 leading-snug mt-3">
          {prompt.text}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-6">
          <Link
            href={href}
            className="inline-flex items-center rounded-full bg-foreground text-background px-5 py-2.5 text-[13px] font-medium active:scale-[0.98] transition-transform"
          >
            {primaryCtaForType(prompt.type)}
          </Link>
          <Link
            href={href}
            className="inline-flex items-center rounded-full px-5 py-2.5 text-[13px] text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            Coinvolgi chi c&rsquo;era
          </Link>
        </div>
      </div>
    </div>
  )
}
