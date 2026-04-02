'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { addFragment } from '@/actions/contributions'
import { createClient } from '@/lib/supabase/client'

type FlowState = 'idle' | 'saving' | 'saved'

interface ContributeFlowProps {
  memoryId: string
  memoryTitle: string
  previewUrl: string | null
}

// ── Success copy rotation ─────────────────────────────────────────────────
// Semi-stable per session: cycles every 2 saves, never random each time.
const SUCCESS_LINES = [
  'Adesso è ancora più tuo',
  'Sta prendendo forma',
  'Si sta arricchendo',
  'Sta crescendo',
  'Adesso è ancora più tuo',
  'Sta prendendo forma',
]

// Module-level save counter — persists for the session, resets on page reload.
let sessionSaveCount = 0

function getSuccessLine(): string {
  // Advance every 2 saves so the line changes, but isn't random every time.
  return SUCCESS_LINES[Math.floor(sessionSaveCount / 2) % SUCCESS_LINES.length]
}

export function ContributeFlow({ memoryId, memoryTitle, previewUrl }: ContributeFlowProps) {
  const router = useRouter()
  const [flowState, setFlowState] = useState<FlowState>('idle')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [statusText, setStatusText] = useState('')
  const [successLine, setSuccessLine] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasContent = text.trim().length > 0 || Boolean(file)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPhotoPreview(URL.createObjectURL(f))
    setError('')
  }

  function removePhoto() {
    setFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function resetForm() {
    setText('')
    setFile(null)
    setPhotoPreview(null)
    setError('')
    setStatusText('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setFlowState('idle')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  async function handleSubmit() {
    if (!hasContent || flowState === 'saving') return
    setError('')
    setFlowState('saving')

    try {
      let result: { error?: string }

      if (file) {
        // Photo (+ optional caption) contribution
        setStatusText('Caricamento foto…')
        const supabase = createClient()
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${memoryId}/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('memory-media')
          .upload(path, file, { upsert: false })

        if (uploadError) throw new Error('Errore durante il caricamento. Riprova.')

        const { data: { publicUrl } } = supabase.storage
          .from('memory-media')
          .getPublicUrl(path)

        setStatusText('Aggiunta in corso…')
        result = await addFragment({
          memoryId,
          content_type: 'photo',
          media_url: publicUrl,
          caption: text.trim() || undefined,
        })
      } else {
        // Text-only contribution
        setStatusText('Aggiunta in corso…')
        result = await addFragment({
          memoryId,
          content_type: 'text',
          text_content: text.trim(),
        })
      }

      if (result.error) {
        setError(result.error)
        setFlowState('idle')
      } else {
        // Advance session counter + pick line BEFORE showing success screen
        sessionSaveCount++
        setSuccessLine(getSuccessLine())
        // Brief pause — creates perceived physical completion
        await new Promise<void>((res) => setTimeout(res, 280))
        // Haptic feedback on supported mobile devices
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(12)
        }
        setFlowState('saved')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto.')
      setFlowState('idle')
    } finally {
      setStatusText('')
    }
  }

  // ── Confirmation state ─────────────────────────────────────────────────────
  if (flowState === 'saved') {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <div className="max-w-lg mx-auto w-full px-4 flex flex-col min-h-screen">

          <div className="pt-6 mb-5">
            <div className="w-9 h-9" /> {/* spacer matches back button height */}
          </div>

          <ContextHeader previewUrl={previewUrl} title={memoryTitle} />

          {/* Confirmation body */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-16">
            <div className="w-11 h-11 rounded-full bg-foreground/[0.06] flex items-center justify-center mb-3">
              <span className="text-lg leading-none">✦</span>
            </div>
            <p className="text-xl font-semibold tracking-tight">Aggiunto</p>
            <p className="text-sm text-muted-foreground/50 max-w-[200px] leading-relaxed mt-1">
              {successLine}
            </p>
          </div>

          {/* Actions */}
          <div className="pb-14 space-y-3">
            <button
              onClick={resetForm}
              className="w-full rounded-2xl bg-foreground text-background py-4 text-sm font-medium hover:bg-foreground/90 active:scale-[0.99] transition-all"
            >
              Continua ancora
            </button>
            <button
              onClick={() => router.push(`/memories/${memoryId}?contributed=1#fragment-latest`)}
              className="w-full rounded-2xl py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Torna al momento
            </button>
          </div>

        </div>
      </main>
    )
  }

  // ── Input state ────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-20">

        {/* Back */}
        <div className="pt-6 mb-5">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
            Indietro
          </button>
        </div>

        {/* Context header */}
        <ContextHeader previewUrl={previewUrl} title={memoryTitle} />

        {/* Input area */}
        <div className={`mt-6 space-y-3 transition-all duration-150 ${flowState === 'saving' ? 'scale-[0.98] opacity-70' : ''}`}>

          {/* Inline photo preview */}
          {photoPreview && (
            <div className="relative rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Foto selezionata"
                className="w-full object-cover max-h-60 rounded-2xl"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/55 text-white text-xs flex items-center justify-center hover:bg-black/75 transition-colors"
                aria-label="Rimuovi foto"
              >
                ✕
              </button>
            </div>
          )}

          {/* Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                file
                  ? 'Aggiungi una didascalia…'
                  : 'Aggiungi un dettaglio che ti è tornato in mente'
              }
              rows={7}
              autoFocus
              disabled={flowState === 'saving'}
              className="w-full rounded-2xl bg-foreground/[0.04] px-4 py-4 text-base placeholder:text-muted-foreground/35 focus:outline-none focus:bg-foreground/[0.06] resize-none leading-relaxed transition-colors disabled:opacity-50"
            />
            {/* Empty state hint — shown when field is empty and no photo */}
            {text.length === 0 && !file && (
              <p className="absolute bottom-3.5 right-4 text-[10px] text-muted-foreground/20 select-none pointer-events-none leading-none">
                Anche una cosa piccola va bene
              </p>
            )}
          </div>

          {/* Quick action: photo */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={flowState === 'saving'}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-full transition-colors disabled:opacity-40 ${
                file
                  ? 'bg-foreground text-background'
                  : 'bg-foreground/[0.06] text-foreground/55 hover:bg-foreground/[0.09] hover:text-foreground'
              }`}
            >
              <span>📷</span>
              <span>{file ? 'Foto aggiunta' : 'Aggiungi foto'}</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="mt-10">
          <button
            onClick={handleSubmit}
            disabled={!hasContent || flowState === 'saving'}
            className="w-full rounded-2xl bg-foreground text-background py-4 text-sm font-medium hover:bg-foreground/90 active:scale-[0.99] transition-all disabled:opacity-25"
          >
            {flowState === 'saving'
              ? (statusText || 'Aggiunta in corso…')
              : 'Aggiungi'}
          </button>
          {hasContent && flowState === 'idle' && (
            <p className="text-center text-[11px] text-muted-foreground/30 mt-2">
              Tornerà qui
            </p>
          )}
        </div>

      </div>
    </main>
  )
}

// ── Context header strip ───────────────────────────────────────────────────

function ContextHeader({
  previewUrl,
  title,
}: {
  previewUrl: string | null
  title: string
}) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-foreground/[0.04]">
      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-muted">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/30" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground/35 leading-none mb-1">
          Stai continuando questo momento
        </p>
        <p className="text-sm font-medium truncate leading-snug">{title}</p>
      </div>
    </div>
  )
}
