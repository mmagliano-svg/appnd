'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CATEGORIES } from '@/lib/constants/categories'
import { formatMemoryDate, formatMemoryDateShort, formatPeriodDisplay } from '@/lib/utils/dates'
import { getRandomQuote } from '@/lib/memory-quotes'
import type { PersonSummary } from '@/actions/people'

interface Memory {
  id: string
  title: string
  start_date: string
  end_date: string | null
  parent_period_id: string | null
  location_name: string | null
  description: string | null
  category: string | null
  categories: string[]
  tags: string[]
  is_anniversary: boolean
  is_first_time: boolean
  created_by: string
  created_at: string
  memory_contributions: { id: string }[]
}

interface DashboardClientProps {
  memories: Memory[]
  allTags: string[]
  people: PersonSummary[]
  currentUser: { displayName: string }
}

function getCategoryInfo(value: string | null) {
  if (!value) return null
  return CATEGORIES.find((c) => c.value === value) ?? null
}

export function DashboardClient({ memories, allTags, people, currentUser }: DashboardClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(
    searchParams.get('category')
  )
  // Stable random quote per session — stable because useState initializer runs once
  const [quote] = useState(() => getRandomQuote())

  // Sync category filter to URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (activeCategory) params.set('category', activeCategory)
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : '/dashboard', { scroll: false })
  }, [activeCategory])

  // Split memories into periods (have end_date) and events (no end_date)
  const periods = useMemo(() => memories.filter((m) => Boolean(m.end_date)), [memories])
  const events  = useMemo(() => memories.filter((m) => !m.end_date), [memories])

  // Insights per period (computed from events in date range)
  const periodInsightsMap = useMemo(() => {
    const map: Record<string, { total: number; mostActiveYear: number | null; connections: string[] }> = {}

    for (const period of periods) {
      const effectiveEnd =
        period.end_date && period.end_date >= '9999-01-01'
          ? new Date().toISOString().split('T')[0]
          : period.end_date ?? new Date().toISOString().split('T')[0]

      const matched = events.filter(
        (e) => e.start_date >= period.start_date && e.start_date <= effectiveEnd
      )

      // Most active year
      let mostActiveYear: number | null = null
      if (matched.length > 0) {
        const yearCounts: Record<number, number> = {}
        for (const e of matched) {
          const y = parseInt(e.start_date.split('-')[0])
          yearCounts[y] = (yearCounts[y] ?? 0) + 1
        }
        mostActiveYear = parseInt(Object.entries(yearCounts).sort(([, a], [, b]) => b - a)[0][0])
      }

      // Top connections: tags + places
      const tagCounts: Record<string, number> = {}
      const placeCounts: Record<string, number> = {}
      for (const e of matched) {
        for (const t of e.tags) tagCounts[t] = (tagCounts[t] ?? 0) + 1
        if (e.location_name?.trim()) {
          const loc = e.location_name.trim()
          placeCounts[loc] = (placeCounts[loc] ?? 0) + 1
        }
      }
      const topTags = Object.entries(tagCounts).sort(([, a], [, b]) => b - a).slice(0, 2).map(([t]) => t)
      const topPlaces = Object.entries(placeCounts).sort(([, a], [, b]) => b - a).slice(0, 1).map(([p]) => p)
      const connections = [...topTags, ...topPlaces].slice(0, 3)

      map[period.id] = { total: matched.length, mostActiveYear, connections }
    }
    return map
  }, [periods, events])

  // Categories actually used (events only — periods have their own section)
  const usedCategories = useMemo(() => {
    const used = new Set(events.flatMap((m) => m.categories.length ? m.categories : (m.category ? [m.category] : [])))
    return CATEGORIES.filter((c) => used.has(c.value))
  }, [events])

  // Tag frequency map
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const m of memories) {
      for (const t of m.tags) {
        counts[t] = (counts[t] ?? 0) + 1
      }
    }
    return counts
  }, [memories])

  // Top 6 tags by frequency
  const topTags = useMemo(() => {
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }))
  }, [tagCounts])

  // Top places by frequency
  const topPlaces = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const m of memories) {
      if (m.location_name?.trim()) {
        const loc = m.location_name.trim()
        counts[loc] = (counts[loc] ?? 0) + 1
      }
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([place, count]) => ({ place, count }))
  }, [memories])

  // Period lookup map: id → { title, start_date, end_date }
  const periodMap = useMemo(() => {
    const map = new Map<string, { id: string; title: string; start_date: string; end_date: string }>()
    for (const m of periods) {
      map.set(m.id, { id: m.id, title: m.title, start_date: m.start_date, end_date: m.end_date! })
    }
    return map
  }, [periods])

  // Anniversaries that fall on today (same day + month, any year)
  const todayAnniversaries = useMemo(() => {
    const today = new Date()
    const todayMonth = today.getMonth()
    const todayDay = today.getDate()
    return memories.filter((m) => {
      if (!m.is_anniversary) return false
      // Force noon to avoid UTC offset edge cases
      const d = new Date(m.start_date + 'T12:00:00')
      return d.getMonth() === todayMonth && d.getDate() === todayDay
    })
  }, [memories])

  // 3 most recent events
  const recentMemories = useMemo(() => {
    return [...events]
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
      .slice(0, 3)
  }, [events])

  const filteredMemories = useMemo(() => {
    return events.filter((m) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        (m.description ?? '').toLowerCase().includes(q) ||
        (m.location_name ?? '').toLowerCase().includes(q) ||
        m.tags.some((t) => t.includes(q))
      const memCats = m.categories.length ? m.categories : (m.category ? [m.category] : [])
      const matchesCategory = !activeCategory || memCats.includes(activeCategory)
      return matchesSearch && matchesCategory
    })
  }, [events, search, activeCategory])

  function resetFilters() {
    setSearch('')
    setActiveCategory(null)
  }

  const hasFilters = !!(search || activeCategory)
  const showDiscovery = !hasFilters && (events.length > 0 || periods.length > 0)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-28">

        {/* ── Header ── */}
        <div className="pt-10 pb-6">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-3xl font-bold tracking-tight">I tuoi ricordi</h1>
            <div className="flex items-center gap-2">
              <Link href="/memories/new">
                <Button size="sm" className="rounded-full px-4">+ Nuovo</Button>
              </Link>
              {/* Avatar — links to profile */}
              <Link
                href="/profile"
                className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center hover:opacity-75 transition-opacity shrink-0"
                aria-label="Profilo"
              >
                <span className="text-[11px] font-bold tracking-tight text-background">
                  {(() => {
                    const n = currentUser.displayName.trim()
                    const parts = n.split(/\s+/)
                    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
                    return n.slice(0, 2).toUpperCase() || '?'
                  })()}
                </span>
              </Link>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {events.length === 0 && periods.length === 0
              ? 'Il tuo libro dei momenti ti aspetta.'
              : `${events.length} moment${events.length === 1 ? 'o' : 'i'} custoditi`}
          </p>
        </div>

        {/* ── Rivivi oggi — anniversari che cadono oggi ── */}
        {todayAnniversaries.length > 0 && (
          <div className="mb-8 rounded-2xl border border-violet-200 bg-violet-50/40 dark:border-violet-800/50 dark:bg-violet-950/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">↺</span>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                Rivivi oggi
              </p>
            </div>
            <div className="space-y-2">
              {todayAnniversaries.map((memory) => {
                const yearsAgo = new Date().getFullYear() - new Date(memory.start_date + 'T12:00:00').getFullYear()
                return (
                  <Link
                    key={memory.id}
                    href={`/memories/${memory.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-background/70 border border-violet-100 dark:border-violet-800/30 px-4 py-3 hover:border-violet-300 dark:hover:border-violet-600 transition-all group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors truncate">
                        {memory.title}
                      </p>
                      {yearsAgo > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {yearsAgo} ann{yearsAgo === 1 ? 'o' : 'i'} fa
                          {memory.location_name && ` · ${memory.location_name}`}
                        </p>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Onboarding / Empty state ── */}
        {memories.length === 0 && (
          <div className="py-12 space-y-10">

            {/* Quote del giorno */}
            <div className="max-w-sm mx-auto text-center space-y-2 px-2">
              <p className="text-4xl leading-none text-muted-foreground/20 font-serif select-none">"</p>
              <p className="text-sm font-medium leading-relaxed text-foreground/75 italic">
                {quote.text}
              </p>
              <p className="text-xs text-muted-foreground/60">— {quote.author}</p>
            </div>

            {/* Divisore */}
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-border/40" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/40">
                Come funziona
              </span>
              <div className="flex-1 border-t border-border/40" />
            </div>

            {/* 3 step */}
            <div className="space-y-5">
              {[
                {
                  icon: '✦',
                  title: 'Crea un ricordo',
                  desc: 'Titolo, data, foto, luogo. Anche solo un titolo basta per iniziare.',
                },
                {
                  icon: '↗',
                  title: 'Invita chi c\'era',
                  desc: 'Manda un link via email. Non serve che abbiano già un account.',
                },
                {
                  icon: '◎',
                  title: 'Co-costruitelo insieme',
                  desc: 'Ognuno aggiunge la propria prospettiva. Il ricordo si arricchisce.',
                },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-base shrink-0 mt-0.5">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-snug">{step.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center pt-2">
              <Link href="/memories/new">
                <Button className="rounded-full px-8 py-5 text-base">
                  Crea il tuo primo ricordo
                </Button>
              </Link>
            </div>

          </div>
        )}

        {/* ── DISCOVERY SECTIONS (no filters active) ── */}
        {showDiscovery && (
          <>
            {/* 0 — Capitoli della tua vita */}
            {periods.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Capitoli della tua vita
                </p>
                <div className="space-y-2">
                  {[...periods]
                    .sort((a, b) => b.start_date.localeCompare(a.start_date))
                    .map((period) => {
                      const ins = periodInsightsMap[period.id] ?? { total: 0, mostActiveYear: null, connections: [] }
                      return (
                        <Link
                          key={period.id}
                          href={`/memories/${period.id}`}
                          className="block rounded-2xl border border-border/40 bg-neutral-50 dark:bg-neutral-900/50 hover:border-foreground/20 hover:bg-neutral-100 dark:hover:bg-neutral-900 px-5 py-5 transition-all group"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40 mb-2">
                            Capitolo
                          </p>
                          <p className="font-bold text-xl leading-tight mb-1 line-clamp-2 group-hover:opacity-80 transition-opacity">
                            {period.title}
                          </p>
                          {period.description && (
                            <p className="text-sm text-muted-foreground/60 leading-snug line-clamp-1 mb-2">
                              {period.description}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-muted-foreground tabular-nums mt-2">
                            {formatPeriodDisplay(period.start_date, period.end_date!)}
                          </p>
                          {ins.total > 0 && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 pt-3 border-t border-border/25">
                              <span className="text-xs font-semibold text-foreground/60">
                                {ins.total} {ins.total === 1 ? 'momento' : 'momenti'}
                              </span>
                              {ins.mostActiveYear !== null && ins.total > 2 && (
                                <span className="text-xs text-muted-foreground/50">
                                  Più attivo: {ins.mostActiveYear}
                                </span>
                              )}
                              {ins.connections.length > 0 && (
                                <span className="text-xs text-muted-foreground/50">
                                  Con: {ins.connections.join(', ')}
                                </span>
                              )}
                            </div>
                          )}
                        </Link>
                      )
                    })}
                </div>
              </div>
            )}

            {/* 1 — Con chi */}
            {people.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Con chi
                </p>
                <div
                  className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {people.map((person) => {
                    const parts = person.displayName.trim().split(/\s+/)
                    const ini = parts.length >= 2
                      ? (parts[0][0] + parts[1][0]).toUpperCase()
                      : person.displayName.slice(0, 2).toUpperCase()
                    const firstName = parts[0]

                    return (
                      <Link
                        key={person.userId}
                        href={`/people/${person.userId}`}
                        className="flex-none flex flex-col items-center gap-2 group"
                      >
                        <div className="w-14 h-14 rounded-full bg-foreground flex items-center justify-center group-hover:opacity-80 transition-opacity">
                          <span className="text-lg font-bold tracking-tight text-background">
                            {ini}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium leading-none">{firstName}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {person.sharedCount} moment{person.sharedCount === 1 ? 'o' : 'i'}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 1 — Riprendi da qui */}
            <div className="mb-8">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Riprendi da qui
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
                {recentMemories.map((memory) => {
                  const catInfo = getCategoryInfo(memory.category)
                  const contribCount = memory.memory_contributions.length
                  return (
                    <Link
                      key={memory.id}
                      href={`/memories/${memory.id}`}
                      className="flex-none w-52 snap-start"
                    >
                      <div className="rounded-2xl border bg-card p-4 h-full min-h-[120px] hover:border-foreground/20 hover:shadow-sm transition-all space-y-2.5">
                        {catInfo ? (
                          <span className="text-xs text-muted-foreground">
                            {catInfo.emoji} {catInfo.label}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}

                        {memory.end_date ? (
                          // Periodo — date prominenti nella card piccola
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
                              Periodo
                            </p>
                            <p className="text-sm font-bold tracking-tight leading-tight text-foreground">
                              {formatPeriodDisplay(memory.start_date, memory.end_date)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {formatMemoryDateShort(memory.start_date, null)}
                          </p>
                        )}

                        <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">
                          {memory.title}
                        </h3>

                        <div className="flex items-center justify-between">
                          {memory.location_name ? (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <span>📍</span>
                              <span className="line-clamp-1">{memory.location_name}</span>
                            </p>
                          ) : <span />}
                          {contribCount > 0 && (
                            <span className="text-xs text-muted-foreground/60 shrink-0">
                              {contribCount} contribut{contribCount === 1 ? 'o' : 'i'}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* 2 — Connessioni che contano */}
            {topTags.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Connessioni che contano
                </p>
                <div className="flex gap-2 flex-wrap">
                  {topTags.map(({ tag, count }) => (
                    <Link
                      key={tag}
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-border bg-card hover:border-foreground/30 hover:bg-accent/20 transition-all"
                    >
                      <span className="text-foreground">#{tag}</span>
                      <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 leading-none">
                        {count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 3 — Luoghi che hai vissuto */}
            {topPlaces.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Luoghi che hai vissuto
                </p>
                <div className="space-y-1.5">
                  {topPlaces.map(({ place, count }) => (
                    <Link
                      key={place}
                      href={`/places/${encodeURIComponent(place)}`}
                      className="flex items-center justify-between rounded-xl px-4 py-3 border border-border bg-card hover:border-foreground/20 hover:bg-accent/20 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-medium">{place}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {count} moment{count === 1 ? 'o' : 'i'}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 4 — Rivivi per capitoli */}
            {usedCategories.length > 1 && (
              <div className="mb-8">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Rivivi per capitoli
                </p>
                <div className="flex gap-2 flex-wrap">
                  {usedCategories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setActiveCategory(cat.value)}
                      className="rounded-full px-4 py-2 text-sm font-medium border border-border bg-card hover:border-foreground/30 hover:bg-accent/20 transition-all"
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Divider before full list */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 border-t border-border/50" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tutti i ricordi
              </span>
              <div className="flex-1 border-t border-border/50" />
            </div>
          </>
        )}

        {/* ── Search (always visible, more prominent when filters active) ── */}
        <div className={`relative mb-4 ${hasFilters ? '' : 'opacity-70 focus-within:opacity-100 transition-opacity'}`}>
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca tra i tuoi ricordi…"
            className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category filter chips (shown when filters active) */}
        {hasFilters && usedCategories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                !activeCategory
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              Tutti
            </button>
            {usedCategories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(activeCategory === cat.value ? null : cat.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                  activeCategory === cat.value
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Active filter summary */}
        {hasFilters && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground">
              {filteredMemories.length} risultat{filteredMemories.length === 1 ? 'o' : 'i'}
              {activeCategory && ` in ${getCategoryInfo(activeCategory)?.label}`}
            </span>
            <button
              onClick={resetFilters}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Azzera filtri
            </button>
          </div>
        )}

        {/* ── Memory list ── */}
        {filteredMemories.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            {memories.length === 0 ? null : (
              <>
                <div className="text-4xl mb-2">○</div>
                <p className="text-base font-medium">Nessun risultato</p>
                <p className="text-sm text-muted-foreground">
                  Nessun ricordo corrisponde ai filtri selezionati.
                </p>
                <button
                  onClick={resetFilters}
                  className="text-sm text-foreground underline underline-offset-2"
                >
                  Rimuovi i filtri
                </button>
              </>
            )}
          </div>
        ) : (
          <ul className="space-y-0">
            {filteredMemories.map((memory) => {
              const catInfo = getCategoryInfo(memory.category)

              /* ── EVENTO — card classica ── */
              const parentPeriod = memory.parent_period_id ? periodMap.get(memory.parent_period_id) : null
              const memCatsDisplay = memory.categories.length ? memory.categories : (memory.category ? [memory.category] : [])
              return (
                <li key={memory.id} className="mb-3">
                  <Link href={`/memories/${memory.id}`} className="block group">
                    <div className="rounded-2xl border bg-card p-5 hover:border-foreground/20 transition-all hover:shadow-sm space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        {memCatsDisplay.length > 0 ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            {memCatsDisplay.slice(0, 2).map((cv) => {
                              const ci = getCategoryInfo(cv)
                              return ci ? (
                                <span key={cv} className="text-xs text-muted-foreground font-medium">
                                  {ci.emoji} {ci.label}
                                </span>
                              ) : null
                            })}
                            {memCatsDisplay.length > 2 && (
                              <span className="text-xs text-muted-foreground/50">+{memCatsDisplay.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span />
                        )}
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatMemoryDate(memory.start_date, null)}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-start gap-2">
                          <h2 className="font-semibold text-base leading-snug group-hover:text-foreground flex-1">
                            {memory.title}
                          </h2>
                          <div className="flex gap-1 shrink-0 mt-0.5">
                            {memory.is_first_time && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400">
                                ✦ Prima volta
                              </span>
                            )}
                            {memory.is_anniversary && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 border border-violet-200 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-950/40 dark:border-violet-800 dark:text-violet-400">
                                ↺ Ricorrenza
                              </span>
                            )}
                          </div>
                        </div>
                        {memory.location_name && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <span>📍</span>
                            <span>{memory.location_name}</span>
                          </p>
                        )}
                      </div>

                      {parentPeriod && (
                        <p className="text-xs text-muted-foreground/60 flex items-center gap-1">
                          <span>↳</span>
                          <span>{parentPeriod.title}</span>
                          <span className="text-muted-foreground/40 mx-0.5">·</span>
                          <span>{formatPeriodDisplay(parentPeriod.start_date, parentPeriod.end_date)}</span>
                        </p>
                      )}

                      {memory.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {memory.description}
                        </p>
                      )}

                      {memory.tags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {memory.tags.slice(0, 5).map((tag) => (
                            <Link
                              key={tag}
                              href={`/tags/${encodeURIComponent(tag)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                            >
                              #{tag}
                            </Link>
                          ))}
                          {memory.tags.length > 5 && (
                            <span className="text-xs text-muted-foreground self-center">
                              +{memory.tags.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
