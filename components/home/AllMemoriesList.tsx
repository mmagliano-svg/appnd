'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatMemoryDate } from '@/lib/utils/dates'
import { getCategoryByValue } from '@/lib/constants/categories'

export interface ListMemory {
  id: string
  title: string
  start_date: string
  end_date: string | null
  location_name: string | null
  category: string | null
  categories: string[] | null
  previewUrl: string | null
}

interface AllMemoriesListProps {
  memories: ListMemory[]
}

export function AllMemoriesList({ memories }: AllMemoriesListProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return memories
    const q = search.toLowerCase()
    return memories.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.location_name?.toLowerCase().includes(q) ?? false),
    )
  }, [memories, search])

  return (
    <section className="px-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          Tutti i ricordi
        </p>
        <span className="text-xs text-muted-foreground">{memories.length}</span>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="search"
          placeholder="Cerca…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-input bg-muted/50 pl-9 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((memory) => {
          const cats =
            (memory.categories?.length ? memory.categories : null) ??
            (memory.category ? [memory.category] : [])
          const catInfo = getCategoryByValue(cats[0] ?? null)

          return (
            <Link
              key={memory.id}
              href={`/memories/${memory.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card hover:border-foreground/20 hover:bg-accent/20 px-3 py-3 transition-all"
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
                {memory.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={memory.previewUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xl">{catInfo?.emoji ?? '✦'}</span>
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                {catInfo && (
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    {catInfo.emoji} {catInfo.label}
                  </p>
                )}
                <p className="text-sm font-semibold truncate">{memory.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatMemoryDate(memory.start_date, memory.end_date)}
                  {memory.location_name && ` · ${memory.location_name}`}
                </p>
              </div>

              <svg
                className="w-4 h-4 text-muted-foreground/30 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">Nessun ricordo trovato.</p>
          </div>
        )}
      </div>
    </section>
  )
}
