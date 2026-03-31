'use client'

import { useRouter } from 'next/navigation'
import { type ComponentPropsWithoutRef, type MouseEvent } from 'react'

type TransitionLinkProps = ComponentPropsWithoutRef<'a'> & {
  href: string
}

/**
 * Drop-in replacement for <Link> that wraps navigation in
 * document.startViewTransition() when supported.
 * Falls back to router.push() on unsupported browsers.
 * Modifier-key clicks (cmd/ctrl/shift) are passed through unchanged
 * so "open in new tab" still works.
 */
export function TransitionLink({
  href,
  children,
  onClick,
  ...props
}: TransitionLinkProps) {
  const router = useRouter()

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    onClick?.(e)

    if (typeof document.startViewTransition !== 'function') {
      router.push(href)
      return
    }

    document.startViewTransition(() => {
      router.push(href)
    })
  }

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}
