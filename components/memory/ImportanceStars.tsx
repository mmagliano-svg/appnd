'use client'

import { useState, useTransition } from 'react'
import { updateImportance } from '@/actions/memories'

interface ImportanceStarsProps {
  memoryId: string
  initialValue: number // 1–5
  isCreator: boolean
}

export function ImportanceStars({ memoryId, initialValue, isCreator }: ImportanceStarsProps) {
  const [value, setValue] = useState(initialValue)
  const [hovered, setHovered] = useState(0)
  const [isPending, startTransition] = useTransition()

  const displayed = hovered || value

  function handleClick(star: number) {
    if (!isCreator) return
    const prev = value
    setValue(star)
    startTransition(async () => {
      try {
        await updateImportance(memoryId, star)
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
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleClick(star)}
          onMouseEnter={() => isCreator ? setHovered(star) : undefined}
          disabled={!isCreator || isPending}
          aria-label={`Importanza ${star}`}
          className={`text-xl leading-none transition-all active:scale-110 disabled:cursor-default ${
            star <= displayed
              ? 'text-amber-400'
              : 'text-foreground/20 hover:text-amber-300'
          } ${isPending ? 'opacity-50' : ''}`}
        >
          {star <= displayed ? '★' : '☆'}
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
