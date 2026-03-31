'use client'

import Link from 'next/link'
import type { OnThisDayMemory } from '@/actions/memories'

interface Props {
  memories: OnThisDayMemory[]
  subtitle: string
}


export function OnThisDayCarousel({ memories, subtitle }: Props) {
  return (
    <section className="mb-2">
      {/* Header */}
      <div className="mb-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
          Rivivi oggi
        </p>
        <p className="text-xs text-muted-foreground/50 mt-0.5">{subtitle}</p>
      </div>

      {/* Carousel */}
      <div
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-4 px-4"
        style={{ scrollbarWidth: 'none' }}
      >
        {memories.map((memory) => {
          const year = memory.start_date.split('-')[0]

          return (
            <Link
              key={memory.id}
              href={`/memories/${memory.id}`}
              className="relative flex-none w-[78vw] max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden snap-start bg-muted group"
            >
              {/* Photo background */}
              {memory.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={memory.previewUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                /* Fallback — textured neutral bg */
                <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10" />
              )}

              {/* Gradient overlay — strong at bottom, light at top */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />

              {/* Year — top right, large and airy */}
              <div className="absolute top-4 right-4">
                <span className="text-white/90 text-4xl font-bold tracking-tight leading-none tabular-nums">
                  {year}
                </span>
              </div>

              {/* Title — bottom left */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white text-base font-semibold leading-snug line-clamp-2">
                  {memory.title}
                </p>
                {memory.end_date && (
                  <p className="text-white/55 text-xs mt-1 uppercase tracking-wide">Periodo</p>
                )}
              </div>
            </Link>
          )
        })}

        {/* Trailing spacer so last card snaps nicely on wide screens */}
        <div className="flex-none w-4 shrink-0" aria-hidden />
      </div>
    </section>
  )
}
