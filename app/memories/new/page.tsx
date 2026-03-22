'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMemory } from '@/actions/memories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewMemoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)

    try {
      await createMemory({
        title: form.get('title') as string,
        happened_at: form.get('happened_at') as string,
        location_name: form.get('location_name') as string,
        description: form.get('description') as string,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto.')
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <div className="py-8 space-y-6">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground mb-4 block"
          >
            ← Indietro
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">Nuovo ricordo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cosa volete ricordare insieme?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo *</Label>
            <Input
              id="title"
              name="title"
              placeholder="es. Cena al Baffo"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="happened_at">Data *</Label>
            <Input
              id="happened_at"
              name="happened_at"
              type="date"
              max={today}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_name">Luogo</Label>
            <Input
              id="location_name"
              name="location_name"
              placeholder="es. Milano, Ristorante Baffo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <textarea
              id="description"
              name="description"
              placeholder="Racconta brevemente questo momento…"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvataggio…' : 'Crea ricordo'}
          </Button>
        </form>
      </div>
    </main>
  )
}
