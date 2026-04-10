'use client'

import { useState } from 'react'
import { createInvite } from '@/actions/invites'

interface ShareButtonProps {
  title: string
  memoryId: string
  heroMode?: boolean
}

export function ShareButton({ title, memoryId, heroMode }: ShareButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleShare = async () => {
    if (loading) return
    setLoading(true)
    try {
      // Generate an invite token on the server so the shared link points to
      // /invite/:token (public read-only) instead of /memories/:id (protected).
      const { inviteUrl } = await createInvite(memoryId)
      try {
        if (navigator.share) {
          await navigator.share({ title, url: inviteUrl })
        } else {
          await navigator.clipboard.writeText(inviteUrl)
        }
      } catch {
        // user cancelled or not supported — silent
      }
    } catch {
      // invite creation failed — silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleShare}
      aria-label="Condividi"
      className={`rounded-full p-2 transition-colors ${
        heroMode
          ? 'text-white/90 hover:text-white hover:bg-white/10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {/* Custom curved-arrow share icon */}
      <svg
        className="w-[22px] h-[22px]"
        viewBox="0 0 512 512"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M 307.8 72.1 L 499.7 216.8 L 307.8 361.4 L 307.8 270.6 C 188.2 270.6 104.3 308.9 46.2 391.5 C 46.2 260.2 113.3 135.1 307.8 113.0 Z" />
      </svg>
    </button>
  )
}
