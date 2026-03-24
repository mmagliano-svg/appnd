'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { updateMemory, getAllUserTags } from '@/actions/memories'
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
  const [memoryType, setMemoryType] = useState<'day' | 'period'>('day')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    getAllUserTags().then(setAllTags).catch(() => {})
  }, [])

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
        setStartDate(data.start_date ?? data.happened_at)
        setEndDate(data.end_date ?? '')
        setMemoryType(data.end_date ? 'period' : 'day')
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
        start_date: startDate,
        end_date: memoryType === 'period' ? endDate || undefined : undefined,
        location_name: location,
        description,
        category: category || undefined,
        tags,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Qualcosa è andato storto. Riprova.')
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Caricamento…</p>
      </main>
    )
  }

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
          <h1 className="text-3xl font-bold tracking-tight mb-1">Modifica ricordo</h1>
          <p className="text-sm text-muted-foreground">
            Aggiorna i dettagli di questo momento.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Titolo <span className="text-muted-foreground font-normal">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Come chiami questo momento?"
              required
              className="text-base"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm font-medium">
                {memoryType === 'period' ? 'Quanto è durato?' : 'Quando è successo?'}{' '}
                <span className="text-muted-foreground font-normal">*</span>
              </Label>
              <div className="flex rounded-lg border border-border overflow-hidden text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => { setMemoryType('day'); setEndDate('') }}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    memoryType === 'day'
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  Giorno
                </button>
                <button
                  type="button"
                  onClick={() => setMemoryType('period')}
                  className={`px-3 py-1.5 font-medium transition-colors border-l border-border ${
                    memoryType === 'period'
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  Periodo
                </button>
              </div>
            </div>

            {memoryType === 'day' ? (
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={today}
                required
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Dal</p>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={today}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Al</p>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={today}
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_name" className="text-sm font-medium">
              Dove eravate?
            </Label>
            <Input
              id="location_name"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Es. Roma, Trastevere"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Capitolo della vita</Label>
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

          <div className="space-y-2">
            <Label className="text-sm font-medium">Connessioni</Label>
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

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Il racconto
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            {loading ? 'Salvataggio…' : 'Salva le modifiche'}
          </Button>
        </form>
      </div>
    </main>
  )
}
