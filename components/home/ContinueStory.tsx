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
    <section className="pt-2 space-y-3">
      <div className="px-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
          Riprendi da qui
        </p>
      </div>
      <div
        className="overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div className="flex gap-3 snap-x px-4 w-max">
          {memories.map((memory) => (
            <Link
              key={memory.id}
              href={`/memories/${memory.id}`}
              className={[
                'relative shrink-0 w-36 h-44 rounded-2xl overflow-hidden snap-start',
                'transition-[transform,opacity] duration-200 hover:scale-[1.012] hover:opacity-90 active:opacity-70',
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
                  background: 'linear-gradient(to bottom, transparent 44%, rgba(0,0,0,0.52) 100%)',
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p
                  className="text-white/85 text-[11px] font-medium leading-snug line-clamp-2"
                  style={{ textShadow: '0 1px 6px rgba(0,0,0,0.22)' }}
                >
                  {memory.title}
                </p>
                <p className="text-white/50 text-[10px] mt-1">
                  {formatMemoryDate(memory.start_date, memory.end_date)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
