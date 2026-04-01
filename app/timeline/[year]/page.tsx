import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getYearStoryData } from '@/actions/timeline'
import { getYearHighlight } from '@/lib/utils/year-highlight'
import { formatMemoryDate } from '@/lib/utils/dates'

const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile',
  'Maggio', 'Giugno', 'Luglio', 'Agosto',
  'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

interface Props {
  params: { year: string }
}

export default async function YearStoryPage({ params }: Props) {
  const year = Number(params.year)
  if (!Number.isInteger(year) || year < 1900 || year > 2100) notFound()

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const memories = await getYearStoryData(year)
  if (memories.length === 0) notFound()

  // Best hero image — first memory with a photo
  const heroUrl = memories.find((m) => m.previewUrl)?.previewUrl ?? null

  // Year highlight phrase
  const highlight = getYearHighlight({
    count: memories.length,
    tags: memories.flatMap((m) => m.tags),
    categories: memories.flatMap((m) =>
      m.categories.length ? m.categories : m.category ? [m.category] : []
    ),
    titles: memories.map((m) => m.title),
    year,
  })

  // Group by month, descending
  const monthMap = new Map<number, typeof memories>()
  for (const m of memories) {
    const mo = parseInt(m.start_date.split('-')[1])
    if (!monthMap.has(mo)) monthMap.set(mo, [])
    monthMap.get(mo)!.push(m)
  }
  const monthGroups = Array.from(monthMap.entries()).sort(([a], [b]) => b - a)

  return (
    <main className="min-h-screen bg-background">

      {/* ── Hero ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: '75vh', minHeight: '420px', maxHeight: '680px' }}
      >
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ animation: 'yearHeroIn 0.6s ease-out both' }}
            loading="eager"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 to-neutral-500 dark:from-neutral-700 dark:to-neutral-900" />
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.92) 100%)',
          }}
        />

        {/* Back button — overlaid on hero */}
        <div className="absolute top-0 left-0 right-0 px-4 pt-6 z-10">
          <Link
            href="/timeline"
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
            Timeline
          </Link>
        </div>

        {/* Hero text — bottom-left */}
        <div className="absolute bottom-0 left-0 px-5 pb-8 z-10 animate-hero-text">
          <p className="text-5xl font-semibold text-white tracking-tight leading-none tabular-nums">
            {year}
          </p>
          <p className="text-sm text-white/75 mt-2 font-medium">
            {memories.length} {memories.length === 1 ? 'momento' : 'momenti'}
          </p>
          <p className="text-base font-medium text-white/90 mt-0.5 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
            {highlight}
          </p>
        </div>
      </div>

      {/* ── Transition block ── */}
      <div className="max-w-lg mx-auto px-4 mt-8 mb-3">
        <p className="text-sm tracking-wide uppercase text-foreground/60">Rivivi questo anno</p>
        <p className="text-xs text-muted-foreground mt-1">I momenti che lo hanno costruito</p>
      </div>

      {/* ── Memory list grouped by month ── */}
      <div className="max-w-lg mx-auto px-4 pb-32 space-y-10">
        {monthGroups.map(([month, mems]) => (
          <div key={month}>
            {/* Month label */}
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase mt-8 mb-4">
              {MONTHS_IT[month - 1]}
            </p>

            <div className="space-y-6">
              {mems.map((m) =>
                m.previewUrl ? (
                  /* ── Photo card ── */
                  <Link
                    key={m.id}
                    href={`/memories/${m.id}`}
                    className="block rounded-2xl overflow-hidden bg-muted active:scale-[0.99] transition-transform"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.previewUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 px-4 pb-4">
                        <p className="text-white text-base font-semibold leading-snug line-clamp-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
                          {m.title}
                        </p>
                      </div>
                    </div>
                    <div className="px-4 py-3 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatMemoryDate(m.start_date, null)}
                      </span>
                      {m.location_name && (
                        <>
                          <span className="text-muted-foreground/35">·</span>
                          <span className="text-xs text-muted-foreground/70 truncate">
                            {m.location_name}
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                ) : (
                  /* ── Text card ── */
                  <Link
                    key={m.id}
                    href={`/memories/${m.id}`}
                    className="block rounded-2xl bg-muted/50 border border-border/40 p-4 hover:bg-muted/80 active:scale-[0.99] transition-all"
                  >
                    <p className="text-sm font-medium text-foreground leading-snug">{m.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-muted-foreground">
                        {formatMemoryDate(m.start_date, null)}
                      </span>
                      {m.location_name && (
                        <>
                          <span className="text-muted-foreground/35">·</span>
                          <span className="text-sm text-muted-foreground truncate">
                            {m.location_name}
                          </span>
                        </>
                      )}
                    </div>
                    {m.description && (
                      <p className="text-xs text-muted-foreground/60 mt-1.5 line-clamp-2 leading-relaxed">
                        {m.description}
                      </p>
                    )}
                  </Link>
                )
              )}
            </div>
          </div>
        ))}

        {/* ── Add CTA ── */}
        <div className="mt-10">
          <Link
            href={`/memories/new?year=${year}`}
            className="flex items-center justify-between rounded-2xl border border-border/40 px-5 py-5 hover:bg-foreground/[0.03] active:scale-[0.99] transition-all group"
          >
            <div>
              <p className="text-xs text-muted-foreground/60 uppercase tracking-wide mb-1">Manca qualcosa?</p>
              <p className="text-sm font-medium text-foreground">Aggiungi un momento a questo anno</p>
            </div>
            <svg
              className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 transition-colors"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

    </main>
  )
}
