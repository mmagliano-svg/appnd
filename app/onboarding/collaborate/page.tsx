'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function CollaborateForm() {
  const params = useSearchParams()
  const router = useRouter()

  const memoryId = params.get('memoryId') ?? ''
  const firstName = params.get('firstName') ?? 'questa persona'
  const peopleParam = params.get('people') ?? ''

  function handleInvite() {
    router.push(
      `/onboarding/invite?memoryId=${memoryId}&people=${encodeURIComponent(peopleParam)}`,
    )
  }

  function handleSkip() {
    router.push('/dashboard')
  }

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

export default function CollaboratePage() {
  return (
    <Suspense>
      <CollaborateForm />
    </Suspense>
  )
}
