'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * Client component: smoothly scrolls to #fragment-latest and applies a brief
 * scale + glow when the user returns from the contribute flow (?contributed=1).
 * Cleans the URL after the effect completes.
 */
export function TimelineHighlight({ active }: { active: boolean }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!active) return

    const el = document.getElementById('fragment-latest')
    if (!el) return

    // Smooth scroll — lands fragment in the center of viewport
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Scale + glow in (slight delay so scroll completes first)
    const startEffect = setTimeout(() => {
      el.style.transition = 'box-shadow 0.15s ease, transform 0.15s ease'
      el.style.boxShadow = '0 0 0 14px rgba(0,0,0,0.07)'
      el.style.borderRadius = '12px'
      el.style.transform = 'scale(1.012)'

      // Ease back to neutral after 700ms
      const fadeOut = setTimeout(() => {
        el.style.transition = 'box-shadow 1.0s ease, transform 0.7s ease'
        el.style.boxShadow = '0 0 0 0px transparent'
        el.style.transform = 'scale(1)'
        setTimeout(() => { el.style.cssText = '' }, 1050)
      }, 700)

      return () => clearTimeout(fadeOut)
    }, 350)

    // Clean URL (?contributed=1) after effect fully ends
    const cleanUrl = setTimeout(() => {
      router.replace(pathname)
    }, 3200)

    return () => {
      clearTimeout(startEffect)
      clearTimeout(cleanUrl)
    }
  }, [active, pathname, router])

  return null
}
