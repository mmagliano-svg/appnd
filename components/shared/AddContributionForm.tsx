'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addSharedMemoryContribution } from '@/actions/shared-memories'

interface Props {
  sharedMemoryId: string
  fromMemoryId: string | null
}

export function AddContributionForm({ sharedMemoryId, fromMemoryId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setError('')

    startTransition(async () => {
      try {
        await addSharedMemoryContribution(sharedMemoryId, text)
        setDone(true)
        setTimeout(() => {
          router.push(fromMemoryId ? `/memories/${fromMemoryId}` : '/dashboard')
        }, 1200)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Qualcosa è andato storto. Riprova.')
      }
    })
  }

  if (done) {
    return (
      <p className="text-sm text-foreground/70 py-6">
        ✓ Il tuo ricordo è stato aggiunto.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground/70 mb-3">
        Qui potete continuare questo momento insieme
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Aggiungi qualcosa… un ricordo, un dettaglio, una foto"
        rows={6}
        className="w-full rounded-2xl bg-foreground/[0.04] border border-transparent focus:border-foreground/10 focus:bg-background px-4 py-3.5 text-base placeholder:text-muted-foreground/40 focus:outline-none transition-colors resize-none leading-relaxed"
        autoFocus
      />
      <p className="text-xs text-muted-foreground/60 mt-2">
        Puoi scrivere, aggiungere un dettaglio o completare questo momento
      </p>

      {error && <p className="text-sm text-destructive px-1">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !text.trim()}
        className="w-full rounded-full bg-foreground text-background py-4 text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? 'Salvataggio…' : 'Aggiungi il tuo ricordo'}
      </button>
    </form>
  )
}
