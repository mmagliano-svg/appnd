'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MonthSummary } from '@/actions/timeline'
import { setForward, setBackward } from './TimelinePageWrapper'

const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile',
  'Maggio', 'Giugno', 'Luglio', 'Agosto',
  'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

interface Props {
  year: number
  months: MonthSummary[]
}

export function MonthsView({ year, months }: Props) {
  const router = useRouter()

  function handleBack() {
    setBackward()
    router.back()
  }

  return (
    <div>
      {/* Breadcrumb / back */}
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
        Tutti gli anni
      </button>

      <h2 className="text-3xl font-bold tracking-tight mb-6">{year}</h2>

      {months.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessun ricordo in questo anno.</p>
      ) : (
        <div className="space-y-3">
          {months.map(({ month, totalCount, previewUrls }) => {
            const photoUrl = previewUrls[0] ?? null

            return (
              <Link
                key={month}
                href={`/timeline/${year}/${month}`}
                onClick={setForward}
                className="relative block w-full rounded-2xl overflow-hidden bg-muted group active:scale-[0.99] transition-transform"
                style={{ aspectRatio: '16 / 7' }}
              >
                {/* Photo background */}
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-muted-foreground/10 to-muted" />
                )}

                {/* Left-to-right gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />

                {/* Label */}
                <div className="absolute inset-0 flex items-center px-5">
                  <div>
                    <p className="text-white text-2xl font-bold tracking-tight leading-none">
                      {MONTHS_IT[month - 1]}
                    </p>
                    <p className="text-white/55 text-sm mt-1.5">
                      {totalCount} {totalCount === 1 ? 'momento' : 'momenti'}
                    </p>
                  </div>
                </div>

                {/* Chevron */}
                <div className="absolute right-4 inset-y-0 flex items-center">
                  <svg
                    className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
