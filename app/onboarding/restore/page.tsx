'use client'

// ── /onboarding/restore ────────────────────────────────────────────────────
// Landing page after auth in the onboarding flow.
// Reads the memory draft stored in localStorage by /onboarding/create,
// creates the memory via server action, then redirects to celebrate page.
//
// Auth flow:
//   /onboarding/create → localStorage draft → /auth/login?next=/onboarding/restore
//   → /onboarding/restore → createMemoryReturnId → /onboarding/celebrate?id=xxx

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMemoryReturnId } from '@/actions/memories'
import { createClient } from '@/lib/supabase/client'
import type { MemoryDraft } from '@/lib/onboarding/draft'
import { DRAFT_KEY } from '@/lib/onboarding/draft'

type RestoreState = 'loading' | 'saving' | 'error' | 'no-draft'

export default function OnboardingRestorePage() {
  const router = useRouter()
  const [state, setState] = useState<RestoreState>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false

    async function restore() {
      // Step 1 — ensure user is authenticated (retry up to 5× for session propagation lag)
      const supabase = createClient()
      let user = null

      for (let attempt = 0; attempt < 5; attempt++) {
        const { data } = await supabase.auth.getUser()
        if (data.user) { user = data.user; break }
        await new Promise((r) => setTimeout(r, attempt === 0 ? 300 : 800))
      }

      if (!user) {
        // Session never established — send back to auth
        router.replace('/auth/login?next=' + encodeURIComponent('/onboarding/restore'))
        return
      }

      // Step 2 — read draft from localStorage
      let draft: MemoryDraft | null = null
      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (raw) draft = JSON.parse(raw) as MemoryDraft
      } catch {
        // parse failed — proceed without draft (show fallback)
      }

      if (!draft?.title?.trim()) {
        // No draft found — let user create directly (already logged in)
        if (!cancelled) setState('no-draft')
        return
      }

      if (cancelled) return
      setState('saving')

      // Step 3 — create memory (retry once on transient server error)
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const memoryId = await createMemoryReturnId({
            title: draft.title,
            start_date: draft.start_date,
            description: draft.description || undefined,
            categories: [],
            tags: [],
          })

          // Clean up draft
          try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ }

          if (!cancelled) router.replace(`/onboarding/celebrate?id=${memoryId}`)
          return
        } catch (err) {
          if (attempt < 1) {
            // Wait before retry
            await new Promise((r) => setTimeout(r, 1000))
            continue
          }
          // Both attempts failed
          const msg = err instanceof Error ? err.message : 'Qualcosa è andato storto.'
          if (!cancelled) {
            setState('error')
            setErrorMsg(msg)
          }
          return
        }
      }
    }

    restore()
    return () => { cancelled = true }
  }, [router])

  // ── Manual retry ──────────────────────────────────────────────────────────
  function handleRetry() {
    setState('loading')
    setErrorMsg('')
    // Re-run the effect by navigating to the same page
    router.replace('/onboarding/restore')
  }

  // ── No draft fallback ────────────────────────────────────────────────────
  if (state === 'no-draft') {
    return (
      <main
        className="h-[100dvh] flex flex-col items-center justify-center px-8 text-center"
        style={{ background: '#F7F7F5' }}
      >
        <div className="space-y-6 max-w-xs">
          <h2
            className="text-[24px] font-semibold tracking-[-0.02em]"
            style={{ color: '#111111' }}
          >
            Tutto pronto
          </h2>
          <p className="text-[15px]" style={{ color: '#ABABAB' }}>
            Nessun momento in attesa. Puoi crearne uno adesso.
          </p>
          <button
            onClick={() => router.push('/memories/new')}
            className="w-full rounded-2xl py-4 text-[16px] font-medium transition-transform active:scale-[0.985]"
            style={{ background: '#6B5FE8', color: '#ffffff' }}
          >
            Crea un momento
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="block text-[14px] text-center"
            style={{ color: 'rgba(17,17,17,0.30)' }}
          >
            Vai alla home
          </button>
        </div>
      </main>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <main
        className="h-[100dvh] flex flex-col items-center justify-center px-8 text-center"
        style={{ background: '#F7F7F5' }}
      >
        <div className="space-y-6 max-w-xs">
          <h2
            className="text-[24px] font-semibold tracking-[-0.02em]"
            style={{ color: '#111111' }}
          >
            Qualcosa è andato storto
          </h2>
          <p className="text-[14px]" style={{ color: '#ABABAB' }}>
            {errorMsg || 'Riprova tra qualche secondo.'}
          </p>
          <button
            onClick={handleRetry}
            className="w-full rounded-2xl py-4 text-[16px] font-medium transition-transform active:scale-[0.985]"
            style={{ background: '#6B5FE8', color: '#ffffff' }}
          >
            Riprova
          </button>
          <button
            onClick={() => router.push('/onboarding/create')}
            className="block text-[14px] text-center"
            style={{ color: 'rgba(17,17,17,0.30)' }}
          >
            Ricomincia
          </button>
        </div>
      </main>
    )
  }

  // ── Loading / saving state (default) ─────────────────────────────────────
  return (
    <main
      className="h-[100dvh] flex flex-col items-center justify-center px-8 text-center"
      style={{ background: '#F7F7F5' }}
    >
      <div className="space-y-4">
        {/* Spinner */}
        <div
          className="mx-auto w-10 h-10 rounded-full border-2 animate-spin"
          style={{
            borderColor: 'rgba(17,17,17,0.08)',
            borderTopColor: '#6B5FE8',
          }}
        />
        <p className="text-[15px]" style={{ color: '#ABABAB' }}>
          {state === 'saving' ? 'Salvando il tuo momento…' : 'Un momento…'}
        </p>
      </div>
    </main>
  )
}
