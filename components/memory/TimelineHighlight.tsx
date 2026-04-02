'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * Client component.
 * Sequence on return from contribute flow (?contributed=1):
 *   1. scrollIntoView(smooth / center) — lands fragment in the middle of viewport
 *   2. wait 150ms — scroll settles
 *   3. scale 1 → 1.012, glow fade in  (150ms)
 *   4. hold at peak                     (700ms)
 *   5. scale back to 1, glow fade out  (1000ms)
 *   6. clean URL after full effect
 */
export function TimelineHighlight({ active }: { active: boolean }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!active) return

    const el = document.getElementById('fragment-latest')
    if (!el) return

    // Step 1 — smooth scroll to center
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Step 2 — wait for scroll to settle, then start animation
    const startEffect = setTimeout(() => {
      // Step 3 — glow + scale in
      el.style.transition = 'box-shadow 0.15s ease, transform 0.15s ease'
      el.style.boxShadow = '0 0 0 14px rgba(0,0,0,0.07)'
      el.style.borderRadius = '12px'
      el.style.transform = 'scale(1.012)'

      // Step 4+5 — hold then ease back
      const fadeOut = setTimeout(() => {
        el.style.transition = 'box-shadow 1.0s ease, transform 0.7s ease'
        el.style.boxShadow = '0 0 0 0px transparent'
        el.style.transform = 'scale(1)'
        setTimeout(() => { el.style.cssText = '' }, 1050)
      }, 700)

      return () => clearTimeout(fadeOut)
    }, 150)

    // Step 6 — clean URL
    const cleanUrl = setTimeout(() => {
      router.replace(pathname)
    }, 3000)

    return () => {
      clearTimeout(startEffect)
      clearTimeout(cleanUrl)
    }
  }, [active, pathname, router])

  return null
}
