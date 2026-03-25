'use client'

import Link from 'next/link'
import type { OnThisDayMemory } from '@/actions/memories'

interface Props {
  memories: OnThisDayMemory[]
  subtitle: string
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

export function OnThisDayCarousel({ memories, subtitle }: Props) {
  return (
    <section className="mb-2">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarIcon />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight leading-none">Rivivi oggi</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
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
