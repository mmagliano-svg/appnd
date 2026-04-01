'use client'

import { useState } from 'react'
import { deleteMemory } from '@/actions/memories'
import { Button } from '@/components/ui/button'

interface DeleteButtonProps {
  memoryId: string
  heroMode?: boolean
}

export function DeleteButton({ memoryId, heroMode = false }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      await deleteMemory(memoryId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto.')
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? 'Eliminazione…' : 'Conferma eliminazione'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          Annulla
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <p className="text-xs text-destructive max-w-[180px] leading-tight">{error}</p>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirming(true)}
        className={heroMode
          ? 'bg-white/90 text-red-500 backdrop-blur-md border border-white/40 hover:bg-white'
          : 'text-destructive border-destructive/30 hover:bg-destructive/5'
        }
      >
        Elimina
      </Button>
    </div>
  )
}
