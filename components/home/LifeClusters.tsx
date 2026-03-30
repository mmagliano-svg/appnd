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

// Width cycle — organic variation. All values must be valid Tailwind widths.
const WIDTH_CYCLE = ['w-36', 'w-28', 'w-32', 'w-24', 'w-36', 'w-28'] as const

function ClusterCard({ item, index }: { item: ClusterItem; index: number }) {
  const isFirst = index === 0
  const w = isFirst ? 'w-40' : WIDTH_CYCLE[index % WIDTH_CYCLE.length]
  // First card taller for natural vertical tension in items-end row
  const aspect = isFirst ? 'aspect-[3/4]' : 'aspect-square'

  const imageEl = item.previewUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.previewUrl}
      alt=""
      className="w-full h-full object-cover"
      loading="lazy"
    />
  ) : (
    <div className="w-full h-full bg-muted/50" />
  )

  return (
    <Link
      href={item.href}
      className={[
        `flex flex-col shrink-0 ${w} gap-2`,
        'transition-[transform,opacity] duration-150 hover:scale-[1.015] hover:opacity-90 active:opacity-70',
      ].join(' ')}
    >
      <div className={`${aspect} rounded-2xl overflow-hidden`}>
        {imageEl}
      </div>
      <div className="px-0.5">
        <p className="text-[11px] font-medium truncate leading-tight text-foreground/75">
          {item.label}
        </p>
        <p className="text-[10px] text-muted-foreground/38 mt-0.5">
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
    <section className="space-y-4 pt-2">
      <p className="px-4 text-[10px] font-normal uppercase tracking-[0.18em] text-muted-foreground/38">
        I tuoi mondi
      </p>
      <div
        className="flex items-end gap-4 overflow-x-auto px-4 pb-3"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {all.map((item, i) => (
          <ClusterCard key={item.id + item.href} item={item} index={i} />
        ))}
      </div>
    </section>
  )
}
