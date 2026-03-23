interface TagBadgeProps {
  tag: string
  onClick?: () => void
  active?: boolean
}

export function TagBadge({ tag, onClick, active }: TagBadgeProps) {
  const base =
    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors'
  const activeStyle = 'bg-primary text-primary-foreground'
  const inactiveStyle = 'bg-muted text-muted-foreground hover:bg-muted/80'

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${active ? activeStyle : inactiveStyle} cursor-pointer`}
      >
        #{tag}
      </button>
    )
  }

  return (
    <span className={`${base} ${active ? activeStyle : inactiveStyle}`}>
      #{tag}
    </span>
  )
}
