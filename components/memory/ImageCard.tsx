'use client'

import { useState } from 'react'

export interface ImageComment {
  id: string
  authorName: string
  authorInitials: string
  text: string
}

interface ImageCardProps {
  src: string
  alt: string
  caption?: string | null
  authorName: string
  authorInitials: string
  timestamp: string
  isOwn: boolean
  comments?: ImageComment[]
}

export function ImageCard({
  src,
  alt,
  caption,
  authorName,
  authorInitials,
  timestamp,
  isOwn,
  comments = [],
}: ImageCardProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentsOpen, setCommentsOpen] = useState(false)

  const toggleLike = () => {
    setLiked((prev) => !prev)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
  }

  return (
    <div className="-mx-4">
      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full object-cover"
        style={{
          maxHeight: '480px',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 5%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 5%)',
        }}
        loading="lazy"
        draggable={false}
      />

      {/* Meta row */}
      <div className="px-4 pt-2 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center text-[9px] font-bold text-background shrink-0">
          {authorInitials}
        </div>
        <span className="text-xs text-muted-foreground flex-1 truncate">
          {isOwn ? 'Tu' : authorName}
        </span>
        <span className="text-[10px] text-muted-foreground/40 shrink-0">{timestamp}</span>
      </div>

      {/* Caption */}
      {caption && (
        <p className="px-4 pt-1 text-sm text-foreground/70 italic leading-relaxed">{caption}</p>
      )}

      {/* Actions row */}
      <div className="px-4 pt-2 pb-1 flex items-center gap-5">
        {/* Like */}
        <button
          onClick={toggleLike}
          className="flex items-center gap-1.5 transition-colors active:scale-90"
          aria-label={liked ? 'Rimuovi like' : 'Metti like'}
        >
          <svg
            className={`w-[18px] h-[18px] transition-all ${
              liked ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-muted-foreground hover:stroke-rose-400'
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
            <span
              className={`text-xs tabular-nums ${liked ? 'text-rose-500' : 'text-muted-foreground'}`}
            >
              {likeCount}
            </span>
          )}
        </button>

        {/* Comments toggle */}
        <button
          onClick={() => setCommentsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={commentsOpen ? 'Chiudi commenti' : 'Apri commenti'}
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

      {/* Expandable comments thread */}
      {commentsOpen && (
        <div className="mx-4 mb-2 rounded-xl bg-muted/40 border border-border/30 px-4 py-3 space-y-3">
          {comments.length === 0 ? (
            <p className="text-xs text-muted-foreground/50 italic">Nessun commento ancora.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center text-[9px] font-bold text-background shrink-0 mt-0.5">
                  {comment.authorInitials}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold">{comment.authorName}</span>
                  <p className="text-xs text-foreground/70 leading-relaxed mt-0.5">{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
