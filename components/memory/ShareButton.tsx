'use client'

interface ShareButtonProps {
  title: string
  url: string
  heroMode?: boolean
}

export function ShareButton({ title, url, heroMode }: ShareButtonProps) {
  const handleShare = async () => {
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
      aria-label="Condividi"
      className={`rounded-full p-2 transition-colors ${
        heroMode
          ? 'text-white/90 hover:text-white hover:bg-white/10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    </button>
  )
}
