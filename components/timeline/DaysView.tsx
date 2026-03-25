'use client'

import Link from 'next/link'
import type { MonthGroup } from './TimelineClient'

const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile',
  'Maggio', 'Giugno', 'Luglio', 'Agosto',
  'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

const DAYS_SHORT = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']

interface Props {
  month: MonthGroup
  year: number
  onBack: () => void
}

export function DaysView({ month, year, onBack }: Props) {
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
        {year}
      </button>

      <h2 className="text-3xl font-bold tracking-tight mb-8">
        {MONTHS_IT[month.month - 1]}
      </h2>

      {/* Day groups */}
      <div className="space-y-10">
        {month.dayGroups.map(({ day, memories }) => {
          const date = new Date(year, month.month - 1, day)
          const dayLabel = DAYS_SHORT[date.getDay()]

          return (
            <div key={day}>
              {/* Day header */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-bold tabular-nums">{day}</span>
                <span className="text-sm text-muted-foreground">{dayLabel}</span>
              </div>

              {/* Memory cards */}
              <div className="space-y-2">
                {memories.map((m) => (
                  <Link
                    key={m.id}
                    href={`/memories/${m.id}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted/70 active:scale-[0.99] transition-all group"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
                      {m.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.previewUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate leading-tight">
                        {m.title}
                      </p>
                      {m.location_name && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {m.location_name}
                        </p>
                      )}
                      {m.end_date && (
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 uppercase tracking-wide">
                          Periodo
                        </p>
                      )}
                    </div>

                    {/* Chevron */}
                    <svg
                      className="w-4 h-4 text-muted-foreground/35 group-hover:text-muted-foreground shrink-0 transition-colors"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
