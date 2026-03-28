import Link from 'next/link'

interface HomeStatsProps {
  momentCount: number
  chapterCount: number
  placeCount: number
  peopleCount: number
}

export function HomeStats({ momentCount, chapterCount, placeCount, peopleCount }: HomeStatsProps) {
  const items = [
    { value: momentCount, label: momentCount === 1 ? 'momento' : 'momenti', href: '/dashboard' },
    { value: chapterCount, label: chapterCount === 1 ? 'capitolo' : 'capitoli', href: '/timeline' },
    { value: placeCount, label: placeCount === 1 ? 'luogo' : 'luoghi', href: '/explore' },
    { value: peopleCount, label: peopleCount === 1 ? 'persona' : 'persone', href: '/people' },
  ]

  return (
    <div
      className="flex items-center px-4 overflow-x-auto"
      style={{ scrollbarWidth: 'none' } as React.CSSProperties}
    >
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center shrink-0">
          <Link
            href={item.href}
            className="flex items-baseline gap-1 px-2 py-1 rounded-lg hover:bg-muted transition-colors"
          >
            <span className="text-sm font-bold tabular-nums">{item.value}</span>
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </Link>
          {i < items.length - 1 && (
            <span className="text-muted-foreground/30 text-xs select-none">·</span>
          )}
        </div>
      ))}
    </div>
  )
}
