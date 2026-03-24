'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createMemory, getAllUserTags } from '@/actions/memories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CATEGORIES } from '@/lib/constants/categories'
import { TagInput } from '@/components/memory/TagInput'

export default function NewMemoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [category, setCategory] = useState('')
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    getAllUserTags().then(setAllTags).catch(() => {})
  }, [])

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
        category: category || undefined,
        tags,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Qualcosa è andato storto. Riprova.')
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-16">
        <div className="pt-6 pb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Indietro
          </button>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Nuovo ricordo</h1>
          <p className="text-sm text-muted-foreground">
            Cattura il momento prima che sfugga.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titolo */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Titolo <span className="text-muted-foreground font-normal">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="Come chiami questo momento?"
              required
              autoFocus
              className="text-base"
            />
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="happened_at" className="text-sm font-medium">
              Quando è successo? <span className="text-muted-foreground font-normal">*</span>
            </Label>
            <Input
              id="happened_at"
              name="happened_at"
              type="date"
              max={today}
              required
            />
          </div>

          {/* Luogo */}
          <div className="space-y-2">
            <Label htmlFor="location_name" className="text-sm font-medium">
              Dove eravate?
            </Label>
            <Input
              id="location_name"
              name="location_name"
              placeholder="Es. Roma, Trastevere"
            />
          </div>

          {/* Categoria */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Capitolo della vita
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value === category ? '' : cat.value)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition-all text-left ${
                    category === cat.value
                      ? 'border-foreground bg-foreground text-background font-medium'
                      : 'border-border hover:border-foreground/30 hover:bg-accent/50'
                  }`}
                >
                  <span className="text-base">{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tag */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Connessioni
            </Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Persone, luoghi, temi — tutto ciò che collega questo momento agli altri.
            </p>
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={allTags}
              placeholder="Es. Luca, Sardegna, estate…"
            />
          </div>

          {/* Descrizione */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Il racconto
            </Label>
            <textarea
              id="description"
              name="description"
              placeholder="Cosa è successo? Come ti sei sentito? Cosa vuoi ricordare di questo momento…"
              rows={5}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none leading-relaxed"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full rounded-full py-6 text-base font-medium"
            disabled={loading}
          >
            {loading ? 'Salvataggio…' : 'Salva il ricordo'}
          </Button>
        </form>
      </div>
    </main>
  )
}
