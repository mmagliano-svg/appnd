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
  return (
    <Link
      href={item.href}
      className="flex flex-col shrink-0 w-32 gap-2 transition-[transform,opacity] duration-200 hover:scale-[1.012] hover:opacity-90 active:opacity-70"
    >
      <div className="aspect-square rounded-2xl overflow-hidden">
        {item.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.previewUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted/50" />
        )}
      </div>
      <div className="px-0.5">
        <p className="text-[11px] font-medium truncate leading-tight text-foreground/60">
          {item.label}
        </p>
        <p className="text-[10px] text-muted-foreground/50 mt-0.5">
          {item.count} moment{item.count !== 1 ? 'i' : 'o'}
        </p>
      </div>
    </Link>
  )
}

export function LifeClusters({ people, places, chapters }: LifeClustersProps) {
  const all = [...people, ...places, ...chapters].filter(
    (item) => item.previewUrl !== null || item.count > 0,
  )

  if (all.length === 0) return null

  return (
    <section className="pt-2 space-y-3">
      <p className="px-4 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
        I tuoi mondi
      </p>
      <div
        className="overflow-x-auto pb-3"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div className="flex gap-3 px-4 w-max">
          {all.map((item) => (
            <ClusterCard key={item.id + item.href} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
