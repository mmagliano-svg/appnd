import Link from 'next/link'
import { formatMemoryDate } from '@/lib/utils/dates'

export interface SharedMemory {
  id: string
  title: string
  start_date: string
  end_date: string | null
  previewUrl: string | null
  sharedBy: string
}

interface SharedMemoriesProps {
  memories: SharedMemory[]
}

export function SharedMemories({ memories }: SharedMemoriesProps) {
  if (memories.length === 0) return null

  return (
    <section className="space-y-3 px-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
        Condivisi con te
      </p>
      <div className="space-y-2">
        {memories.map((memory) => (
          <Link
            key={memory.id}
            href={`/memories/${memory.id}`}
            className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card hover:border-foreground/20 hover:bg-accent/20 px-3 py-3 transition-all"
          >
            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
              {memory.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={memory.previewUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900" />
              )}
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{memory.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatMemoryDate(memory.start_date, memory.end_date)}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                da {memory.sharedBy}
              </p>
            </div>

            <svg
              className="w-4 h-4 text-muted-foreground/30 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  )
}
