import { TransitionLink } from '@/components/ui/transition-link'
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
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
          Continua dove eri rimasto
        </p>
      </div>
      <div
        className="overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div className="flex gap-3 snap-x px-4 w-max">
          {memories.map((memory, i) => {
            const isFirst = i === 0
            return (
              <TransitionLink
                key={memory.id}
                href={`/memories/${memory.id}`}
                className={[
                  'relative shrink-0 rounded-2xl overflow-hidden snap-start',
                  'transition-[transform,opacity] duration-200 hover:scale-[1.012] hover:opacity-90 active:opacity-70',
                  isFirst ? 'w-40 h-48' : 'w-36 h-44',
                  memory.previewUrl ? '' : 'bg-muted/60',
                ].join(' ')}
              >
                {memory.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={memory.previewUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={isFirst ? { filter: 'brightness(1.04) contrast(1.02)' } : undefined}
                    loading="lazy"
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900" />
                )}
                {/* Gradient overlay — matches hero/featured language */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />

                {/* Text — bottom-left, consistent hierarchy */}
                <div className="absolute bottom-0 left-0 px-4 pb-4 space-y-1">
                  <p className="text-white text-[12px] font-semibold leading-snug line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                    {memory.title}
                  </p>
                  <p className="text-white/80 text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                    {formatMemoryDate(memory.start_date, memory.end_date)}
                  </p>
                  <p className="text-white/80 text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Continua da qui</p>
                </div>
              </TransitionLink>
            )
          })}
        </div>
      </div>
    </section>
  )
}
