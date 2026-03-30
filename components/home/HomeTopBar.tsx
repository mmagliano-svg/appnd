import Link from 'next/link'

interface HomeTopBarProps {
  displayName: string
  avatarUrl: string | null
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase() || '?'
}

export function HomeTopBar({ displayName, avatarUrl }: HomeTopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-6 pb-3">
      <Link
        href="/profile"
        className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0"
        aria-label="Profilo"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">
            {initials(displayName)}
          </span>
        )}
      </Link>

      <p className="text-base font-bold tracking-tight">Home</p>

      {/* Notification bell — placeholder for future */}
      <Link
        href="/dashboard"
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        aria-label="Notifiche"
      >
        <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </Link>
    </div>
  )
}
