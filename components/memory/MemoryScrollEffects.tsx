'use client'

import { useEffect } from 'react'

/**
 * Cinematic scroll effects for the memory detail page.
 *
 * Hero (scroll-tied, rAF):
 *   - title + meta: opacity 1 → 0 as user scrolls away from hero
 *   - image: brightness + contrast subtly reduce (feels like a dream fading)
 *   - gradient: bottom darkens slightly
 *
 * Content blocks (IntersectionObserver):
 *   - description, contribution items: fade + rise in on first entry
 */
export function MemoryScrollEffects() {
  // ── Hero scroll effect ────────────────────────────────────────────────────
  useEffect(() => {
    const hero      = document.getElementById('memory-hero')
    const heroImg   = document.getElementById('memory-hero-img') as HTMLImageElement | null
    const heroText  = document.getElementById('memory-hero-text') as HTMLElement | null
    const heroGrad  = document.getElementById('memory-hero-gradient') as HTMLElement | null

    if (!hero) return

    let rafId = 0

    function applyHeroScroll() {
      const heroH  = hero!.getBoundingClientRect().height || 400
      const scrollY = window.scrollY
      // Progress 0 (at top) → 1 (scrolled past hero)
      const p = Math.min(scrollY / (heroH * 0.65), 1)

      if (heroText) {
        heroText.style.opacity = String(Math.max(0, 1 - p * 1.4))
      }

      if (heroImg) {
        const brightness = 1 - p * 0.07   // 1.0 → ~0.93
        const contrast   = 1 - p * 0.05   // 1.0 → ~0.95
        heroImg.style.filter = `brightness(${brightness}) contrast(${contrast})`
      }

      if (heroGrad) {
        const mid  = (0.52 + p * 0.14).toFixed(2)
        const bot  = (0.86 + p * 0.10).toFixed(2)
        heroGrad.style.background =
          `linear-gradient(to bottom, transparent 0%, transparent 32%, rgba(0,0,0,${mid}) 65%, rgba(0,0,0,${bot}) 100%)`
      }
    }

    function onScroll() {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(applyHeroScroll)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  // ── Content fade-in (IntersectionObserver) ────────────────────────────────
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('[data-fade-in]')
    if (targets.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            el.style.opacity  = '1'
            el.style.transform = 'translateY(0)'
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.08 },
    )

    targets.forEach((el) => {
      el.style.opacity    = '0'
      el.style.transform  = 'translateY(10px)'
      el.style.transition = 'opacity 480ms ease, transform 480ms ease'
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return null
}
