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
    <section className="space-y-3">
      <p className="px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
        Riprendi la storia
      </p>
      <div
        className="flex gap-3 overflow-x-auto px-4 pb-1 snap-x"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {memories.map((memory) => (
          <Link
            key={memory.id}
            href={`/memories/${memory.id}`}
            className="relative shrink-0 w-36 h-44 rounded-2xl overflow-hidden bg-muted snap-start"
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
              style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.72) 100%)' }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white text-xs font-semibold leading-snug line-clamp-2">
                {memory.title}
              </p>
              <p className="text-white/50 text-[10px] mt-0.5">
                {formatMemoryDate(memory.start_date, memory.end_date)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
