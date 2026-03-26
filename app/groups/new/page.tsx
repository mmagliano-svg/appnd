'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGroup } from '@/actions/groups'
import { GROUP_TYPES } from '@/lib/constants/groups'
import Link from 'next/link'

export default function NewGroupPage() {
  const router = useRouter()
  const [name, setName]             = useState('')
  const [type, setType]             = useState('friends')
  const [isPending, startTransition] = useTransition()
  const [error, setError]           = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')

    startTransition(async () => {
      try {
        const groupId = await createGroup(name, type)
        router.push(`/groups/${groupId}?new=1`)
      } catch {
        setError('Impossibile creare il gruppo. Riprova.')
      }
    })
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-16">

        {/* Header */}
        <div className="pt-6 pb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Crea un gruppo</h1>
          <p className="text-sm text-muted-foreground">
            Un luogo dove raccogliere i momenti condivisi con queste persone.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Nome del gruppo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. La Squadra, Famiglia, Viaggio Giappone…"
              autoFocus
              required
              className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Type selector */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Tipo
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {GROUP_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border py-4 text-sm font-medium transition-all ${
                    type === t.value
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-foreground hover:border-foreground/30 hover:bg-accent/30'
                  }`}
                >
                  <span className="text-xl">{t.emoji}</span>
                  <span className={`text-xs ${type === t.value ? 'text-background' : 'text-muted-foreground'}`}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-rose-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={!name.trim() || isPending}
            className="w-full rounded-full bg-foreground text-background py-4 text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30"
          >
            {isPending ? 'Creazione…' : 'Crea gruppo →'}
          </button>

        </form>
      </div>
    </main>
  )
}
