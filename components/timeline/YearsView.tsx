'use client'

import type { YearGroup } from './TimelineClient'

function plural(n: number) {
  return `${n} ${n === 1 ? 'momento' : 'momenti'}`
}

interface Props {
  yearGroups: YearGroup[]
  onSelectYear: (year: number) => void
}

export function YearsView({ yearGroups, onSelectYear }: Props) {
  if (yearGroups.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">
          Nessun ricordo ancora. Inizia ad aggiungerne uno.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border/40">
      {yearGroups.map(({ year, totalCount, previewUrls }) => (
        <button
          key={year}
          onClick={() => onSelectYear(year)}
          className="w-full flex items-center gap-4 py-7 -mx-4 px-4 hover:bg-accent/20 active:bg-accent/40 transition-colors group text-left"
        >
          {/* Year + count */}
          <div className="flex-none w-24">
            <p className="text-5xl font-bold tracking-tight tabular-nums leading-none">
              {year}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{plural(totalCount)}</p>
          </div>

          {/* Photo strip */}
          <div className="flex-1 flex items-center justify-end gap-1.5 overflow-hidden">
            {previewUrls.length > 0
              ? previewUrls.slice(0, 3).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover shrink-0 opacity-85 group-hover:opacity-100 transition-opacity"
                  />
                ))
              : Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-14 h-14 rounded-xl bg-muted shrink-0"
                  />
                ))}
          </div>

          {/* Chevron */}
          <svg
            className="w-4 h-4 text-muted-foreground/35 group-hover:text-muted-foreground shrink-0 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ))}
    </div>
  )
}
