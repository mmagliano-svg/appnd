import Link from 'next/link'
import type { HomeSharedMoment } from '@/actions/shared-memories'

interface Props {
  moments: HomeSharedMoment[]
}

export function SharedMoments({ moments }: Props) {
  if (moments.length === 0) return null

  return (
    <section className="px-4 space-y-3">
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/80">
        Momenti condivisi
      </p>
      <div className="space-y-2">
        {moments.map((m) => (
          <Link
            key={m.id}
            href={`/shared/${m.id}`}
            className="flex items-center justify-between rounded-2xl bg-foreground/[0.04] px-4 py-3 hover:bg-foreground/[0.07] transition-colors active:scale-[0.99]"
          >
            <p className="text-sm font-medium truncate pr-4">{m.title}</p>
            <p className="text-xs text-muted-foreground/55 shrink-0">
              {m.participant_count} persone · {m.contribution_count} ricord{m.contribution_count !== 1 ? 'i' : 'o'}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
