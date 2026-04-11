import Link from 'next/link'
import type { RepeatedPattern } from '@/actions/home'

/**
 * Loop 2 — "Questo torna"
 *
 * Soft home-screen card that surfaces the single strongest recurring
 * pattern in the user's memories (a place revisited many times, a
 * category that keeps coming back). Not a notification, not a feed —
 * a quiet observation that invites the user to keep building on it.
 *
 * Rendered only when getRepeatedPattern() finds a pattern with ≥ 2
 * occurrences. Silent otherwise.
 */

interface HomeQuestoTornaProps {
  pattern: RepeatedPattern | null
}

function buildSentence(pattern: RepeatedPattern): string {
  if (pattern.kind === 'location') {
    return `Sei stato ${pattern.count} volte a ${pattern.label}.`
  }
  return `Hai salvato ${pattern.count} momenti in ${pattern.label}.`
}

export function HomeQuestoTorna({ pattern }: HomeQuestoTornaProps) {
  if (!pattern) return null

  return (
    <div className="px-4">
      <p className="text-[10px] text-muted-foreground/35 lowercase tracking-wide mb-2">
        questo torna
      </p>
      <p className="text-[18px] font-medium text-foreground/85 leading-snug">
        {buildSentence(pattern)}
      </p>
      <div className="flex items-center gap-4 mt-4">
        <Link
          href={pattern.href}
          className="text-[13px] text-foreground/75 hover:text-foreground transition-colors"
        >
          Rivedili →
        </Link>
        <Link
          href="/memories/new"
          className="text-[13px] text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          Aggiungine un altro
        </Link>
      </div>
    </div>
  )
}
