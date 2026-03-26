'use client'

import { useTransition } from 'react'
import { removeParticipant } from '@/actions/invites'
import { useRouter } from 'next/navigation'

interface Props {
  memoryId: string
  participantId: string
  participantName: string
}

export function RemoveParticipantButton({ memoryId, participantId, participantName }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleRemove() {
    if (!confirm(`Rimuovere ${participantName} da questo ricordo? Perderà l'accesso.`)) return

    startTransition(async () => {
      const result = await removeParticipant(memoryId, participantId)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      aria-label={`Rimuovi ${participantName}`}
      className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-30"
    >
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}
