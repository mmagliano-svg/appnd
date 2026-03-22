'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createContribution } from '@/actions/contributions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { ContentType } from '@/lib/supabase/types'

export default function ContributePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [type, setType] = useState<ContentType>('text')
  const [text, setText] = useState('')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (type === 'text' && !text.trim()) return

    setLoading(true)
    setError('')

    try {
      await createContribution({
        memoryId: params.id,
        content_type: type,
        text_content: type !== 'photo' ? text : undefined,
        caption: caption || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <div className="py-8 space-y-6">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground block mb-4"
          >
            ← Indietro
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">Aggiungi contributo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            La tua prospettiva su questo momento.
          </p>
        </div>

        <div className="flex gap-2">
          {(['text', 'note'] as ContentType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                type === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {t === 'text' ? 'Testo' : 'Nota privata'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">
              {type === 'note' ? 'Nota (visibile a tutti i partecipanti)' : 'Racconta'}
            </Label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                type === 'text'
                  ? 'Com\'era per te questo momento?'
                  : 'Aggiungi una nota al ricordo…'
              }
              rows={6}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading || !text.trim()}>
            {loading ? 'Salvataggio…' : 'Aggiungi'}
          </Button>
        </form>
      </div>
    </main>
  )
}
