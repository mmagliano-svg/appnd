'use client'

import { useState, useTransition } from 'react'
import { updateImportance } from '@/actions/memories'

interface ImportanceStarsProps {
  memoryId: string
  initialValue: number // 1–5
  isCreator: boolean
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export function ImportanceStars({ memoryId, initialValue, isCreator }: ImportanceStarsProps) {
  const [value, setValue] = useState(initialValue)
  const [hovered, setHovered] = useState(0)
  const [isPending, startTransition] = useTransition()

  const displayed = hovered || value

  function handleClick(n: number) {
    if (!isCreator) return
    const prev = value
    setValue(n)
    startTransition(async () => {
      try {
        await updateImportance(memoryId, n)
      } catch {
        setValue(prev)
      }
    })
  }

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => handleClick(n)}
            onMouseEnter={() => isCreator ? setHovered(n) : undefined}
            disabled={!isCreator || isPending}
            aria-label={`Importanza ${n}`}
            className={`leading-none transition-all active:scale-110 disabled:cursor-default ${
              n <= displayed
                ? 'text-rose-500'
                : 'text-foreground/20 hover:text-rose-300'
            } ${isPending ? 'opacity-50' : ''}`}
          >
            <HeartIcon filled={n <= displayed} />
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground/40 leading-none">
        Quanto ti è rimasto?
      </p>
      <p className="text-[10px] text-muted-foreground/22 leading-none">
        Ci sono giorni che restano più di altri
      </p>
    </div>
  )
}
