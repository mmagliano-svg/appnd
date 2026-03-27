'use client'

import { useState, useEffect, useRef } from 'react'
import { getPersonsSimple, createOrGetPerson } from '@/actions/persons'
import type { SimplePerson } from '@/actions/persons'

interface Props {
  onChange: (people: SimplePerson[]) => void
  initial?: SimplePerson[]
}

function PersonAvatar({ person, size = 'md' }: { person: SimplePerson; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'
  const ini = person.name.trim().slice(0, 2).toUpperCase()
  return (
    <div className={`${dim} rounded-full bg-foreground flex items-center justify-center shrink-0 overflow-hidden`}>
      {person.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.avatarUrl} alt={person.name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold tracking-tight text-background">{ini}</span>
      )}
    </div>
  )
}

export function PeopleSelector({ onChange, initial = [] }: Props) {
  const [selected, setSelected]     = useState<SimplePerson[]>(initial)
  const [allPersons, setAllPersons] = useState<SimplePerson[]>([])
  const [query, setQuery]           = useState('')
  const [open, setOpen]             = useState(false)
  const [creating, setCreating]     = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropRef  = useRef<HTMLDivElement>(null)

  // Load all persons for autocomplete on mount
  useEffect(() => {
    getPersonsSimple().then(setAllPersons).catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const trimmed = query.trim()

  const matches = trimmed.length >= 1
    ? allPersons.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmed.toLowerCase()) &&
          !selected.some((s) => s.id === p.id),
      )
    : allPersons.filter((p) => !selected.some((s) => s.id === p.id)).slice(0, 5)

  const isNew =
    trimmed.length > 0 &&
    !allPersons.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())

  function updateSelected(next: SimplePerson[]) {
    setSelected(next)
    onChange(next)
  }

  function addExisting(person: SimplePerson) {
    updateSelected([...selected, person])
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  async function createAndAdd() {
    if (!trimmed || creating) return
    setCreating(true)
    try {
      const person = await createOrGetPerson(trimmed)
      // add to local list so it appears in future autocomplete
      setAllPersons((prev) => [...prev, person].sort((a, b) => a.name.localeCompare(b.name)))
      updateSelected([...selected, person])
      setQuery('')
      setOpen(false)
    } catch {
      // silent — user can retry
    } finally {
      setCreating(false)
      inputRef.current?.focus()
    }
  }

  function remove(id: string) {
    updateSelected(selected.filter((p) => p.id !== id))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (matches.length > 0 && !isNew) {
        addExisting(matches[0])
      } else if (isNew) {
        createAndAdd()
      }
    }
    if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-2 rounded-full bg-foreground text-background pl-1.5 pr-3 py-1 text-sm font-medium"
            >
              <PersonAvatar person={p} size="sm" />
              {p.name}
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="ml-0.5 text-background/60 hover:text-background transition-colors leading-none"
                aria-label={`Rimuovi ${p.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input + dropdown */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="es. Lalli, Federico, Margherita…"
          autoComplete="off"
          className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {/* Dropdown */}
        {open && (matches.length > 0 || isNew) && (
          <div
            ref={dropRef}
            className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl border border-border bg-background shadow-xl z-20 overflow-hidden"
          >
            {matches.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addExisting(p) }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left transition-colors"
              >
                <PersonAvatar person={p} size="sm" />
                <span className="text-sm font-medium">{p.name}</span>
              </button>
            ))}

            {isNew && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); createAndAdd() }}
                disabled={creating}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left transition-colors border-t border-border disabled:opacity-50"
              >
                <div className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center shrink-0">
                  <span className="text-muted-foreground text-base leading-none">+</span>
                </div>
                <span className="text-sm">
                  {creating ? 'Aggiunta…' : (
                    <>Aggiungi <strong>&ldquo;{trimmed}&rdquo;</strong></>
                  )}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
