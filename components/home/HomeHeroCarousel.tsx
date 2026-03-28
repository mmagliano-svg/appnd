import Link from 'next/link'
import { formatMemoryDate } from '@/lib/utils/dates'

export interface HeroMemory {
  id: string
  title: string
  start_date: string
  end_date: string | null
  location_name: string | null
  previewUrl: string | null
}

interface HomeHeroCarouselProps {
  memories: HeroMemory[]
}

export function HomeHeroCarousel({ memories }: HomeHeroCarouselProps) {
  if (memories.length === 0) return null

  return (
    <div
      className="flex overflow-x-auto gap-3 px-4 pb-1 snap-x snap-mandatory"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      {memories.map((memory) => (
        <Link
          key={memory.id}
          href={`/memories/${memory.id}`}
          className="relative shrink-0 w-[78vw] max-w-[320px] aspect-[3/4] rounded-3xl overflow-hidden snap-start bg-muted"
        >
          {memory.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={memory.previewUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900" />
          )}

          {/* Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 30%, rgba(0,0,0,0.72) 100%)',
            }}
          />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-white font-bold text-xl leading-snug tracking-tight line-clamp-2">
              {memory.title}
            </p>
            <p className="text-white/55 text-xs mt-1.5">
              {formatMemoryDate(memory.start_date, memory.end_date)}
              {memory.location_name && (
                <span> · {memory.location_name}</span>
              )}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
