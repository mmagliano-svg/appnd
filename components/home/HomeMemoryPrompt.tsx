'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getNextPrompt, getPromptHref } from '@/lib/prompts/prompt-engine'
import type { PromptEntity, PromptEngineInput } from '@/lib/prompts/prompt-types'

/**
 * HomeMemoryPrompt
 *
 * Shows ONE structured prompt at a time, selected by the Prompt Engine V1.
 * The engine factors in the user's memory/period count, recent prompt history,
 * existing categories, and emotional weight to pick the best prompt.
 *
 * Rotation state lives in localStorage (rolling window of 8 recent prompt IDs).
 * Engine context (memoryCount, periodCount, categories) is passed as props
 * from the server component that renders this block.
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

// Subtle label varies by prompt kind.
function labelForKind(kind: PromptEntity['kind']): string {
  switch (kind) {
    case 'moment':  return 'ti è tornato in mente questo?'
    case 'period':  return 'un periodo della tua vita'
    case 'cluster': return 'qualcosa che si è ripetuto'
  }
}

// Primary CTA label varies by kind.
function primaryCtaForKind(kind: PromptEntity['kind']): string {
  switch (kind) {
    case 'moment':  return 'Salvalo'
    case 'period':  return 'Racconta quel periodo'
    case 'cluster': return 'Raggruppa questi momenti'
  }
}

export interface HomeMemoryPromptProps {
  /** Total event-type memories the user has. Default: 0. */
  memoryCount?: number
  /** Total periods the user has. Default: 0. */
  periodCount?: number
  /** Categories the user already has memories in. Default: []. */
  existingCategories?: string[]
  /** Profile signals for smarter prompt selection. */
  profileSignals?: PromptEngineInput['profileSignals']
}

export function HomeMemoryPrompt({
  memoryCount = 0,
  periodCount = 0,
  existingCategories = [],
  profileSignals,
}: HomeMemoryPromptProps) {
  const [prompt, setPrompt] = useState<PromptEntity | null>(null)

  useEffect(() => {
    const recentPromptIds = readRecentIds()
    const engineInput: PromptEngineInput = {
      memoryCount,
      periodCount,
      recentPromptIds,
      existingCategories,
      profileSignals,
    }
    const chosen = getNextPrompt(engineInput)

    // Update rolling window
    const nextRecent = [chosen.id, ...recentPromptIds.filter((id) => id !== chosen.id)].slice(0, RECENT_WINDOW)
    writeRecentIds(nextRecent)

    setPrompt(chosen)
  }, [memoryCount, periodCount, existingCategories])

  if (!prompt) {
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
          {labelForKind(prompt.kind)}
        </p>

        <p className="text-[18px] font-medium text-foreground/85 leading-snug mt-3">
          {prompt.text}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-6">
          <Link
            href={href}
            className="inline-flex items-center rounded-full bg-foreground text-background px-5 py-2.5 text-[13px] font-medium active:scale-[0.98] transition-transform"
          >
            {primaryCtaForKind(prompt.kind)}
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
