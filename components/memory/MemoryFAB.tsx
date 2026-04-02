'use client'

import { useState } from 'react'
import Link from 'next/link'

interface MemoryFABProps {
  memoryId: string
  contributeHref: string
}

export function MemoryFAB({ memoryId, contributeHref }: MemoryFABProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Action sheet */}
      {open && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
          <div className="w-full max-w-lg bg-background rounded-t-3xl border-t border-border/50 shadow-2xl">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 rounded-full bg-border/60" />
            </div>
            <div className="px-5 pt-2 pb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/35">
                Continua questo momento
              </p>
            </div>
            <div className="px-3 space-y-0.5">
              <Link
                href={contributeHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3.5 px-3 py-3.5 rounded-2xl hover:bg-muted/50 transition-colors active:bg-muted"
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Aggiungi una foto</p>
                  <p className="text-xs text-muted-foreground/55 mt-1">Un frame di quel giorno</p>
                </div>
              </Link>
              <Link
                href={contributeHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3.5 px-3 py-3.5 rounded-2xl hover:bg-muted/50 transition-colors active:bg-muted"
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Scrivi un dettaglio</p>
                  <p className="text-xs text-muted-foreground/55 mt-1">Quello che non vuoi dimenticare</p>
                </div>
              </Link>
              <Link
                href={`/memories/${memoryId}/edit`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3.5 px-3 py-3.5 rounded-2xl hover:bg-muted/50 transition-colors active:bg-muted"
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Invita una persona</p>
                  <p className="text-xs text-muted-foreground/55 mt-1">Per vedere anche il loro punto di vista</p>
                </div>
              </Link>
            </div>
            <div className="p-4 pt-3">
              <button
                onClick={() => setOpen(false)}
                className="w-full rounded-2xl py-3 text-sm text-muted-foreground bg-muted/30 hover:bg-muted transition-colors active:bg-muted"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <div className="fixed bottom-6 z-50" style={{ right: 'max(1rem, calc((100vw - 32rem) / 2 + 1rem))' }}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-black border border-black text-white px-4 py-2.5 text-xs font-medium shadow-sm hover:bg-black/85 active:scale-95 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Continua questo momento
        </button>
      </div>
    </>
  )
}
