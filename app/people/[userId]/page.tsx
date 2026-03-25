import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getSharedMemoriesWithUser } from '@/actions/people'
import { getCategoryByValue } from '@/lib/constants/categories'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatYear(dateStr: string) {
  return new Date(dateStr).getFullYear()
}

function formatDayMonth(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
  })
}

function formatFirstDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  })
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function PersonPage({
  params,
}: {
  params: { userId: string }
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  if (params.userId === user.id) notFound()

  const result = await getSharedMemoriesWithUser(params.userId)
  if (!result) notFound()

  const { otherUser, memories, stats } = result
  const ini = initials(otherUser.displayName)

  // Group memories by year for the timeline
  const byYear = memories.reduce<Record<number, typeof memories>>((acc, m) => {
    const y = formatYear(m.start_date)
    if (!acc[y]) acc[y] = []
    acc[y].push(m)
    return acc
  }, {})
  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => a - b) // oldest first → read the arc

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-28">

        {/* ── Top bar ── */}
        <div className="px-4 pt-6 pb-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
        </div>

        {/* ── Hero ── */}
        <div className="px-4 pt-6 pb-8">
          <div className="flex items-center gap-4 mb-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center shrink-0">
              <span className="text-xl font-bold tracking-tight text-background">
                {ini}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                Noi &amp;
              </p>
              <h1 className="text-2xl font-bold tracking-tight leading-none">
                {otherUser.displayName}
              </h1>
            </div>
          </div>

          {/* Stats row */}
          {memories.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums leading-none">{stats.totalCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  moment{stats.totalCount === 1 ? 'o' : 'i'}
                </p>
              </div>
              {stats.firstDate && (
                <>
                  <div className="w-px h-8 bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground">Insieme dal</p>
                    <p className="text-sm font-semibold">{formatFirstDate(stats.firstDate)}</p>
                  </div>
                </>
              )}
              {stats.uniqueLocations > 0 && (
                <>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums leading-none">{stats.uniqueLocations}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      luogh{stats.uniqueLocations === 1 ? 'o' : 'i'}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Photo strip ── */}
        {stats.allPhotos.length > 0 && (
          <div
            className="flex gap-1.5 overflow-x-auto pb-2 px-4 mb-6"
            style={{ scrollbarWidth: 'none' }}
          >
            {stats.allPhotos.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt=""
                className="h-24 w-24 shrink-0 rounded-xl object-cover"
                loading="lazy"
                draggable={false}
              />
            ))}
          </div>
        )}

        {/* ── Timeline / Memory list ── */}
        <div className="px-4">
          {memories.length === 0 ? (
            /* Empty state */
            <div className="text-center py-20 space-y-4">
              <p className="text-4xl">🌱</p>
              <p className="text-base font-medium">Ancora tutto da scrivere.</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Non avete ancora ricordi condivisi. Crea un ricordo e invita{' '}
                {otherUser.displayName} a partecipare.
              </p>
              <Link
                href="/memories/new"
                className="inline-flex items-center gap-2 mt-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                Crea un ricordo
              </Link>
            </div>
          ) : (
            /* Timeline by year */
            <div className="space-y-10">
              {years.map((year) => (
                <div key={year}>
                  {/* Year label */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {year}
                    </span>
                    <div className="flex-1 border-t border-border/40" />
                  </div>

                  {/* Memories in this year */}
                  <div className="space-y-3">
                    {byYear[year].map((memory) => {
                      const catInfo = getCategoryByValue(memory.category)
                      return (
                        <Link
                          key={memory.id}
                          href={`/memories/${memory.id}`}
                          className="flex gap-3 rounded-2xl bg-muted/30 border border-border/40 hover:border-foreground/15 hover:bg-muted/50 transition-all group active:scale-[0.99] overflow-hidden"
                        >
                          {/* Photo thumbnail */}
                          <div className="w-24 shrink-0 self-stretch bg-muted overflow-hidden rounded-l-2xl">
                            {memory.previewUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={memory.previewUrl}
                                alt=""
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                                loading="lazy"
                                draggable={false}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 py-3.5 pr-4 min-w-0">
                            {/* Category + badges */}
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              {catInfo && (
                                <span className="text-xs text-muted-foreground">
                                  {catInfo.emoji} {catInfo.label}
                                </span>
                              )}
                              {memory.is_first_time && (
                                <span className="text-[9px] font-semibold rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400">
                                  ✦ Prima volta
                                </span>
                              )}
                              {memory.is_anniversary && (
                                <span className="text-[9px] font-semibold rounded-full bg-violet-50 border border-violet-200 px-1.5 py-0.5 text-violet-700 dark:bg-violet-950/40 dark:border-violet-800 dark:text-violet-400">
                                  ↺ Ricorrenza
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <p className="font-semibold text-sm leading-snug line-clamp-2 mb-1">
                              {memory.title}
                            </p>

                            {/* Date + location */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                              <span>{formatDayMonth(memory.start_date)}</span>
                              {memory.location_name && (
                                <>
                                  <span className="text-border">·</span>
                                  <span className="truncate">{memory.location_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Closing note */}
              <div className="text-center pt-4 pb-2">
                <p className="text-xs text-muted-foreground/50 italic">
                  {stats.totalCount === 1
                    ? 'Il primo di molti momenti insieme.'
                    : `${stats.totalCount} momenti scritti insieme.`}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
