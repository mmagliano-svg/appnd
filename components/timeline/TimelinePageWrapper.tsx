'use client'

// Applies zoom-in enter animation on every timeline page mount.
// Direction (forward/backward) is handled by sessionStorage so the correct
// animation fires even after route changes.

import { useEffect, useRef } from 'react'

interface Props {
  children: React.ReactNode
}

export function TimelinePageWrapper({ children }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Read direction set by the nav controls before navigating
    const dir = sessionStorage.getItem('tl-dir') ?? 'forward'
    sessionStorage.removeItem('tl-dir')

    const cls = dir === 'backward' ? 'animate-zoom-backward' : 'animate-zoom-forward'
    el.classList.add(cls)

    const cleanup = () => el.classList.remove(cls)
    el.addEventListener('animationend', cleanup, { once: true })
    return () => el.removeEventListener('animationend', cleanup)
  }, [])

  return <div ref={ref}>{children}</div>
}

// ── Direction helpers (call these BEFORE router.push / router.back) ────────

export function setForward() {
  sessionStorage.setItem('tl-dir', 'forward')
}

export function setBackward() {
  sessionStorage.setItem('tl-dir', 'backward')
}
