'use client'

interface InviteShareButtonProps {
  memoryId: string
  title: string
}

export function InviteShareButton({ memoryId, title }: InviteShareButtonProps) {
  const handleShare = async () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/memories/${memoryId}`
        : `/memories/${memoryId}`

    try {
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch {
      // user cancelled or not supported — silent
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 mt-3 text-xs text-muted-foreground/55 hover:text-foreground border border-border/40 rounded-full px-3 py-1.5 transition-colors hover:border-foreground/20"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v16m8-8H4" />
      </svg>
      Invita chi era con te
    </button>
  )
}
