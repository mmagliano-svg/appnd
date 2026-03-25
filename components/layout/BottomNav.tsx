'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SHOW_ON = ['/dashboard', '/explore']

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 transition-colors ${active ? 'text-foreground' : 'text-muted-foreground'}`}
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 0 : 1.75}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  )
}

function ExploreIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 transition-colors ${active ? 'text-foreground' : 'text-muted-foreground'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle
        cx="11" cy="11" r="8"
        strokeWidth={active ? 2.25 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 2.25 : 1.75}
        d="M21 21l-4.35-4.35"
      />
    </svg>
  )
}

export function BottomNav() {
  const pathname = usePathname()

  if (!SHOW_ON.includes(pathname)) return null

  const isHome = pathname === '/dashboard'
  const isExplore = pathname === '/explore'

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="max-w-lg mx-auto flex items-center h-16 px-8">

        {/* Casa */}
        <Link
          href="/dashboard"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 group"
          aria-label="I tuoi ricordi"
        >
          <HomeIcon active={isHome} />
          <span className={`text-[10px] font-medium tracking-wide transition-colors ${
            isHome ? 'text-foreground' : 'text-muted-foreground'
          }`}>
            Casa
          </span>
        </Link>

        {/* Nuovo ricordo — centro */}
        <div className="flex-1 flex items-center justify-center">
          <Link
            href="/memories/new"
            className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:opacity-80 active:scale-95 transition-all"
            aria-label="Nuovo ricordo"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>

        {/* Esplora */}
        <Link
          href="/explore"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 group"
          aria-label="Esplora"
        >
          <ExploreIcon active={isExplore} />
          <span className={`text-[10px] font-medium tracking-wide transition-colors ${
            isExplore ? 'text-foreground' : 'text-muted-foreground'
          }`}>
            Esplora
          </span>
        </Link>

      </div>
    </nav>
  )
}
