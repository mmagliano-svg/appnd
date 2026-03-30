'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TriggerPage() {
  const router = useRouter()
  const [value, setValue] = useState('')

  function handleContinue() {
    const trimmed = value.trim()
    if (trimmed.length < 3) return
    sessionStorage.setItem('onboarding_title', trimmed)
    router.push('/onboarding/create')
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-12">
        <div className="flex-1 flex flex-col justify-between">

          <div className="flex-1 flex flex-col justify-center gap-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">
                Il tuo primo ricordo
              </p>
              <h1 className="text-3xl font-bold leading-tight">
                C&apos;è un momento che non vuoi dimenticare?
              </h1>
            </div>

            <div>
              <input
                autoFocus
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                placeholder="Scrivilo qui — anche una parola basta."
                className="w-full bg-transparent text-xl font-medium placeholder:text-muted-foreground/40 focus:outline-none border-b border-border pb-3 leading-snug"
              />
              <p className="text-xs text-muted-foreground/50 mt-3">
                Non deve essere perfetto. Potrai completarlo dopo.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleContinue}
              disabled={value.trim().length < 3}
              className="w-full rounded-full bg-foreground text-background py-4 text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continua
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Salta per ora
            </button>
          </div>

        </div>
      </div>
    </main>
  )
}
