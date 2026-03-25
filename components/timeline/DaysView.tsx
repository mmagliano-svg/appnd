'use client'

import Link from 'next/link'
import type { MonthGroup } from './TimelineClient'
import type { TimelineMemory } from '@/actions/memories'

const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile',
  'Maggio', 'Giugno', 'Luglio', 'Agosto',
  'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

const DAYS_SHORT = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']

// ── Event card — large (photo present) ────────────────────────────────────

function EventCardLarge({ memory }: { memory: TimelineMemory }) {
  return (
    <Link
      href={`/memories/${memory.id}`}
      className="block rounded-2xl overflow-hidden bg-muted group active:scale-[0.99] transition-transform"
    >
      {/* Hero photo */}
      <div className="aspect-[16/9] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={memory.previewUrl!}
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      {/* Info */}
      <div className="p-4 space-y-1">
        <p className="font-semibold text-base leading-snug line-clamp-2">{memory.title}</p>
        {memory.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {memory.description}
          </p>
        )}
        {memory.location_name && (
          <p className="text-xs text-muted-foreground/70 flex items-center gap-1 pt-0.5">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {memory.location_name}
          </p>
        )}
        {memory.end_date && (
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest pt-0.5">
            Periodo
          </p>
        )}
      </div>
    </Link>
  )
}

// ── Event card — compact (no photo) ───────────────────────────────────────

function EventCardCompact({ memory }: { memory: TimelineMemory }) {
  return (
    <Link
      href={`/memories/${memory.id}`}
      className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 hover:bg-muted/70 active:scale-[0.99] transition-all group"
    >
      {/* Neutral placeholder dot */}
      <div className="w-10 h-10 rounded-xl bg-muted shrink-0 flex items-center justify-center">
        <svg className="w-4 h-4 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate leading-tight">{memory.title}</p>
        {memory.location_name && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{memory.location_name}</p>
        )}
        {memory.end_date && (
          <p className="text-[10px] text-muted-foreground/50 mt-0.5 uppercase tracking-widest">Periodo</p>
        )}
      </div>

      <svg
        className="w-4 h-4 text-muted-foreground/35 group-hover:text-muted-foreground shrink-0 transition-colors"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────

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
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold tabular-nums">{day}</span>
                <span className="text-sm text-muted-foreground capitalize">{dayLabel}</span>
              </div>

              {/* Events */}
              <div className="space-y-3">
                {memories.map((m) =>
                  m.previewUrl ? (
                    <EventCardLarge key={m.id} memory={m} />
                  ) : (
                    <EventCardCompact key={m.id} memory={m} />
                  )
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
