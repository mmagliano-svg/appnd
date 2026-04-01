'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createContribution } from '@/actions/contributions'

interface InlineContributeProps {
  memoryId: string
}

export function InlineContribute({ memoryId }: InlineContributeProps) {
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
      <p className="text-sm font-medium text-foreground/80 mb-3">
        Come lo ricordi tu?
      </p>

      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cosa ricordi di quel giorno?"
          rows={4}
          className="w-full rounded-2xl bg-foreground/[0.04] border border-transparent focus:border-foreground/10 px-4 py-3.5 text-sm text-foreground/90 placeholder:text-muted-foreground/35 leading-relaxed resize-none focus:outline-none transition-colors"
          disabled={isPending}
        />

        {error && (
          <p className="text-xs text-red-500/70 mt-1.5 px-1">{error}</p>
        )}

        <div className="flex items-center justify-between mt-2.5">
          <Link
            href={`/memories/${memoryId}/contribute`}
            className="text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
          >
            Aggiungi una foto →
          </Link>

          <button
            type="submit"
            disabled={!canSubmit || isPending}
            className="rounded-full bg-foreground text-background px-5 py-2 text-xs font-semibold disabled:opacity-30 hover:bg-foreground/85 active:scale-95 transition-all"
          >
            {isPending ? 'Salvo…' : 'Aggiungi'}
          </button>
        </div>
      </form>
    </div>
  )
}
