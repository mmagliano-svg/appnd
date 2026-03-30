'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMemoryInvite } from '@/actions/invites'

interface StoredPerson {
  id: string
  name: string
}

interface InviteState {
  loading: boolean
  sent: boolean
  error: string | null
  url: string | null
}

export default function InvitePage() {
  const router = useRouter()

  const [memoryId, setMemoryId] = useState('')
  const [people, setPeople] = useState<StoredPerson[]>([])
  const [invites, setInvites] = useState<Record<string, InviteState>>({})
  const [anyInvited, setAnyInvited] = useState(false)
  const [ready, setReady] = useState(false)

  // Hydrate from sessionStorage; redirect if required data is missing
  useEffect(() => {
    const storedId = sessionStorage.getItem('onboarding_memoryId') ?? ''
    const storedPeople = sessionStorage.getItem('onboarding_people') ?? ''

    if (!storedId || !storedPeople) {
      router.replace('/onboarding')
      return
    }

    let parsed: StoredPerson[] = []
    try {
      parsed = JSON.parse(storedPeople) as StoredPerson[]
    } catch {
      router.replace('/onboarding')
      return
    }

    if (parsed.length === 0) {
      router.replace('/onboarding')
      return
    }

    const init: Record<string, InviteState> = {}
    for (const p of parsed) {
      init[p.id] = { loading: false, sent: false, error: null, url: null }
    }

    setMemoryId(storedId)
    setPeople(parsed)
    setInvites(init)
    setReady(true)
  }, [router])

  function setPersonState(id: string, patch: Partial<InviteState>) {
    setInvites((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  async function handleInvite(person: StoredPerson) {
    setPersonState(person.id, { loading: true, error: null })
    try {
      const { inviteUrl } = await createMemoryInvite(memoryId, person.id)
      setPersonState(person.id, { loading: false, sent: true, url: inviteUrl })
      setAnyInvited(true)

      // Native share on mobile — best-effort
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            url: inviteUrl,
            text: `Ho salvato un momento che abbiamo vissuto insieme 🤍\nAprilo qui: ${inviteUrl}`,
          })
        } catch {
          // User cancelled — that's fine
        }
      }
    } catch (err) {
      setPersonState(person.id, {
        loading: false,
        error: err instanceof Error ? err.message : 'Errore. Riprova.',
      })
    }
  }

  async function handleCopy(id: string) {
    const url = invites[id]?.url
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Silent fail — native share already attempted
    }
  }

  function handleDone() {
    // Clear onboarding state on exit
    sessionStorage.removeItem('onboarding_title')
    sessionStorage.removeItem('onboarding_memoryId')
    sessionStorage.removeItem('onboarding_people')
    router.push('/dashboard')
  }

  if (!ready) return null

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
                    className="rounded-2xl border border-border/50 bg-card px-4 py-4"
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

                      {!state.sent && (
                        <button
                          onClick={() => handleInvite(person)}
                          disabled={state.loading}
                          className="shrink-0 rounded-full bg-foreground text-background px-4 py-1.5 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
                        >
                          {state.loading ? '…' : 'Invita'}
                        </button>
                      )}
                    </div>

                    {/* Inline feedback after invite sent */}
                    {state.sent && (
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                          ✓ <span className="font-medium text-foreground">{person.name}</span>{' '}
                          riceverà il tuo invito
                        </p>
                        <button
                          onClick={() => handleCopy(person.id)}
                          className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Copia link
                        </button>
                      </div>
                    )}

                    {state.error && (
                      <p className="mt-2 text-xs text-destructive">{state.error}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-3 pt-6">
            <button
              onClick={handleDone}
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
