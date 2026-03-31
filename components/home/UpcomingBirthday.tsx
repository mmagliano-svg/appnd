import { TransitionLink } from '@/components/ui/transition-link'
import type { UpcomingBirthdayResult } from '@/actions/persons'

interface UpcomingBirthdayProps {
  data: UpcomingBirthdayResult
}

export function UpcomingBirthday({ data }: UpcomingBirthdayProps) {
  const { personId, personName, daysUntil, birthdayMemoryCount } = data

  const headline =
    daysUntil === 0
      ? `Oggi è il compleanno di ${personName}`
      : `Tra poco è il compleanno di ${personName}`

  const sub =
    birthdayMemoryCount > 0
      ? `${birthdayMemoryCount} ricord${birthdayMemoryCount === 1 ? 'o' : 'i'} nel tempo`
      : 'Potrebbe essere il primo'

  return (
    <section className="pt-2 space-y-3">
      <div className="px-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
          Momenti che tornano
        </p>
      </div>
      <div className="px-4">
        <TransitionLink
          href={`/people/${personId}/momenti/compleanno`}
          className="flex items-center justify-between gap-4 rounded-2xl bg-foreground/[0.04] px-4 py-4 min-h-[64px] group active:scale-[0.99] transition-all hover:bg-foreground/[0.07]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-base select-none shrink-0" aria-hidden>🎂</span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug line-clamp-1">{headline}</p>
              <p className="text-xs text-muted-foreground/50 mt-0.5">{sub}</p>
            </div>
          </div>
          <svg
            className="w-4 h-4 text-muted-foreground/20 group-hover:text-muted-foreground/45 transition-colors shrink-0"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 18l6-6-6-6" />
          </svg>
        </TransitionLink>
      </div>
    </section>
  )
}
