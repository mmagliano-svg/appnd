import Link from 'next/link'

export interface ClusterItem {
  id: string
  label: string
  count: number
  href: string
  previewUrl: string | null
}

interface LifeClustersProps {
  people: ClusterItem[]
  places: ClusterItem[]
  chapters: ClusterItem[]
}

function ClusterCard({ item }: { item: ClusterItem }) {
  const hasImage = Boolean(item.previewUrl)

  return (
    <Link
      href={item.href}
      className={[
        'flex flex-col shrink-0 w-28 rounded-2xl overflow-hidden transition-opacity hover:opacity-80 active:opacity-70',
        hasImage ? '' : 'bg-muted/60',
      ].join(' ')}
    >
      <div className="aspect-square overflow-hidden">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.previewUrl!}
            alt=""
            className="w-full h-full object-cover rounded-2xl"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900" />
        )}
      </div>
      <div className="px-1 pt-2 pb-1">
        <p className="text-xs font-semibold truncate">{item.label}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          {item.count} moment{item.count !== 1 ? 'i' : 'o'}
        </p>
      </div>
    </Link>
  )
}

export function LifeClusters({ people, places, chapters }: LifeClustersProps) {
  const all = [...people, ...places, ...chapters]
  if (all.length === 0) return null

  return (
    <section className="space-y-3">
      <p className="px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
        La tua vita
      </p>
      <div
        className="flex gap-3 overflow-x-auto px-4 pb-1"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {all.map((item) => (
          <ClusterCard key={item.id + item.href} item={item} />
        ))}
      </div>
    </section>
  )
}
