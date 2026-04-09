'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { deleteMemory } from '@/actions/memories'

interface MoreMenuProps {
  memoryId: string
  editHref: string
  heroMode?: boolean
}

export function MoreMenu({ memoryId, editHref, heroMode = false }: MoreMenuProps) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close on outside click — uses 'click' (not mousedown) to avoid
  // race conditions on mobile Safari where synthesized mousedown can
  // fire before the useEffect listener is registered.
  const handleOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      console.log('[MoreMenu] outside-click → closing')
      setOpen(false)
      setConfirming(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      console.log('[MoreMenu] open=true → attaching outside-click listener')
      // Defer listener by one frame so the current tap's click event
      // doesn't immediately trigger it on iOS Safari.
      const id = requestAnimationFrame(() => {
        document.addEventListener('click', handleOutside, true)
      })
      return () => {
        cancelAnimationFrame(id)
        document.removeEventListener('click', handleOutside, true)
      }
    }
  }, [open, handleOutside])

  async function handleDelete() {
    setLoading(true)
    setDeleteError(null)
    try {
      await deleteMemory(memoryId)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Impossibile eliminare. Riprova.')
      setLoading(false)
    }
  }

  const triggerClass = heroMode
    ? 'text-white/90 hover:text-white hover:bg-white/10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
    : 'text-muted-foreground hover:text-foreground hover:bg-muted'

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => {
          console.log('[MoreMenu] trigger click — open was:', open)
          setOpen((p) => !p)
          setConfirming(false)
        }}
        aria-label="Altre opzioni"
        className={`rounded-full p-2 transition-colors ${triggerClass}`}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {/* Debug: visible indicator when menu state is open */}
      {open && (
        <div className="absolute -left-24 top-0 bg-red-500 text-white text-[10px] px-1 rounded z-50 pointer-events-none">
          OPEN
        </div>
      )}

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 rounded-2xl bg-background border border-border shadow-xl overflow-hidden z-50">
          <Link
            href={editHref}
            className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent transition-colors"
            onClick={() => setOpen(false)}
          >
            <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifica ricordo
          </Link>

          <div className="border-t border-border/40" />

          {!confirming ? (
            <button
              onClick={() => { setConfirming(true); setDeleteError(null) }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-destructive hover:bg-destructive/5 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Elimina momento
            </button>
          ) : (
            <div className="px-4 py-3 space-y-2.5">
              <p className="text-sm font-medium leading-snug">
                Sei sicuro di voler eliminare questo momento?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Questa azione è irreversibile.
              </p>
              {deleteError && (
                <p className="text-xs text-destructive leading-snug">{deleteError}</p>
              )}
              <div className="flex gap-2 pt-0.5">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-destructive text-destructive-foreground text-xs py-1.5 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {loading ? 'Eliminazione…' : 'Elimina'}
                </button>
                <button
                  onClick={() => { setConfirming(false); setDeleteError(null) }}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-muted text-xs py-1.5 font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
