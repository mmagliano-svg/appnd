'use client'

import { useState } from 'react'
import { createInvite } from '@/actions/invites'

interface InviteShareButtonProps {
  memoryId: string
  title: string
}

export function InviteShareButton({ memoryId, title }: InviteShareButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleShare = async () => {
    if (loading) return
    setLoading(true)
    try {
      // Create an invite token on the server so the shared link points to
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
      className="flex items-center gap-2 mt-4 rounded-2xl px-4 py-3 w-full transition-colors active:scale-[0.985] active:transition-none"
      style={{
        background: 'rgba(107,95,232,0.07)',
        border:     '1px solid rgba(107,95,232,0.15)',
        color:      '#6B5FE8',
      }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'rgba(107,95,232,0.12)' }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      </div>
      <div className="text-left">
        <p className="text-[14px] font-medium leading-none">Invita chi era con te</p>
        <p className="text-[12px] mt-0.5 leading-snug" style={{ color: 'rgba(107,95,232,0.65)' }}>
          Per vedere anche il loro punto di vista
        </p>
      </div>
    </button>
  )
}
