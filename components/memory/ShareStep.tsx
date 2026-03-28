'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMemoryInvite } from '@/actions/invites'

interface Person {
  id: string
  name: string
}

interface ShareStepProps {
  memoryId: string
  memoryTitle: string
  people: Person[]
}

type InviteState = { loading: boolean; url: string | null; copied: boolean; error: string | null }

export function ShareStep({ memoryId, memoryTitle, people }: ShareStepProps) {
  const router = useRouter()
  const [invites, setInvites] = useState<Record<string, InviteState>>({})

  async function handleInvite(personId: string, personName: string) {
    setInvites((prev) => ({ ...prev, [personId]: { loading: true, url: null, copied: false, error: null } }))

    let inviteUrl: string
    try {
      const result = await createMemoryInvite(memoryId, personId)
      inviteUrl = result.inviteUrl
    } catch (err) {
      setInvites((prev) => ({
        ...prev,
        [personId]: { loading: false, url: null, copied: false, error: err instanceof Error ? err.message : 'Errore imprevisto' },
      }))
      return
    }

    // Show fallback options immediately
    setInvites((prev) => ({ ...prev, [personId]: { loading: false, url: inviteUrl, copied: false, error: null } }))

    // Trigger native share sheet only on mobile (touch device or narrow screen)
    const isMobile =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || window.innerWidth < 768)

    if (isMobile && typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({ title: memoryTitle, text: `${personName}, ho salvato un momento che parla anche di te.`, url: inviteUrl })
        .catch(() => {})
    }
  }

  async function handleCopy(personId: string) {
    const url = invites[personId]?.url
    if (!url) return
    await navigator.clipboard.writeText(url).catch(() => {})
    setInvites((prev) => ({ ...prev, [personId]: { ...prev[personId], copied: true } }))
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-16">

        <div className="pt-6 pb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Questo ricordo parla anche di loro</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Invia a chi era con te — potranno aprire <span className="font-medium text-foreground">"{memoryTitle}"</span> e aggiungere la loro versione.
          </p>
        </div>

        <div className="space-y-3">
          {people.map((person) => {
            const state = invites[person.id]
            const hasUrl = Boolean(state?.url)
            const waText = encodeURIComponent(
              `${person.name}, ho salvato un momento della nostra storia 🤍\nAprilo qui: ${state?.url ?? ''}`,
            )
            const mailSubject = encodeURIComponent("C\u2019\u00e8 un ricordo che parla anche di te")
            const mailBody = encodeURIComponent(
              `Ciao ${person.name},\n\nho salvato un momento che ci riguarda su Appnd.\nEntra per vederlo — e per aggiungere la tua versione.\n\n${state?.url ?? ''}`,
            )

            return (
              <div key={person.id} className="rounded-2xl border border-border px-4 py-4 space-y-4">

                {/* Person row */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {person.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className="flex-1 text-sm font-semibold truncate">{person.name}</p>
                  {!hasUrl && (
                    <button
                      onClick={() => handleInvite(person.id, person.name)}
                      disabled={state?.loading}
                      className="shrink-0 rounded-full bg-foreground text-background px-4 py-1.5 text-sm font-medium disabled:opacity-50"
                    >
                      {state?.loading ? '…' : 'Aggiungi'}
                    </button>
                  )}
                </div>

                {state?.error && (
                  <p className="text-xs text-destructive">{state.error}</p>
                )}

                {/* Share options — revealed after link generation */}
                {hasUrl && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Invia il ricordo a {person.name}</p>
                    <div className="grid grid-cols-3 gap-2">

                      <a
                        href={`https://wa.me/?text=${waText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1.5 rounded-xl border border-border py-3.5 text-xs font-medium hover:bg-muted/40 transition-colors"
                      >
                        <span className="text-lg leading-none">💬</span>
                        WhatsApp
                      </a>

                      <button
                        onClick={() => handleCopy(person.id)}
                        className="flex flex-col items-center gap-1.5 rounded-xl border border-border py-3.5 text-xs font-medium hover:bg-muted/40 transition-colors"
                      >
                        <span className="text-lg leading-none">{state.copied ? '✓' : '🔗'}</span>
                        {state.copied ? 'Copiato' : 'Copia link'}
                      </button>

                      <a
                        href={`mailto:?subject=${mailSubject}&body=${mailBody}`}
                        className="flex flex-col items-center gap-1.5 rounded-xl border border-border py-3.5 text-xs font-medium hover:bg-muted/40 transition-colors"
                      >
                        <span className="text-lg leading-none">✉️</span>
                        Email
                      </a>

                    </div>
                  </div>
                )}

              </div>
            )
          })}
        </div>

        <button
          onClick={() => router.push(`/memories/${memoryId}`)}
          className="mt-8 flex items-center justify-center w-full rounded-full bg-foreground text-background py-4 text-base font-semibold"
        >
          Apri il ricordo →
        </button>

      </div>
    </main>
  )
}
