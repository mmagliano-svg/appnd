'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrGetPerson, setMemoryPeople } from '@/actions/persons'

interface ChipPerson {
  id: string
  name: string
}

export default function EnrichPage() {
  const router = useRouter()

  const [memoryId, setMemoryId] = useState('')
  const [input, setInput] = useState('')
  const [people, setPeople] = useState<ChipPerson[]>([])
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  // Hydrate from sessionStorage; redirect back if memoryId missing
  useEffect(() => {
    const storedId = sessionStorage.getItem('onboarding_memoryId') ?? ''
    if (!storedId) {
      router.replace('/onboarding')
      return
    }
    setMemoryId(storedId)
    setReady(true)
  }, [router])

  async function addPerson() {
    const name = input.trim()
    if (!name) return
    if (people.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setInput('')
      return
    }
    setAdding(true)
    setError('')
    try {
      const person = await createOrGetPerson(name)
      setPeople((prev) => [...prev, { id: person.id, name: person.name }])
      setInput('')
    } catch {
      setError('Impossibile aggiungere questa persona.')
    } finally {
      setAdding(false)
    }
  }

  function removePerson(id: string) {
    setPeople((prev) => prev.filter((p) => p.id !== id))
  }

  async function handleContinue() {
    setSaving(true)
    setError('')
    try {
      if (people.length > 0) {
        await setMemoryPeople(
          memoryId,
          people.map((p) => p.id),
        )
        sessionStorage.setItem('onboarding_people', JSON.stringify(people))
        router.push('/onboarding/collaborate')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Qualcosa è andato storto. Riprova.')
      setSaving(false)
    }
  }

  if (!ready) return null

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-12">
        <div className="flex-1 flex flex-col justify-between">

          <div className="flex-1 flex flex-col gap-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">
                Chi era con te in questo momento?
              </p>
              <h1 className="text-2xl font-bold leading-tight">
                Aggiungi le persone che erano lì
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Potrai invitarle ad aggiungere la loro versione.
              </p>
            </div>

            {/* Input row */}
            <div className="flex items-end gap-3">
              <input
                autoFocus
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !adding && addPerson()}
                placeholder="Nome di una persona…"
                className="flex-1 bg-transparent text-base placeholder:text-muted-foreground/40 focus:outline-none border-b border-border pb-2.5"
              />
              <button
                onClick={addPerson}
                disabled={!input.trim() || adding}
                className="text-sm font-semibold shrink-0 pb-2.5 disabled:text-muted-foreground/40"
              >
                {adding ? '…' : 'Aggiungi'}
              </button>
            </div>

            {/* Chips */}
            {people.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {people.map((p) => (
                  <span
                    key={p.id}
                    className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium"
                  >
                    {p.name}
                    <button
                      onClick={() => removePerson(p.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors leading-none"
                      aria-label={`Rimuovi ${p.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-3 pt-6">
            <button
              onClick={handleContinue}
              disabled={saving}
              className="w-full rounded-full bg-foreground text-background py-4 text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {saving ? '…' : people.length > 0 ? 'Continua' : 'Salta'}
            </button>
            {people.length > 0 && (
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Lo farò dopo
              </button>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}
