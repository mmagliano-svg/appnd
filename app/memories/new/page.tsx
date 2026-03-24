'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createMemoryReturnId, getAllUserTags } from '@/actions/memories'
import { addMediaContribution } from '@/actions/contributions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CATEGORIES } from '@/lib/constants/categories'
import { TagInput } from '@/components/memory/TagInput'

export default function NewMemoryPage() {
  const router = useRouter()
  const titleRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [uploadStep, setUploadStep] = useState('')
  const [error, setError] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [category, setCategory] = useState('')
  const [allTags, setAllTags] = useState<string[]>([])

  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)

  useEffect(() => {
    getAllUserTags().then(setAllTags).catch(() => {})
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const isVideo = file.type.startsWith('video/')
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
    setMediaType(isVideo ? 'video' : 'image')
    setError('')

    // Auto-focus title after selecting media
    setTimeout(() => titleRef.current?.focus(), 100)
  }

  function clearMedia() {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUploadStep('')

    const form = new FormData(e.currentTarget)

    try {
      // 1 — Create memory (no redirect)
      setUploadStep('Creazione ricordo…')
      const memoryId = await createMemoryReturnId({
        title: form.get('title') as string,
        happened_at: form.get('happened_at') as string,
        location_name: form.get('location_name') as string,
        description: form.get('description') as string,
        category: category || undefined,
        tags,
      })

      // 2 — Upload media if present
      if (mediaFile) {
        setUploadStep('Caricamento foto…')
        const supabase = createClient()
        const ext = mediaFile.name.split('.').pop() ?? 'jpg'
        const path = `${memoryId}/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('memory-media')
          .upload(path, mediaFile, { upsert: false })

        if (uploadError) {
          // Memory was created — navigate anyway, media upload failed silently
          router.push(`/memories/${memoryId}`)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('memory-media')
          .getPublicUrl(path)

        // 3 — Save as contribution
        setUploadStep('Salvataggio…')
        await addMediaContribution(memoryId, publicUrl)
      }

      router.push(`/memories/${memoryId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Qualcosa è andato storto. Riprova.')
      setLoading(false)
      setUploadStep('')
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const hasMedia = Boolean(mediaFile)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-16">

        {/* Header */}
        <div className="pt-6 pb-6">
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
            {hasMedia ? 'Il momento è catturato. Dagli un nome.' : 'Cattura il momento prima che sfugga.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── MEDIA PICKER — in cima ── */}
          <div>
            {!mediaPreview ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-border hover:border-foreground/30 bg-muted/10 hover:bg-muted/20 transition-all flex flex-col items-center justify-center gap-3 py-10"
              >
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                  <svg className="w-7 h-7 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Cattura questo momento</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tocca per aggiungere una foto o video</p>
                </div>
              </button>
            ) : (
              <div className="relative">
                {mediaType === 'image' ? (
                  <img
                    src={mediaPreview}
                    alt="Anteprima"
                    className="w-full rounded-2xl object-cover max-h-80"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    className="w-full rounded-2xl max-h-80"
                    controls
                    playsInline
                  />
                )}
                <button
                  type="button"
                  onClick={clearMedia}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-sm hover:bg-black/80 transition-colors"
                  aria-label="Rimuovi media"
                >
                  ✕
                </button>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/mov,video/quicktime"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* ── TITOLO ── */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Titolo <span className="text-muted-foreground font-normal">*</span>
            </Label>
            <Input
              ref={titleRef}
              id="title"
              name="title"
              placeholder="Come chiami questo momento?"
              required
              autoFocus={!hasMedia}
              className="text-base"
            />
          </div>

          {/* ── DETTAGLI SECONDARI (meno prominenti se c'è media) ── */}
          <div className={`space-y-6 transition-opacity duration-300 ${hasMedia ? 'opacity-80' : ''}`}>

            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="happened_at" className="text-sm font-medium">
                Quando è successo? <span className="text-muted-foreground font-normal">*</span>
              </Label>
              <Input
                id="happened_at"
                name="happened_at"
                type="date"
                defaultValue={today}
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

            {/* Tag */}
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
            {loading ? (uploadStep || 'Salvataggio…') : 'Salva il ricordo'}
          </Button>

        </form>
      </div>
    </main>
  )
}
