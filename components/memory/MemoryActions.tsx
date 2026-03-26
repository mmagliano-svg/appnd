'use client'

import { useState, useTransition } from 'react'
import { toggleLike } from '@/actions/likes'
import type { LikeState } from '@/actions/likes'

interface Props {
  memoryId: string
  initialLikes: LikeState
  participantCount: number
}

export function MemoryActions({ memoryId, initialLikes, participantCount }: Props) {
  const [likes, setLikes]   = useState(initialLikes)
  const [isPending, start]  = useTransition()

  function handleLike() {
    // Optimistic
    setLikes((prev) => ({
      count:     prev.likedByMe ? prev.count - 1 : prev.count + 1,
      likedByMe: !prev.likedByMe,
    }))

    start(async () => {
      const result = await toggleLike(memoryId)
      if (!result.error) setLikes({ count: result.count, likedByMe: result.likedByMe })
    })
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50">

      {/* Like */}
      <button
        onClick={handleLike}
        disabled={isPending}
        aria-label={likes.likedByMe ? 'Togli like' : 'Metti like'}
        className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-all active:scale-95 ${
          likes.likedByMe
            ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        <svg
          className={`w-5 h-5 transition-transform ${likes.likedByMe ? 'scale-110' : ''}`}
          fill={likes.likedByMe ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        {likes.count > 0 && (
          <span className="tabular-nums">{likes.count}</span>
        )}
      </button>

      <div className="flex items-center gap-1">
        {/* Chat */}
        <button
          onClick={() => scrollTo('memory-chat')}
          aria-label="Vai alla conversazione"
          className="flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>Scrivi</span>
        </button>

        {/* People */}
        <button
          onClick={() => scrollTo('memory-participants')}
          aria-label="Vedi partecipanti"
          className="flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{participantCount}</span>
        </button>
      </div>
    </div>
  )
}
