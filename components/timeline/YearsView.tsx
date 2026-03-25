'use client'

import type { YearGroup } from './TimelineClient'

function plural(n: number) {
  return `${n} ${n === 1 ? 'momento' : 'momenti'}`
}

interface Props {
  yearGroups: YearGroup[]
  onSelectYear: (year: number) => void
}

function YearCard({
  year,
  totalCount,
  previewUrls,
  onClick,
}: {
  year: number
  totalCount: number
  previewUrls: string[]
  onClick: () => void
}) {
  const mainUrl = previewUrls[0] ?? null
  const secondaryUrls = previewUrls.slice(1, 3) // max 2

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden bg-muted group text-left focus:outline-none active:scale-[0.99] transition-transform"
    >
      {/* ── Photo collage ── */}
      {mainUrl === null ? (
        /* No photos — neutral with subtle year watermark */
        <div className="h-52 flex items-center justify-center bg-muted">
          <span className="text-8xl font-bold tracking-tight tabular-nums text-muted-foreground/12 select-none">
            {year}
          </span>
        </div>
      ) : secondaryUrls.length === 0 ? (
        /* Single photo — full width */
        <div className="h-52 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mainUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        /* Main + secondary column */
        <div className="flex gap-0.5 h-52">
          {/* Main photo — ~65% width */}
          <div className="flex-[1.8] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mainUrl}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
          {/* Secondary stack — ~35% width */}
          <div className="flex-none w-[88px] flex flex-col gap-0.5">
            {secondaryUrls.map((url, i) => (
              <div key={i} className="flex-1 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer: year + count + chevron ── */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <div>
          <p className="text-2xl font-bold tracking-tight tabular-nums leading-none">
            {year}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{plural(totalCount)}</p>
        </div>
        <svg
          className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
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
    <div className="space-y-4">
      {yearGroups.map(({ year, totalCount, previewUrls }) => (
        <YearCard
          key={year}
          year={year}
          totalCount={totalCount}
          previewUrls={previewUrls}
          onClick={() => onSelectYear(year)}
        />
      ))}
    </div>
  )
}
