'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createContribution } from '@/actions/contributions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { ContentType } from '@/lib/supabase/types'

type TabType = 'text' | 'photo' | 'note'

const TABS: { type: TabType; label: string; emoji: string }[] = [
  { type: 'text', label: 'Racconto', emoji: '✍️' },
  { type: 'photo', label: 'Foto', emoji: '📷' },
  { type: 'note', label: 'Nota', emoji: '📌' },
]

export default function ContributePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [tab, setTab] = useState<TabType>('text')
  const [text, setText] = useState('')
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError('')
  }

  function clearPhoto() {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canSubmit =
    tab === 'photo' ? Boolean(file) : text.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setError('')

    try {
      let mediaUrl: string | undefined

      if (tab === 'photo' && file) {
        setUploadProgress('Caricamento foto…')
        const supabase = createClient()
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${params.id}/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('memory-media')
          .upload(path, file, { upsert: false })

        if (uploadError) {
          throw new Error('Errore durante il caricamento della foto. Riprova.')
        }

        const { data: { publicUrl } } = supabase.storage
          .from('memory-media')
          .getPublicUrl(path)

        mediaUrl = publicUrl
        setUploadProgress('Salvataggio…')
      }

      await createContribution({
        memoryId: params.id,
        content_type: tab as ContentType,
        text_content: tab !== 'photo' ? text : undefined,
        media_url: mediaUrl,
        caption: caption || undefined,
      })

      router.push(`/memories/${params.id}?contributed=1#contributi`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto.')
      setLoading(false)
      setUploadProgress('')
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-16">

        {/* Header */}
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
          <h1 className="text-3xl font-bold tracking-tight mb-1">Come lo ricordi tu?</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Racconta questo momento dal tuo punto di vista. Anche solo una foto basta.
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 mb-8">
          {TABS.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => { setTab(t.type); setError('') }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                tab === t.type
                  ? 'bg-foreground text-background'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Text / Note tab */}
          {(tab === 'text' || tab === 'note') && (
            <div className="space-y-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  tab === 'text'
                    ? "C\u2019\u00e8 qualcosa che solo tu ricordi cos\u00ec\u2026"
                    : 'Una cosa che solo tu hai notato, sentito, vissuto.'
                }
                rows={8}
                required
                autoFocus
                className="w-full rounded-2xl border border-input bg-background px-4 py-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
              />
              {text.length > 0 && (
                <p className="text-xs text-muted-foreground text-right">
                  {text.length} caratteri
                </p>
              )}
            </div>
          )}

          {/* Photo tab */}
          {tab === 'photo' && (
            <div className="space-y-4">
              {!preview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-52 rounded-2xl border-2 border-dashed border-border hover:border-foreground/40 flex flex-col items-center justify-center gap-3 transition-colors bg-muted/20"
                >
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                    <svg className="w-7 h-7 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Tocca per aggiungere una foto</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Anche una sola foto racconta molto.</p>
                  </div>
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Anteprima"
                    className="w-full rounded-2xl object-cover max-h-80"
                  />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-sm hover:bg-black/80 transition-colors"
                    aria-label="Rimuovi foto"
                  >
                    ✕
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Caption */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Didascalia <span className="text-muted-foreground font-normal">(opzionale)</span></label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Cosa stavi pensando in questo momento?"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full rounded-full py-6 text-base font-medium"
            disabled={loading || !canSubmit}
          >
            {loading
              ? (uploadProgress || 'Salvataggio…')
              : 'Aggiungi la mia versione'}
          </Button>
        </form>
      </div>
    </main>
  )
}
