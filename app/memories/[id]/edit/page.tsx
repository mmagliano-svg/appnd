'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { updateMemory } from '@/actions/memories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CATEGORIES } from '@/lib/constants/categories'
import { TagInput } from '@/components/memory/TagInput'
import { createClient } from '@/lib/supabase/client'

export default function EditMemoryPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [allTags, setAllTags] = useState<string[]>([])

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('memories')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setTitle(data.title)
        setDate(data.happened_at)
        setLocation(data.location_name ?? '')
        setDescription(data.description ?? '')
        setCategory(data.category ?? '')
        setTags(data.tags ?? [])
      }
      setFetching(false)
    }

    load()
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await updateMemory({
        id,
        title,
        happened_at: date,
        location_name: location,
        description,
        category: category || undefined,
        tags,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto.')
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <main className="min-h-screen p-4 max-w-lg mx-auto flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Caricamento…</p>
      </main>
    )
  }

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
          <h1 className="text-2xl font-semibold tracking-tight">Modifica ricordo</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Cena al Baffo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="happened_at">Data *</Label>
            <Input
              id="happened_at"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={today}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_name">Luogo</Label>
            <Input
              id="location_name"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="es. Milano, Ristorante Baffo"
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value === category ? '' : cat.value)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors text-left ${
                    category === cat.value
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-input hover:bg-accent'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tag</Label>
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={allTags}
              placeholder="es. Luca, Parigi, Estate2025…"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Racconta brevemente questo momento…"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvataggio…' : 'Salva modifiche'}
          </Button>
        </form>
      </div>
    </main>
  )
}
