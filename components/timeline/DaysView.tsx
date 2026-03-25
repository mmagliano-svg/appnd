'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { TimelineEvent, TimelineDayGroup } from '@/actions/timeline'
import { setBackward } from './TimelinePageWrapper'

const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile',
  'Maggio', 'Giugno', 'Luglio', 'Agosto',
  'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

const DAYS_SHORT = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']

// ── Event card — with photo (hero layout) ─────────────────────────────────

function EventCardLarge({ event }: { event: TimelineEvent }) {
  return (
    <Link
      href={`/memories/${event.id}`}
      className="block rounded-2xl overflow-hidden bg-muted group active:scale-[0.99] transition-transform"
    >
      <div className="aspect-[16/9] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.previewUrl!}
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-4 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-base leading-snug line-clamp-2 flex-1">{event.title}</p>
          {event.isPeriod && (
            <span className="shrink-0 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60 border border-border rounded-full px-2 py-0.5 mt-0.5">
              Periodo
            </span>
          )}
        </div>
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}
        {event.location_name && (
          <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.location_name}
          </p>
        )}
      </div>
    </Link>
  )
}

// ── Period card — distinct visual treatment ────────────────────────────────

function PeriodCard({ event }: { event: TimelineEvent }) {
  return (
    <Link
      href={`/memories/${event.id}`}
      className="flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/50 active:scale-[0.99] transition-all group"
    >
      {/* Timeline accent bar */}
      <div className="w-1 self-stretch rounded-full bg-foreground/15 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
          Periodo
        </p>
        <p className="font-semibold text-sm leading-snug">{event.title}</p>
        {event.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{event.description}</p>
        )}
        {event.location_name && (
          <p className="text-xs text-muted-foreground/60 mt-1 truncate">{event.location_name}</p>
        )}
      </div>

      <svg
        className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 transition-colors"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

// ── Event card — compact (no photo, not period) ────────────────────────────

function EventCardCompact({ event }: { event: TimelineEvent }) {
  return (
    <Link
      href={`/memories/${event.id}`}
      className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 hover:bg-muted/70 active:scale-[0.99] transition-all group"
    >
      <div className="w-9 h-9 rounded-xl bg-muted shrink-0 flex items-center justify-center">
        <svg className="w-4 h-4 text-muted-foreground/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate leading-tight">{event.title}</p>
        {event.location_name && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.location_name}</p>
        )}
      </div>
      <svg
        className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 transition-colors"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────

interface Props {
  year: number
  month: number
  dayGroups: TimelineDayGroup[]
}

export function DaysView({ year, month, dayGroups }: Props) {
  const router = useRouter()

  function handleBack() {
    setBackward()
    router.back()
  }

  return (
    <div>
      {/* Breadcrumb */}
      <button
        onClick={handleBack}
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
        {MONTHS_IT[month - 1]}
      </h2>

      {dayGroups.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessun ricordo in questo mese.</p>
      ) : (
        <div className="space-y-10">
          {dayGroups.map(({ day, events }) => {
            const date = new Date(year, month - 1, day)
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
                  {events.map((ev) => {
                    if (ev.isPeriod) return <PeriodCard key={ev.id} event={ev} />
                    if (ev.previewUrl) return <EventCardLarge key={ev.id} event={ev} />
                    return <EventCardCompact key={ev.id} event={ev} />
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
