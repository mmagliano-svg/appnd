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
