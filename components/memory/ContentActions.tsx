'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sendMessage } from '@/actions/messages'

export interface ContentComment {
  id: string
  authorName: string
  authorInitials: string
  text: string
}

interface ContentActionsProps {
  /** When provided, comments are persisted to memory_messages. Omit for local-only (e.g. hero image). */
  memoryId?: string
  initialComments?: ContentComment[]
}

export function ContentActions({ memoryId, initialComments = [] }: ContentActionsProps) {
  const router = useRouter()
  const [comments, setComments] = useState<ContentComment[]>(initialComments)
  const [draft, setDraft] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync with server-refreshed props (after router.refresh())
  useEffect(() => {
    setComments(initialComments)
  }, [initialComments])

  const handleSend = () => {
    const text = draft.trim()
    if (!text || isPending) return
    setSendError(null)

    if (!memoryId) {
      // Local-only mode (no memoryId provided)
      setComments((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, authorName: 'Tu', authorInitials: 'TU', text },
      ])
      setDraft('')
      inputRef.current?.focus()
      return
    }

    // Optimistic add
    const optimisticId = `optimistic-${Date.now()}`
    setComments((prev) => [
      ...prev,
      { id: optimisticId, authorName: 'Tu', authorInitials: 'TU', text },
    ])
    setDraft('')
    inputRef.current?.focus()

    startTransition(async () => {
      const result = await sendMessage(memoryId, text)
      if (result.error) {
        // Revert optimistic entry and restore draft
        setComments((prev) => prev.filter((c) => c.id !== optimisticId))
        setDraft(text)
        setSendError(result.error)
      } else {
        // Replace optimistic with real server data
        router.refresh()
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="mt-3 space-y-3">
      {comments.length > 0 && (
        <div className="space-y-2.5">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center text-[9px] font-bold text-background shrink-0 mt-0.5">
                {c.authorInitials}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold">{c.authorName}</span>
                <p className="text-sm text-foreground/75 leading-relaxed mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Aggiungi un dettaglio che ti è tornato in mente"
          disabled={isPending}
          className="flex-1 rounded-2xl border border-foreground/10 bg-muted px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 focus:bg-background transition-colors disabled:opacity-60"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || isPending}
          aria-label="Invia"
          className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center shrink-0 shadow-sm disabled:opacity-30 active:scale-95 transition-all"
        >
          <svg className="w-4 h-4 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>

      {sendError && (
        <p className="text-xs text-destructive">{sendError}</p>
      )}
    </div>
  )
}
