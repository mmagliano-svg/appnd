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

interface HomeHeroProps {
  memory: HeroMemory | null
  displayName: string
}

export function HomeHero({ memory, displayName }: HomeHeroProps) {
  if (!memory) {
    return (
      <div className="px-4">
        <div className="w-full aspect-[3/4] max-h-[72vh] rounded-3xl bg-muted flex flex-col items-center justify-center gap-4 text-center px-8">
          <span className="text-3xl text-muted-foreground/40 select-none">✦</span>
          <p className="text-base font-semibold text-muted-foreground/70 leading-snug">
            La tua storia inizia qui.
          </p>
          <Link
            href="/memories/new"
            className="mt-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Aggiungi il primo momento
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4">
      <Link
        href={`/memories/${memory.id}`}
        className="relative block w-full aspect-[3/4] max-h-[72vh] rounded-3xl overflow-hidden bg-muted"
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
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, transparent 30%, rgba(0,0,0,0.72) 100%)',
          }}
        />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-white font-bold text-2xl leading-snug tracking-tight line-clamp-2">
            {memory.title}
          </p>
          <p className="text-white/55 text-xs mt-1.5">
            {formatMemoryDate(memory.start_date, memory.end_date)}
            {memory.location_name && <span> · {memory.location_name}</span>}
          </p>
        </div>
      </Link>
    </div>
  )
}
