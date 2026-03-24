'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CATEGORIES } from '@/lib/constants/categories'

interface Memory {
  id: string
  title: string
  happened_at: string
  location_name: string | null
  description: string | null
  category: string | null
  tags: string[]
  created_by: string
  created_at: string
  memory_contributions: { id: string }[]
}

interface DashboardClientProps {
  memories: Memory[]
  allTags: string[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  })
}

function getCategoryInfo(value: string | null) {
  if (!value) return null
  return CATEGORIES.find((c) => c.value === value) ?? null
}

export function DashboardClient({ memories, allTags }: DashboardClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(
    searchParams.get('category')
  )

  // Sync category filter to URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (activeCategory) params.set('category', activeCategory)
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : '/dashboard', { scroll: false })
  }, [activeCategory])

  // Categories actually used
  const usedCategories = useMemo(() => {
    const used = new Set(memories.map((m) => m.category).filter(Boolean))
    return CATEGORIES.filter((c) => used.has(c.value))
  }, [memories])

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

  // 3 most recent memories
  const recentMemories = useMemo(() => {
    return [...memories]
      .sort((a, b) => new Date(b.happened_at).getTime() - new Date(a.happened_at).getTime())
      .slice(0, 3)
  }, [memories])

  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        (m.description ?? '').toLowerCase().includes(q) ||
        (m.location_name ?? '').toLowerCase().includes(q) ||
        m.tags.some((t) => t.includes(q))
      const matchesCategory = !activeCategory || m.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [memories, search, activeCategory])

  function resetFilters() {
    setSearch('')
    setActiveCategory(null)
  }

  const hasFilters = !!(search || activeCategory)
  const showDiscovery = !hasFilters && memories.length > 0

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-16">

        {/* ── Header ── */}
        <div className="pt-10 pb-6">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-3xl font-bold tracking-tight">I tuoi ricordi</h1>
            <Link href="/memories/new">
              <Button size="sm" className="rounded-full px-4">+ Nuovo</Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            {memories.length === 0
              ? 'Il tuo libro dei momenti ti aspetta.'
              : `${memories.length} moment${memories.length === 1 ? 'o' : 'i'} custoditi`}
          </p>
        </div>

        {/* ── Empty state ── */}
        {memories.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="text-5xl mb-2">✦</div>
            <p className="text-lg font-medium">Inizia da un momento.</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Ogni ricordo costruisce la storia della tua vita. Inizia dal primo.
            </p>
            <Link href="/memories/new">
              <Button className="mt-2 rounded-full px-6">
                Aggiungi il primo momento
              </Button>
            </Link>
          </div>
        )}

        {/* ── DISCOVERY SECTIONS (no filters active) ── */}
        {showDiscovery && (
          <>
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
                        <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">
                          {memory.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {formatDateShort(memory.happened_at)}
                          </p>
                          {contribCount > 0 && (
                            <span className="text-xs text-muted-foreground/60">
                              {contribCount} contribut{contribCount === 1 ? 'o' : 'i'}
                            </span>
                          )}
                        </div>
                        {memory.location_name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>📍</span>
                            <span className="line-clamp-1">{memory.location_name}</span>
                          </p>
                        )}
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

            {/* 3 — Rivivi per capitoli */}
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
          <ul className="space-y-3">
            {filteredMemories.map((memory) => {
              const catInfo = getCategoryInfo(memory.category)
              return (
                <li key={memory.id}>
                  <Link href={`/memories/${memory.id}`} className="block group">
                    <div className="rounded-2xl border bg-card p-5 hover:border-foreground/20 transition-all hover:shadow-sm space-y-3">
                      {/* Top row: category + date */}
                      <div className="flex items-center justify-between gap-2">
                        {catInfo ? (
                          <span className="text-xs text-muted-foreground font-medium">
                            {catInfo.emoji} {catInfo.label}
                          </span>
                        ) : (
                          <span />
                        )}
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDate(memory.happened_at)}
                        </span>
                      </div>

                      {/* Title */}
                      <div>
                        <h2 className="font-semibold text-base leading-snug group-hover:text-foreground">
                          {memory.title}
                        </h2>
                        {memory.location_name && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <span>📍</span>
                            <span>{memory.location_name}</span>
                          </p>
                        )}
                      </div>

                      {/* Description preview */}
                      {memory.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {memory.description}
                        </p>
                      )}

                      {/* Tags */}
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
