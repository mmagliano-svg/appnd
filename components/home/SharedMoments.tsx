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
        Questo momento continua
      </p>
      <div
        className="flex gap-3 overflow-x-auto px-4 pb-1"
        style={{ scrollbarWidth: 'none' } as React.CSSProperties}
      >
        {moments.map((item) => (
          <Link
            key={item.id}
            href={`/shared/${item.id}`}
            className="min-w-[180px] shrink-0 rounded-xl bg-foreground/[0.04] p-3 hover:bg-foreground/[0.07] transition-colors active:scale-[0.99]"
          >
            <p className="text-xs text-muted-foreground/60 mb-1 truncate">
              {item.signal}
            </p>
            <p className="text-sm font-medium leading-snug line-clamp-2">
              {item.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
