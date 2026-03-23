import { getCategoryByValue } from '@/lib/constants/categories'

interface CategoryBadgeProps {
  category: string | null | undefined
  size?: 'sm' | 'md'
}

export function CategoryBadge({ category, size = 'sm' }: CategoryBadgeProps) {
  const cat = getCategoryByValue(category)
  if (!cat) return null

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      <span>{cat.emoji}</span>
      <span>{cat.label}</span>
    </span>
  )
}
