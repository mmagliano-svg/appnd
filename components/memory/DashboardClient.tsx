'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from './CategoryBadge'
import { TagBadge } from './TagBadge'
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

export function DashboardClient({ memories, allTags }: DashboardClientProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeTags, setActiveTags] = useState<string[]>([])

  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        (m.description ?? '').toLowerCase().includes(q) ||
        (m.location_name ?? '').toLowerCase().includes(q)

      const matchesCategory = !activeCategory || m.category === activeCategory

      const matchesTags =
        activeTags.length === 0 ||
        activeTags.every((t) => m.tags.includes(t))

      return matchesSearch && matchesCategory && matchesTags
    })
  }, [memories, search, activeCategory, activeTags])

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const hasFilters = search || activeCategory || activeTags.length > 0

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <div className="py-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">I tuoi ricordi</h1>
          <Link href="/memories/new">
            <Button size="sm">+ Nuovo</Button>
          </Link>
        </div>

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca ricordi…"
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              !activeCategory
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-input hover:bg-accent'
            }`}
          >
            Tutti
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() =>
                setActiveCategory(
                  activeCategory === cat.value ? null : cat.value
                )
              }
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                activeCategory === cat.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-input hover:bg-accent'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {allTags.map((tag) => (
              <TagBadge
                key={tag}
                tag={tag}
                active={activeTags.includes(tag)}
                onClick={() => toggleTag(tag)}
              />
            ))}
          </div>
        )}

        {/* Reset filters */}
        {hasFilters && (
          <button
            onClick={() => {
              setSearch('')
              setActiveCategory(null)
              setActiveTags([])
            }}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            Azzera filtri
          </button>
        )}

        {/* Memory list */}
        {filteredMemories.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            {memories.length === 0 ? (
              <>
                <p className="text-4xl">🫧</p>
                <p className="text-muted-foreground text-sm">
                  Non hai ancora nessun ricordo.
                  <br />
                  Inizia creando il primo momento.
                </p>
                <Link href="/memories/new">
                  <Button className="mt-2">Crea il primo ricordo</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-3xl">🔍</p>
                <p className="text-muted-foreground text-sm">
                  Nessun ricordo trovato con questi filtri.
                </p>
              </>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredMemories.map((memory) => {
              const contributionCount = memory.memory_contributions?.length ?? 0
              return (
                <li key={memory.id}>
                  <Link href={`/memories/${memory.id}`}>
                    <div className="rounded-xl border bg-card p-4 hover:bg-accent transition-colors space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h2 className="font-medium text-sm leading-tight truncate">
                            {memory.title}
                          </h2>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(memory.happened_at)}
                            {memory.location_name && ` · ${memory.location_name}`}
                          </p>
                        </div>
                        {contributionCount > 0 && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {contributionCount} contribut{contributionCount === 1 ? 'o' : 'i'}
                          </span>
                        )}
                      </div>

                      {memory.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {memory.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {memory.category && (
                          <CategoryBadge category={memory.category} size="sm" />
                        )}
                        {memory.tags.slice(0, 3).map((tag) => (
                          <TagBadge key={tag} tag={tag} />
                        ))}
                        {memory.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{memory.tags.length - 3}
                          </span>
                        )}
                      </div>
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
