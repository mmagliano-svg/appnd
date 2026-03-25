'use client'

import type { YearGroup } from './TimelineClient'

function plural(n: number) {
  return `${n} ${n === 1 ? 'momento' : 'momenti'}`
}

function ChevronRight({ dim }: { dim?: boolean }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 transition-colors ${dim ? 'text-muted-foreground/35 group-hover:text-muted-foreground' : 'text-white/50 group-hover:text-white/90'}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
    </svg>
  )
}

// ── Hero card (most recent year) ───────────────────────────────────────────

function HeroYearCard({
  year, totalCount, previewUrls, onClick,
}: YearGroup & { onClick: () => void }) {
  const mainUrl = previewUrls[0] ?? null
  const secondaryUrls = previewUrls.slice(1, 3)

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden bg-muted group text-left focus:outline-none active:scale-[0.99] transition-transform"
    >
      {/* Collage */}
      {mainUrl === null ? (
        <div className="h-72 flex items-center justify-center bg-muted">
          <span className="text-9xl font-bold tracking-tight tabular-nums text-muted-foreground/10 select-none">
            {year}
          </span>
        </div>
      ) : secondaryUrls.length === 0 ? (
        <div className="h-72 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mainUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </div>
      ) : (
        <div className="flex gap-0.5 h-72">
          <div className="flex-[1.8] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mainUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          </div>
          <div className="flex-none w-[96px] flex flex-col gap-0.5">
            {secondaryUrls.map((url, i) => (
              <div key={i} className="flex-1 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <p className="text-3xl font-bold tracking-tight tabular-nums leading-none">{year}</p>
          <p className="text-sm text-muted-foreground mt-1.5">{plural(totalCount)}</p>
        </div>
        <ChevronRight dim />
      </div>
    </button>
  )
}

// ── Compact card (older years) ─────────────────────────────────────────────

function CompactYearCard({
  year, totalCount, previewUrls, onClick,
}: YearGroup & { onClick: () => void }) {
  const mainUrl = previewUrls[0] ?? null
  const secondaryUrls = previewUrls.slice(1, 3)

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden bg-muted group text-left focus:outline-none active:scale-[0.99] transition-transform"
    >
      {/* Collage */}
      {mainUrl === null ? (
        <div className="h-44 flex items-center justify-center bg-muted">
          <span className="text-7xl font-bold tracking-tight tabular-nums text-muted-foreground/10 select-none">
            {year}
          </span>
        </div>
      ) : secondaryUrls.length === 0 ? (
        <div className="h-44 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mainUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </div>
      ) : (
        <div className="flex gap-0.5 h-44">
          <div className="flex-[1.8] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mainUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          </div>
          <div className="flex-none w-[80px] flex flex-col gap-0.5">
            {secondaryUrls.map((url, i) => (
              <div key={i} className="flex-1 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-2xl font-bold tracking-tight tabular-nums leading-none">{year}</p>
          <p className="text-xs text-muted-foreground mt-1">{plural(totalCount)}</p>
        </div>
        <ChevronRight dim />
      </div>
    </button>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────

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
    <div className="space-y-3">
      {yearGroups.map((group, index) =>
        index === 0 ? (
          <HeroYearCard key={group.year} {...group} onClick={() => onSelectYear(group.year)} />
        ) : (
          <CompactYearCard key={group.year} {...group} onClick={() => onSelectYear(group.year)} />
        )
      )}
    </div>
  )
}
