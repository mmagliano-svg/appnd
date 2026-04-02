'use client'

import { useState, useRef } from 'react'

export interface ContentComment {
  id: string
  authorName: string
  authorInitials: string
  text: string
}

interface ContentActionsProps {
  comments?: ContentComment[]
}

export function ContentActions({ comments: initialComments = [] }: ContentActionsProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comments, setComments] = useState<ContentComment[]>(initialComments)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const toggleLike = () => {
    setLiked((prev) => {
      setLikeCount((c) => (prev ? c - 1 : c + 1))
      return !prev
    })
  }

  const handleSend = () => {
    const text = draft.trim()
    if (!text) return
    setComments((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        authorName: 'Tu',
        authorInitials: 'TU',
        text,
      },
    ])
    setDraft('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Heart */}
      <button
        onClick={toggleLike}
        className="flex items-center gap-1.5 transition-colors active:scale-90"
        aria-label={liked ? 'Rimuovi like' : 'Metti like'}
      >
        <svg
          className={`w-[18px] h-[18px] transition-all ${
            liked
              ? 'fill-rose-500 stroke-rose-500'
              : 'fill-none stroke-muted-foreground hover:stroke-rose-400'
          }`}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        {likeCount > 0 && (
          <span className={`text-xs tabular-nums ${liked ? 'text-rose-500' : 'text-muted-foreground'}`}>
            {likeCount}
          </span>
        )}
      </button>

      {/* Comment thread */}
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

      {/* Input box */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un ricordo o un pensiero su questo momento..."
          className="flex-1 rounded-full border border-border bg-muted/40 px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 focus:bg-background transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim()}
          aria-label="Invia"
          className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center shrink-0 disabled:opacity-30 active:scale-95 transition-all"
        >
          <svg className="w-4 h-4 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
