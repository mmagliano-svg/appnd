'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * Client component: scrolls to #fragment-latest and applies a brief glow
 * when the user returns from the contribute flow (?contributed=1).
 * Cleans the URL after the effect completes.
 */
export function TimelineHighlight({ active }: { active: boolean }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!active) return

    const el = document.getElementById('fragment-latest')
    if (!el) return

    // Quick glow-in
    el.style.transition = 'box-shadow 0.12s ease'
    el.style.boxShadow = '0 0 0 10px rgba(0,0,0,0.055)'
    el.style.borderRadius = '12px'

    // Fade out after 500ms
    const fadeOut = setTimeout(() => {
      el.style.transition = 'box-shadow 0.9s ease'
      el.style.boxShadow = '0 0 0 0px transparent'
      setTimeout(() => { el.style.cssText = '' }, 900)
    }, 500)

    // Clean URL (?contributed=1) after effect ends
    const cleanUrl = setTimeout(() => {
      router.replace(pathname)
    }, 2500)

    return () => {
      clearTimeout(fadeOut)
      clearTimeout(cleanUrl)
    }
  }, [active, pathname, router])

  return null
}
