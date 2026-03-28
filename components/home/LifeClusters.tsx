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
      className="flex flex-col rounded-2xl border border-border/50 bg-card hover:border-foreground/20 hover:bg-accent/20 overflow-hidden transition-all"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {item.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.previewUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900" />
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-semibold truncate">{item.label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {item.count} moment{item.count !== 1 ? 'i' : 'o'}
        </p>
      </div>
    </Link>
  )
}

interface ClusterGroupProps {
  title: string
  items: ClusterItem[]
  seeAllHref: string
}

function ClusterGroup({ title, items, seeAllHref }: ClusterGroupProps) {
  if (items.length === 0) return null
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          {title}
        </p>
        <Link
          href={seeAllHref}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Tutti
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.slice(0, 3).map((item) => (
          <ClusterCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

export function LifeClusters({ people, places, chapters }: LifeClustersProps) {
  if (people.length === 0 && places.length === 0 && chapters.length === 0) return null

  return (
    <section className="px-4 space-y-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
        La tua vita
      </p>
      <ClusterGroup title="Persone" items={people} seeAllHref="/people" />
      <ClusterGroup title="Luoghi" items={places} seeAllHref="/explore" />
      <ClusterGroup title="Capitoli" items={chapters} seeAllHref="/timeline" />
    </section>
  )
}
