'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface StoredPerson {
  id: string
  name: string
}

export default function CollaboratePage() {
  const router = useRouter()

  const [memoryTitle, setMemoryTitle] = useState('')
  const [firstName, setFirstName] = useState('')
  const [ready, setReady] = useState(false)

  // Hydrate from sessionStorage; redirect if required data is missing
  useEffect(() => {
    const storedId = sessionStorage.getItem('onboarding_memoryId') ?? ''
    const storedTitle = sessionStorage.getItem('onboarding_title') ?? ''
    const storedPeople = sessionStorage.getItem('onboarding_people') ?? ''

    if (!storedId || !storedPeople) {
      router.replace('/onboarding')
      return
    }

    let people: StoredPerson[] = []
    try {
      people = JSON.parse(storedPeople) as StoredPerson[]
    } catch {
      router.replace('/onboarding')
      return
    }

    if (people.length === 0) {
      router.replace('/onboarding')
      return
    }

    setMemoryTitle(storedTitle)
    setFirstName(people[0].name)
    setReady(true)
  }, [router])

  function handleInvite() {
    router.push('/onboarding/invite')
  }

  function handleSkip() {
    router.push('/dashboard')
  }

  if (!ready) return null

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-12">
        <div className="flex-1 flex flex-col justify-between">

          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="w-12 h-1 rounded-full bg-foreground" />

            <h1 className="text-3xl font-bold leading-tight">
              Anche{' '}
              <span className="italic">{firstName}</span>{' '}
              era lì.
            </h1>

            <p className="text-base text-muted-foreground leading-relaxed">
              I ricordi condivisi appartengono a tutti quelli che li hanno
              vissuti. Vuoi invitare{' '}
              <strong>{firstName}</strong> ad aggiungere la sua versione?
            </p>

            {/* Preview block */}
            <div className="rounded-2xl border border-border/50 bg-card px-4 py-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-base leading-none mt-0.5">👤</span>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                    Tu
                  </p>
                  <p className="text-sm font-medium">{memoryTitle}</p>
                </div>
              </div>
              <div className="border-t border-border/40" />
              <div className="flex items-start gap-3">
                <span className="text-base leading-none mt-0.5">👤</span>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                    {firstName}
                  </p>
                  <p className="text-sm text-muted-foreground italic">
                    Non ha ancora raccontato questo momento
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleInvite}
              className="w-full rounded-full bg-foreground text-background py-4 text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Invita {firstName}
            </button>
            <button
              onClick={handleSkip}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Lo farò dopo
            </button>
          </div>

        </div>
      </div>
    </main>
  )
}
