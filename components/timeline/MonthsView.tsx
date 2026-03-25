'use client'

import type { YearGroup } from './TimelineClient'

const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile',
  'Maggio', 'Giugno', 'Luglio', 'Agosto',
  'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

interface Props {
  year: YearGroup
  onSelectMonth: (month: number) => void
  onBack: () => void
}

export function MonthsView({ year, onSelectMonth, onBack }: Props) {
  return (
    <div>
      {/* Back nav */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8 hover:text-foreground transition-colors group"
      >
        <svg
          className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
        </svg>
        Tutti gli anni
      </button>

      <h2 className="text-3xl font-bold tracking-tight mb-8">{year.year}</h2>

      {/* Month grid */}
      <div className="grid grid-cols-2 gap-3">
        {year.monthGroups.map(({ month, totalCount, previewUrls }) => {
          const photoUrl = previewUrls[0] ?? null

          return (
            <button
              key={month}
              onClick={() => onSelectMonth(month)}
              className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-muted group text-left focus:outline-none"
            >
              {/* Photo or gradient fallback */}
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/15" />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Label */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-semibold leading-tight">
                  {MONTHS_IT[month - 1]}
                </p>
                <p className="text-white/55 text-xs mt-0.5">
                  {totalCount} {totalCount === 1 ? 'momento' : 'momenti'}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
