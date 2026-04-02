'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { SearchMemory } from '@/actions/explore'

interface ExploreSearchProps {
  memories: SearchMemory[]
}

export function ExploreSearch({ memories }: ExploreSearchProps) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return memories
      .filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.location_name?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 5)
  }, [memories, query])

  const isActive = query.trim().length > 0

  return (
    <div className="mb-8">
      {/* Input */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Cerca tra i tuoi ricordi"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-input bg-foreground/[0.04] pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground/35 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Results */}
      {isActive && (
        <div className="mt-1.5 space-y-0.5">
          {results.length > 0 ? (
            results.map((m) => (
              <Link
                key={m.id}
                href={`/memories/${m.id}`}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-foreground/[0.05] active:scale-[0.99] transition-all group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  {m.location_name && (
                    <p className="text-xs text-muted-foreground/50 truncate mt-0.5">
                      {m.location_name}
                    </p>
                  )}
                </div>
                <svg
                  className="w-4 h-4 text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors shrink-0"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))
          ) : (
            <p className="text-xs text-muted-foreground/40 px-3 pt-2">
              Nessun ricordo trovato.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
