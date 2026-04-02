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
      {/* iOS-style share: arrow up from box */}
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 3v13M7 8l5-5 5 5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 16v2a2 2 0 002 2h10a2 2 0 002-2v-2" />
      </svg>
    </button>
  )
}
