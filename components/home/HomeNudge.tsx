import { TransitionLink } from '@/components/ui/transition-link'
import type { HomeNudge as HomeNudgeData } from '@/actions/home'

interface HomeNudgeProps {
  nudge: HomeNudgeData
}

export function HomeNudge({ nudge }: HomeNudgeProps) {
  const card = (
    <div className="rounded-2xl bg-foreground/[0.04] px-4 py-3 group-hover:bg-foreground/[0.07] transition-colors">
      <p className="text-sm font-medium leading-snug">{nudge.title}</p>

      {nudge.subtitle && (
        <p className="text-xs text-muted-foreground/60 mt-0.5 leading-snug">
          {nudge.subtitle}
        </p>
      )}

      {nudge.cta && (
        <p className="text-xs text-muted-foreground/40 mt-2 group-hover:text-muted-foreground/60 transition-colors">
          {nudge.cta} →
        </p>
      )}
    </div>
  )

  if (nudge.href) {
    return (
      <section className="px-4 group">
        <TransitionLink href={nudge.href} className="block active:scale-[0.99] transition-transform">
          {card}
        </TransitionLink>
      </section>
    )
  }

  return <section className="px-4">{card}</section>
}
