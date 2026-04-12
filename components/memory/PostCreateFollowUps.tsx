'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { FollowUpSuggestion } from '@/lib/prompts/prompt-followup'

/**
 * PostCreateFollowUps
 *
 * Rendered on the memory detail page immediately after creation
 * (gated by ?created=1 searchParam). Shows the top 1–2 follow-up
 * suggestions from the follow-up engine as soft, dismissible hints.
 *
 * Feels like natural next steps in a conversation, not a checklist.
 */

interface PostCreateFollowUpsProps {
  suggestions: FollowUpSuggestion[]
  memoryId: string
}

export function PostCreateFollowUps({ suggestions, memoryId }: PostCreateFollowUpsProps) {
  const [dismissed, setDismissed] = useState(false)
  const visible = suggestions.slice(0, 2)

  if (dismissed || visible.length === 0) return null

  return (
    <div className="mt-10 guided-hints-fade">
      <p className="text-[11px] text-muted-foreground/40 lowercase tracking-wide mb-4">
        e adesso?
      </p>

      <div className="space-y-3">
        {visible.map((s) => (
          <Link
            key={s.id}
            href={followUpHref(s, memoryId)}
            className="block group"
          >
            <p className="text-[16px] text-foreground/75 leading-snug group-hover:text-foreground transition-colors">
              {s.text}
            </p>
            <p className="text-[11px] text-muted-foreground/40 mt-0.5">
              {followUpActionLabel(s)}
            </p>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="mt-5 text-[11px] text-muted-foreground/35 hover:text-muted-foreground/60 transition-colors"
      >
        Per ora va bene così
      </button>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function followUpHref(s: FollowUpSuggestion, memoryId: string): string {
  switch (s.id) {
    case 'mem-add-place':
    case 'mem-add-people':
    case 'mem-add-description':
      return `/memories/${memoryId}/edit`
    case 'mem-invite':
    case 'mem-ask-detail':
      return `/memories/${memoryId}`
    case 'mem-another-similar':
    case 'mem-what-after':
      return '/memories/new'
    case 'mem-link-period':
      return `/memories/${memoryId}/edit`
    case 'per-add-place':
    case 'per-add-description':
    case 'per-add-people':
      return `/memories/${memoryId}/edit`
    case 'per-add-moment':
      return `/memories/new?period=${memoryId}`
    case 'per-what-changed':
      return '/memories/new'
    case 'per-invite':
      return `/memories/${memoryId}`
    default:
      return `/memories/${memoryId}`
  }
}

function followUpActionLabel(s: FollowUpSuggestion): string {
  switch (s.kind) {
    case 'structural':
      return 'Aggiungi un dettaglio →'
    case 'narrative':
      return 'Continua la storia →'
    case 'social':
      return 'Coinvolgi qualcuno →'
  }
}
