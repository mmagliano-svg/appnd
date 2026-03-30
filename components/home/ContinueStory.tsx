import Link from 'next/link'
import { formatMemoryDate } from '@/lib/utils/dates'

export interface StoryMemory {
  id: string
  title: string
  start_date: string
  end_date: string | null
  previewUrl: string | null
}

interface ContinueStoryProps {
  memories: StoryMemory[]
}

export function ContinueStory({ memories }: ContinueStoryProps) {
  if (memories.length === 0) return null

  return (
    <section className="space-y-3 pt-2">
      <p className="px-4 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/50">
        Continua da qui
      </p>
      <div
        className="flex gap-4 overflow-x-auto px-4 pb-2 snap-x"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {memories.map((memory, i) => {
          // First card is slightly larger to break symmetry
          const isFirst = i === 0
          const cardClass = isFirst
            ? 'relative shrink-0 w-40 h-52 rounded-2xl overflow-hidden snap-start transition-opacity hover:opacity-80 active:opacity-70'
            : 'relative shrink-0 w-36 h-44 rounded-2xl overflow-hidden snap-start transition-opacity hover:opacity-80 active:opacity-70'

          return (
            <Link
              key={memory.id}
              href={`/memories/${memory.id}`}
              className={[
                cardClass,
                memory.previewUrl ? '' : 'bg-muted/60',
              ].join(' ')}
            >
              {memory.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={memory.previewUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900" />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.58) 100%)',
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-[11px] font-semibold leading-snug line-clamp-2">
                  {memory.title}
                </p>
                <p className="text-white/45 text-[10px] mt-0.5">
                  {formatMemoryDate(memory.start_date, memory.end_date)}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
