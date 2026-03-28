'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SHOW_ON_EXACT = ['/dashboard', '/explore', '/profile']
const SHOW_ON_PREFIX = ['/timeline', '/people']

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

function TimelineIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 transition-colors ${active ? 'text-foreground' : 'text-muted-foreground'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 2.25 : 1.75}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
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
      <circle cx="11" cy="11" r="8" strokeWidth={active ? 2.25 : 1.75} strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.25 : 1.75} d="M21 21l-4.35-4.35" />
    </svg>
  )
}

interface NavTabProps {
  href: string
  label: string
  active: boolean
  children: React.ReactNode
}

function NavTab({ href, label, active, children }: NavTabProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 py-2 group"
      aria-label={label}
    >
      {children}
      <span className={`text-[10px] font-medium tracking-wide transition-colors ${
        active ? 'text-foreground' : 'text-muted-foreground'
      }`}>
        {label}
      </span>
    </Link>
  )
}

export function BottomNav() {
  const pathname = usePathname()

  const visible =
    SHOW_ON_EXACT.includes(pathname) ||
    SHOW_ON_PREFIX.some((p) => pathname.startsWith(p))
  if (!visible) return null

  const isHome = pathname === '/dashboard'
  const isTimeline = pathname.startsWith('/timeline')
  const isExplore = pathname === '/explore'
  const isProfile = pathname === '/profile' || pathname.startsWith('/people')

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-4">

        {/* Casa */}
        <NavTab href="/dashboard" label="Casa" active={isHome}>
          <HomeIcon active={isHome} />
        </NavTab>

        {/* Timeline */}
        <NavTab href="/timeline" label="Timeline" active={isTimeline}>
          <TimelineIcon active={isTimeline} />
        </NavTab>

        {/* Nuovo ricordo — FAB centrale */}
        <Link
          href="/memories/new"
          className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:opacity-80 active:scale-95 transition-all"
          aria-label="Nuovo ricordo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>

        {/* Esplora */}
        <NavTab href="/explore" label="Esplora" active={isExplore}>
          <ExploreIcon active={isExplore} />
        </NavTab>

        {/* Profilo */}
        <NavTab href="/profile" label="Profilo" active={isProfile}>
          <svg
            className={`w-5 h-5 transition-colors ${isProfile ? 'text-foreground' : 'text-muted-foreground'}`}
            fill={isProfile ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isProfile ? 0 : 1.75}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </NavTab>

      </div>
    </nav>
  )
}
