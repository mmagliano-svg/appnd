import { TransitionLink } from '@/components/ui/transition-link'
import type { UpcomingMomentResult } from '@/actions/home'

// ── Copy helpers ──────────────────────────────────────────────────────────

function birthdayHeadline(personName: string, daysUntil: number): string {
  if (daysUntil === 0)  return `Oggi è il compleanno di ${personName}`
  if (daysUntil <= 5)   return `Sta tornando il compleanno di ${personName}`
  if (daysUntil <= 15)  return `Tra pochi giorni è il compleanno di ${personName}`
  return `Sta tornando questo momento — ${personName}`
}

function anchorHeadline(label: string, daysUntil: number): string {
  if (daysUntil === 0)  return `Oggi è ${label}`
  if (daysUntil <= 5)   return `Sta tornando ${label}`
  if (daysUntil <= 15)  return `Tra pochi giorni sarà ${label}`
  return `Si avvicina ${label}`
}

function subText(memoryCount: number): string {
  if (memoryCount === 0) return 'Vuoi ricordarlo anche quest\'anno?'
  return `${memoryCount} ricord${memoryCount === 1 ? 'o' : 'i'} nel tempo`
}

function href(moment: UpcomingMomentResult): string {
  if (moment.kind === 'birthday' && moment.personId) {
    return `/people/${moment.personId}/momenti/compleanno`
  }
  return `/timeline?anchor=${moment.id}`
}

// ── Component ─────────────────────────────────────────────────────────────

interface UpcomingMomentsProps {
  moments: UpcomingMomentResult[]
}

export function UpcomingMoments({ moments }: UpcomingMomentsProps) {
  if (moments.length === 0) return null

  return (
    <section className="pt-2 space-y-3">
      <div className="px-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
          Momenti che tornano nel tempo
        </p>
        <p className="text-[11px] text-muted-foreground/35 mt-0.5">
          Ci sono ricordi che ritornano, ogni anno
        </p>
      </div>
      <div className="px-4 space-y-2">
        {moments.map((moment) => {
          const headline =
            moment.kind === 'birthday'
              ? birthdayHeadline(moment.personName ?? moment.label, moment.daysUntil)
              : anchorHeadline(moment.label, moment.daysUntil)

          return (
            <TransitionLink
              key={moment.id}
              href={href(moment)}
              className="flex items-center justify-between gap-4 rounded-2xl bg-foreground/[0.04] px-4 py-4 min-h-[64px] group active:scale-[0.99] transition-all hover:bg-foreground/[0.07]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-base select-none shrink-0" aria-hidden>
                  {moment.kind === 'birthday' ? '🎂' : '✦'}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug line-clamp-1">{headline}</p>
                  <p className="text-xs text-muted-foreground/50 mt-0.5">{subText(moment.memoryCount)}</p>
                </div>
              </div>
              <svg
                className="w-4 h-4 text-muted-foreground/20 group-hover:text-muted-foreground/45 transition-colors shrink-0"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 18l6-6-6-6" />
              </svg>
            </TransitionLink>
          )
        })}
      </div>
    </section>
  )
}
