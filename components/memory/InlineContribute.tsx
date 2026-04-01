'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createContribution } from '@/actions/contributions'

interface InlineContributeProps {
  memoryId: string
}

const SUGGESTIONS = ['Un dettaglio', 'Una foto', 'Un momento divertente']

export function InlineContribute({ memoryId }: InlineContributeProps) {
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const canSubmit = text.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || isPending) return

    setError('')
    startTransition(async () => {
      try {
        await createContribution({
          memoryId,
          content_type: 'text',
          text_content: text.trim(),
        })
        setDone(true)
        setText('')
        router.refresh()
      } catch {
        setError('Non è stato possibile salvare. Riprova.')
      }
    })
  }

  if (done) {
    return (
      <div className="mt-10 py-5 border-t border-border/30">
        <p className="text-sm text-muted-foreground/60 italic">Il tuo ricordo è stato aggiunto.</p>
      </div>
    )
  }

  return (
    <div className="mt-10 pt-6 border-t border-border/30">
      <p className="text-sm font-medium text-foreground/80 mb-4">
        Come lo ricordi tu?
      </p>

      {/* Suggestion chips */}
      <div
        className="flex gap-2 overflow-x-auto mb-3 pb-0.5"
        style={{ scrollbarWidth: 'none' } as React.CSSProperties}
      >
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setText(s + ': ')
              inputRef.current?.focus()
            }}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-foreground/[0.06] text-foreground/60 hover:bg-foreground/[0.10] transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Chat-style input row */}
        <div className="flex items-center gap-2 bg-foreground/[0.04] rounded-full px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cosa ti ricordi di questo momento?"
            disabled={isPending}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground/90 placeholder:text-muted-foreground/40 min-w-0"
          />
          <button
            type="submit"
            disabled={!canSubmit || isPending}
            className="w-8 h-8 shrink-0 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-25 hover:opacity-80 active:scale-95 transition-all"
          >
            {isPending ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-500/70 mt-2 px-1">{error}</p>
        )}

        {/* Helper text */}
        <p className="text-xs text-muted-foreground/60 mt-2 px-1">
          Puoi aggiungere un ricordo, un dettaglio o una foto
        </p>

        {/* Photo link */}
        <div className="mt-3 px-1">
          <Link
            href={`/memories/${memoryId}/contribute`}
            className="text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
          >
            Aggiungi una foto →
          </Link>
        </div>
      </form>
    </div>
  )
}
