import Link from 'next/link'
import type { HomeSharedMoment } from '@/actions/shared-memories'

interface Props {
  moments: HomeSharedMoment[]
}

export function SharedMoments({ moments }: Props) {
  if (!moments || moments.length === 0) return null

  return (
    <section className="space-y-3">
      <p className="px-4 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
        Cose che stanno succedendo
      </p>
      <div
        className="flex gap-3 overflow-x-auto px-4 pb-1"
        style={{ scrollbarWidth: 'none' } as React.CSSProperties}
      >
        {moments.map((item) => (
          <Link
            key={item.id}
            href={`/shared/${item.id}`}
            className="min-w-[220px] shrink-0 rounded-2xl bg-foreground/[0.08] px-4 py-4 hover:bg-foreground/[0.11] transition-colors active:scale-[0.99]"
          >
            <div className="text-xs text-muted-foreground/60 mb-1">
              Aggiornato di recente
            </div>
            <div className="text-base font-semibold leading-snug line-clamp-2">
              {item.title}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
