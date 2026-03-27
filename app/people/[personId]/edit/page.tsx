'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getPersonById, updatePerson } from '@/actions/persons'

export default function EditPersonPage() {
  const router = useRouter()
  const { personId } = useParams<{ personId: string }>()

  const [name, setName]               = useState('')
  const [relationLabel, setRelation]  = useState('')
  const [shortBio, setBio]            = useState('')
  const [fetching, setFetching]       = useState(true)
  const [error, setError]             = useState('')
  const [isPending, startTransition]  = useTransition()

  useEffect(() => {
    getPersonById(personId).then((p) => {
      if (!p) { router.replace('/people'); return }
      setName(p.name)
      setRelation(p.relationLabel ?? '')
      setBio(p.shortBio ?? '')
      setFetching(false)
    }).catch(() => router.replace('/people'))
  }, [personId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    startTransition(async () => {
      try {
        await updatePerson(personId, {
          name,
          relationLabel: relationLabel || null,
          shortBio: shortBio || null,
        })
        router.push(`/people/${personId}`)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore nel salvataggio.')
      }
    })
  }

  if (fetching) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Caricamento…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-16">

        {/* Header */}
        <div className="pt-6 pb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
            Indietro
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Modifica persona</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Queste informazioni sono visibili solo a te.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Nome *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Relation label */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Relazione
            </label>
            <input
              type="text"
              value={relationLabel}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="es. figlia, moglie, amico, collega…"
              className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Short bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Note
            </label>
            <textarea
              value={shortBio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Una riga su chi è questa persona per te…"
              rows={3}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
            />
          </div>

          {error && (
            <p className="text-sm text-rose-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={!name.trim() || isPending}
            className="w-full rounded-full bg-foreground text-background py-4 text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30"
          >
            {isPending ? 'Salvataggio…' : 'Salva'}
          </button>

        </form>
      </div>
    </main>
  )
}
