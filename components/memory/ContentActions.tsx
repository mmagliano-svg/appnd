'use client'

import { useState } from 'react'

export interface ContentComment {
  id: string
  authorName: string
  authorInitials: string
  text: string
}

interface ContentActionsProps {
  comments?: ContentComment[]
}

export function ContentActions({ comments = [] }: ContentActionsProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [open, setOpen] = useState(false)

  const toggleLike = () => {
    setLiked((prev) => {
      setLikeCount((c) => (prev ? c - 1 : c + 1))
      return !prev
    })
  }

  return (
    <div>
      <div className="flex items-center gap-5 pt-3">
        {/* Like */}
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

        {/* Comments */}
        <button
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={open ? 'Chiudi commenti' : 'Apri commenti'}
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {comments.length > 0 && (
            <span className="text-xs tabular-nums">{comments.length}</span>
          )}
        </button>
      </div>

      {/* Expandable thread */}
      {open && (
        <div className="mt-2 rounded-xl bg-muted/40 border border-border/30 px-4 py-3 space-y-3">
          {comments.length === 0 ? (
            <p className="text-xs text-muted-foreground/50 italic">Nessun commento ancora.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center text-[9px] font-bold text-background shrink-0 mt-0.5">
                  {c.authorInitials}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold">{c.authorName}</span>
                  <p className="text-xs text-foreground/70 leading-relaxed mt-0.5">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
