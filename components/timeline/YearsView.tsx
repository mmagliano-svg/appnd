'use client'

import Link from 'next/link'
import type { YearSummary } from '@/actions/timeline'
import { setForward } from './TimelinePageWrapper'

function plural(n: number) {
  return `${n} ${n === 1 ? 'momento' : 'momenti'}`
}

// ── Photo collage inside a card ────────────────────────────────────────────

function Collage({
  previewUrls,
  height,
  year,
}: {
  previewUrls: string[]
  height: string
  year: number
}) {
  const mainUrl = previewUrls[0] ?? null
  const secondaryUrls = previewUrls.slice(1, 3)

  if (!mainUrl) {
    return (
      <div className={`${height} flex items-center justify-center bg-muted`}>
        <span className="text-8xl font-bold tracking-tight tabular-nums text-muted-foreground/10 select-none">
          {year}
        </span>
      </div>
    )
  }

  if (secondaryUrls.length === 0) {
    return (
      <div className={`${height} overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mainUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
    )
  }

  return (
    <div className={`flex gap-0.5 ${height}`}>
      <div className="flex-[1.8] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mainUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="flex-none w-[88px] flex flex-col gap-0.5">
        {secondaryUrls.map((url, i) => (
          <div key={i} className="flex-1 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Year cards ─────────────────────────────────────────────────────────────

function YearCard({
  year,
  totalCount,
  previewUrls,
  hero,
}: YearSummary & { hero: boolean }) {
  const collageHeight = hero ? 'h-72' : 'h-44'
  const yearSize = hero ? 'text-3xl' : 'text-2xl'
  const countSize = hero ? 'text-sm mt-1.5' : 'text-xs mt-1'

  return (
    <Link
      href={`/timeline/${year}`}
      onClick={setForward}
      className="block w-full rounded-2xl overflow-hidden bg-muted group active:scale-[0.99] transition-transform"
    >
      <Collage previewUrls={previewUrls} height={collageHeight} year={year} />

      <div className="flex items-center justify-between px-4 py-3.5">
        <div>
          <p className={`font-bold tracking-tight tabular-nums leading-none ${yearSize}`}>{year}</p>
          <p className={`text-muted-foreground ${countSize}`}>{plural(totalCount)}</p>
        </div>
        <svg
          className="w-4 h-4 text-muted-foreground/35 group-hover:text-muted-foreground transition-colors"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

// ── View ──────────────────────────────────────────────────────────────────

interface Props {
  yearGroups: YearSummary[]
}

export function YearsView({ yearGroups }: Props) {
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
      {yearGroups.map((group, index) => (
        <YearCard key={group.year} {...group} hero={index === 0} />
      ))}
    </div>
  )
}
