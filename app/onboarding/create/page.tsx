'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createMemoryReturnId } from '@/actions/memories'

function CreateForm() {
  const params = useSearchParams()
  const router = useRouter()

  const [title, setTitle] = useState(params.get('title') ?? '')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]

  async function handleSave() {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return
    setLoading(true)
    setError('')
    try {
      const memoryId = await createMemoryReturnId({
        title: trimmedTitle,
        start_date: date || today,
        location_name: location.trim() || undefined,
        categories: [],
        tags: [],
      })
      router.push(`/onboarding/enrich?memoryId=${memoryId}`)
    } catch {
      setError('Qualcosa è andato storto. Riprova.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-12">
        <div className="flex-1 flex flex-col justify-between">

          <div className="flex-1 flex flex-col gap-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">
                Il tuo primo ricordo
              </p>
              <h1 className="text-2xl font-bold leading-tight">
                Raccontaci di più
              </h1>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Titolo
              </label>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="Es. Cena con Marco a Roma"
                className="w-full bg-transparent text-lg font-medium placeholder:text-muted-foreground/40 focus:outline-none border-b border-border pb-2.5 leading-snug"
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quando?{' '}
                <span className="normal-case font-normal opacity-60">(opzionale)</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={today}
                className="w-full bg-transparent text-base text-foreground focus:outline-none border-b border-border pb-2.5"
              />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Dove?{' '}
                <span className="normal-case font-normal opacity-60">(opzionale)</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Es. Roma, casa di Luca…"
                className="w-full bg-transparent text-base placeholder:text-muted-foreground/40 focus:outline-none border-b border-border pb-2.5"
              />
            </div>
          </div>

          <div className="space-y-3 pt-6">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <button
              onClick={handleSave}
              disabled={!title.trim() || loading}
              className="w-full rounded-full bg-foreground text-background py-4 text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvataggio…' : 'Salva questo momento'}
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

export default function CreatePage() {
  return (
    <Suspense>
      <CreateForm />
    </Suspense>
  )
}
