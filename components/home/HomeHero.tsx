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
        <div className="w-full aspect-[3/4] max-h-[62vh] rounded-3xl bg-muted flex flex-col items-center justify-center gap-4 text-center px-8">
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
        className="relative block w-full aspect-[3/4] max-h-[62vh] rounded-3xl overflow-hidden bg-muted"
        style={{ boxShadow: '0 20px 56px rgba(0,0,0,0.08)' }}
      >
        {memory.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={memory.previewUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover animate-hero-zoom"
            loading="eager"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900" />
        )}

        {/* Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, transparent 0%, transparent 35%, rgba(0,0,0,0.52) 65%, rgba(0,0,0,0.88) 100%)',
          }}
        />

        {/* Memory text */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-7 animate-hero-text">
          <p
            className="text-white font-medium text-[17px] leading-snug tracking-tight line-clamp-1"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.28)' }}
          >
            {memory.title}
          </p>
          <p
            className="text-white/60 text-[10px] mt-2 tracking-wide"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.22)' }}
          >
            {formatMemoryDate(memory.start_date, memory.end_date)}
            {memory.location_name && <span> · {memory.location_name}</span>}
          </p>
        </div>
      </Link>
    </div>
  )
}
