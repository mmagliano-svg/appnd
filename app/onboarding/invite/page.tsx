'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getMemoryPeople, type SimplePerson } from '@/actions/persons'
import { createMemoryInvite } from '@/actions/invites'

interface InviteState {
  loading: boolean
  url: string | null
  copied: boolean
  error: string | null
}

function InviteForm() {
  const params = useSearchParams()
  const router = useRouter()

  const memoryId = params.get('memoryId') ?? ''

  const [people, setPeople] = useState<SimplePerson[]>([])
  const [fetching, setFetching] = useState(true)
  const [invites, setInvites] = useState<Record<string, InviteState>>({})
  const [anyInvited, setAnyInvited] = useState(false)

  useEffect(() => {
    if (!memoryId) return
    getMemoryPeople(memoryId)
      .then((list) => {
        setPeople(list)
        const init: Record<string, InviteState> = {}
        for (const p of list) {
          init[p.id] = { loading: false, url: null, copied: false, error: null }
        }
        setInvites(init)
      })
      .finally(() => setFetching(false))
  }, [memoryId])

  function setPersonState(id: string, patch: Partial<InviteState>) {
    setInvites((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  async function handleInvite(person: SimplePerson) {
    setPersonState(person.id, { loading: true, error: null })
    try {
      const { inviteUrl } = await createMemoryInvite(memoryId, person.id)
      setPersonState(person.id, { loading: false, url: inviteUrl })
      setAnyInvited(true)

      // Native share on mobile
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            url: inviteUrl,
            text: `Ho salvato un momento che abbiamo vissuto insieme 🤍\nAprilo qui: ${inviteUrl}`,
          })
        } catch {
          // User cancelled share — that's fine
        }
      }
    } catch (err) {
      setPersonState(person.id, {
        loading: false,
        error: err instanceof Error ? err.message : 'Errore. Riprova.',
      })
    }
  }

  async function handleCopy(id: string, url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setPersonState(id, { copied: true })
      setTimeout(() => setPersonState(id, { copied: false }), 2000)
    } catch {
      // Fallback: select text — handled silently
    }
  }

  if (fetching) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Caricamento…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-12">
        <div className="flex-1 flex flex-col justify-between">

          <div className="flex-1 flex flex-col gap-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">
                Invita
              </p>
              <h1 className="text-2xl font-bold leading-tight">
                Condividi il ricordo
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Ogni persona riceverà un link per aggiungere la sua versione.
              </p>
            </div>

            <div className="space-y-3">
              {people.map((person) => {
                const state = invites[person.id]
                if (!state) return null
                return (
                  <div
                    key={person.id}
                    className="rounded-2xl border border-border/50 bg-card px-4 py-4 space-y-3"
                  >
                    {/* Person row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-muted-foreground">
                            {person.name[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <span className="text-sm font-semibold truncate">
                          {person.name}
                        </span>
                      </div>

                      {!state.url && (
                        <button
                          onClick={() => handleInvite(person)}
                          disabled={state.loading}
                          className="shrink-0 rounded-full bg-foreground text-background px-4 py-1.5 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
                        >
                          {state.loading ? '…' : 'Invita'}
                        </button>
                      )}

                      {state.url && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          ✓ Link pronto
                        </span>
                      )}
                    </div>

                    {/* Copy row — shown after invite generated */}
                    {state.url && (
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={state.url}
                          className="flex-1 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground truncate focus:outline-none"
                        />
                        <button
                          onClick={() => handleCopy(person.id, state.url!)}
                          className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors"
                        >
                          {state.copied ? 'Copiato ✓' : 'Copia'}
                        </button>
                      </div>
                    )}

                    {state.error && (
                      <p className="text-xs text-destructive">{state.error}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-3 pt-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full rounded-full bg-foreground text-background py-4 text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              {anyInvited ? 'Vai alla dashboard' : 'Salta per ora'}
            </button>
          </div>

        </div>
      </div>
    </main>
  )
}

export default function InvitePage() {
  return (
    <Suspense>
      <InviteForm />
    </Suspense>
  )
}
