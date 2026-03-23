'use client'

import { useState } from 'react'
import { deleteMemory } from '@/actions/memories'
import { Button } from '@/components/ui/button'

interface DeleteButtonProps {
  memoryId: string
}

export function DeleteButton({ memoryId }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteMemory(memoryId)
    } catch {
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
    <Button
      variant="outline"
      size="sm"
      onClick={() => setConfirming(true)}
      className="text-destructive border-destructive/30 hover:bg-destructive/5"
    >
      Elimina
    </Button>
  )
}
