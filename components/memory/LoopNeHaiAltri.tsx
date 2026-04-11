import Link from 'next/link'

/**
 * Loop 1 — "Ne hai altri?"
 *
 * Soft inline nudge rendered on the memory detail page.
 * Surfaces when the user has other memories matching this one
 * (same category or same location). Turns a single moment into
 * an invitation to continue — without feeling like a notification.
 *
 * Rendered by app/memories/[id]/page.tsx in the default (non-period)
 * layout, between the description and the timeline.
 */

interface LoopNeHaiAltriProps {
  /** How many other matching memories the user has (0 hides the block) */
  matchCount: number
  /** The kind of match — drives the copy */
  matchType: 'category' | 'location' | 'generic'
  /** Human-readable anchor used in the question (e.g. "Londra" / "concerti") */
  anchorLabel?: string | null
  /** Where "Aggiungine un altro" should navigate */
  createHref: string
}

function buildQuestion(matchType: LoopNeHaiAltriProps['matchType'], anchorLabel?: string | null): string {
  if (matchType === 'location' && anchorLabel) {
    return `Ci sono altri momenti a ${anchorLabel}?`
  }
  if (matchType === 'category' && anchorLabel) {
    return `Sei stato ad altri ${anchorLabel}?`
  }
  return 'Ci sono altri momenti come questo?'
}

export function LoopNeHaiAltri({
  matchCount,
  matchType,
  anchorLabel,
  createHref,
}: LoopNeHaiAltriProps) {
  const question = buildQuestion(matchType, anchorLabel)

  return (
    <div className="mt-14">
      <p className="text-[10px] text-muted-foreground/35 lowercase tracking-wide mb-2">
        ne hai altri?
      </p>
      <p className="text-[17px] text-foreground/70 leading-snug">
        {question}
      </p>
      {matchCount > 0 && (
        <p className="text-[12px] text-muted-foreground/45 leading-relaxed mt-1.5 italic">
          {matchCount === 1
            ? 'Ne hai già salvato 1.'
            : `Ne hai già salvati ${matchCount}.`}
        </p>
      )}
      <Link
        href={createHref}
        className="inline-flex items-center mt-4 text-[13px] text-foreground/75 hover:text-foreground transition-colors"
      >
        Aggiungine un altro →
      </Link>
    </div>
  )
}
