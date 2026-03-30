'use client'

import { useEffect } from 'react'

/**
 * Forces the window to scroll to (0,0) on mount.
 * Prevents browser scroll-restoration or any child scrollIntoView
 * from stealing the viewport away from the hero.
 */
export function ScrollToTop() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  return null
}
