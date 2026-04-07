'use client'

// ── /onboarding/restore ────────────────────────────────────────────────────
//
// Landing page after auth in the onboarding flow.
//
// Draft recovery priority:
//   1. Server-side draft  → fetched by token from URL (?draft=TOKEN)
//      This is the primary path and works across any browser context,
//      including Gmail webview and other mobile apps.
//   2. localStorage fallback → used when no token in URL (old flow / same browser)
//
// Full flow:
//   /create/photo (or /create/text)
//     → saveDraft() → token
//     → /auth/login?next=/onboarding/restore?draft=TOKEN
//     → magic link email: emailRedirectTo includes next= with token
//     → user clicks link (any browser/context)
//     → /auth/callback → redirect to /onboarding/restore?draft=TOKEN
//     → this page: fetchDraft(TOKEN) → create memory → celebrate

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createMemoryReturnId } from '@/actions/memories'
import { addFragment } from '@/actions/contributions'
import { createInvite, addNameParticipant } from '@/actions/invites'
import { fetchDraft, consumeDraft } from '@/actions/drafts'
import { createClient } from '@/lib/supabase/client'
import type { MemoryDraft } from '@/lib/onboarding/draft'
import { DRAFT_KEY } from '@/lib/onboarding/draft'

type RestoreState = 'loading' | 'saving' | 'uploading' | 'inviting' | 'error' | 'no-draft'

// ── Helpers ───────────────────────────────────────────────────────────────────

function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}

/**
 * Upload the draft photo (base64 data-URL) to Supabase Storage, then create
 * a photo contribution linked to the newly created memory.
 * Returns silently on any failure — memory is already saved.
 */
async function attachDraftPhoto(
  supabase: ReturnType<typeof createClient>,
  memoryId: string,
  imageDataUrl: string,
): Promise<void> {
  let blob: Blob
  try {
    blob = await dataUrlToBlob(imageDataUrl)
  } catch {
    return
  }

  const ext  = blob.type === 'image/png' ? 'png' : 'jpg'
  const path = `${memoryId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('memory-media')
    .upload(path, blob, { contentType: blob.type, upsert: false })

  if (uploadError) {
    console.error('[restore] photo upload failed:', uploadError.message)
    return
  }

  const { data: { publicUrl } } = supabase.storage
    .from('memory-media')
    .getPublicUrl(path)

  if (!publicUrl) return

  const result = await addFragment({
    memoryId,
    content_type: 'photo',
    media_url: publicUrl,
  })

  if (result.error) {
    console.error('[restore] addFragment failed:', result.error)
  }
}

// ── Inner component (reads searchParams) ──────────────────────────────────────

function RestoreContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const draftToken   = searchParams.get('draft') ?? ''

  const [state,    setState]    = useState<RestoreState>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false

    async function restore() {
      // Step 1 — ensure user is authenticated (retry up to 5× for session lag)
      const supabase = createClient()
      let user = null

      for (let attempt = 0; attempt < 5; attempt++) {
        const { data } = await supabase.auth.getUser()
        if (data.user) { user = data.user; break }
        await new Promise((r) => setTimeout(r, attempt === 0 ? 300 : 800))
      }

      if (!user) {
        // Re-attach draft token so recovery survives a re-login
        const redirectBack = draftToken
          ? `/onboarding/restore?draft=${draftToken}`
          : '/onboarding/restore'
        router.replace('/auth/login?next=' + encodeURIComponent(redirectBack))
        return
      }

      // Step 2 — read draft
      //   Primary:   server-side fetch by token (works in any browser context)
      //   Fallback:  localStorage (same-browser path, backward compat)
      let draft: MemoryDraft | null = null

      if (draftToken) {
        try {
          const serverDraft = await fetchDraft(draftToken)
          if (serverDraft) {
            draft = {
              title:         serverDraft.title,
              description:   serverDraft.description,
              start_date:    serverDraft.start_date,
              image_data_url: serverDraft.image_data,
              people:        serverDraft.people,
            }
          }
        } catch (err) {
          console.error('[restore] fetchDraft failed:', err)
          // Fall through to localStorage
        }
      }

      // localStorage fallback (same-browser case, or server draft unavailable)
      if (!draft?.title?.trim()) {
        try {
          const raw = localStorage.getItem(DRAFT_KEY)
          if (raw) draft = JSON.parse(raw) as MemoryDraft
        } catch {
          // parse failed
        }
      }

      if (!draft?.title?.trim()) {
        if (!cancelled) setState('no-draft')
        return
      }

      if (cancelled) return
      setState('saving')

      // Step 3 — create memory (retry once on transient error)
      let memoryId: string | null = null

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          memoryId = await createMemoryReturnId({
            title:       draft.title,
            start_date:  draft.start_date,
            description: draft.description || undefined,
            categories:  [],
            tags:        [],
          })
          break
        } catch (err) {
          if (attempt < 1) {
            await new Promise((r) => setTimeout(r, 1000))
            continue
          }
          const msg = err instanceof Error ? err.message : 'Qualcosa è andato storto.'
          if (!cancelled) { setState('error'); setErrorMsg(msg) }
          return
        }
      }

      if (!memoryId || cancelled) return

      // Step 4 — upload photo if the draft carried one
      if (draft.image_data_url) {
        if (!cancelled) setState('uploading')
        await attachDraftPhoto(supabase, memoryId, draft.image_data_url)
      }

      // Step 5 — process people from the draft
      //   email → invite (magic link sent)
      //   name  → presence-only participant row (no email)
      const draftPeople = (draft.people ?? []).map(p => p.value.trim()).filter(Boolean)

      if (draftPeople.length > 0) {
        if (!cancelled) setState('inviting')
        for (const value of draftPeople) {
          if (looksLikeEmail(value)) {
            try { await createInvite(memoryId, value) }
            catch (err) { console.error('[restore] email invite failed for', value, err) }
          } else {
            try { await addNameParticipant(memoryId, value) }
            catch (err) { console.error('[restore] name participant failed for', value, err) }
          }
        }
      }

      // Step 6 — mark draft consumed + clean up localStorage
      if (draftToken) {
        try { await consumeDraft(draftToken) } catch { /* non-blocking */ }
      }
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ }

      if (!cancelled) router.replace(`/onboarding/celebrate?id=${memoryId}`)
    }

    restore()
    return () => { cancelled = true }
  }, [router, draftToken])

  // ── Manual retry ────────────────────────────────────────────────────────────
  function handleRetry() {
    setState('loading')
    setErrorMsg('')
    // Preserve draft token on retry so recovery still works
    const retryUrl = draftToken
      ? `/onboarding/restore?draft=${draftToken}`
      : '/onboarding/restore'
    router.replace(retryUrl)
  }

  // ── No-draft fallback ────────────────────────────────────────────────────────
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

  // ── Error state ──────────────────────────────────────────────────────────────
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

  // ── Loading / saving / uploading state (default) ─────────────────────────────
  const statusLabel =
    state === 'saving'    ? 'Salvando il tuo momento…'  :
    state === 'uploading' ? 'Caricando la foto…'         :
    state === 'inviting'  ? 'Avvisando le persone…'      :
    'Un momento…'

  return (
    <main
      className="h-[100dvh] flex flex-col items-center justify-center px-8 text-center"
      style={{ background: '#F7F7F5' }}
    >
      <div className="space-y-4">
        <div
          className="mx-auto w-10 h-10 rounded-full border-2 animate-spin"
          style={{
            borderColor:    'rgba(17,17,17,0.08)',
            borderTopColor: '#6B5FE8',
          }}
        />
        <p className="text-[15px]" style={{ color: '#ABABAB' }}>
          {statusLabel}
        </p>
      </div>
    </main>
  )
}

// ── Page export — Suspense required for useSearchParams ───────────────────────

export default function OnboardingRestorePage() {
  return (
    <Suspense
      fallback={
        <main
          className="h-[100dvh] flex flex-col items-center justify-center px-8 text-center"
          style={{ background: '#F7F7F5' }}
        >
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(17,17,17,0.08)', borderTopColor: '#6B5FE8' }}
          />
        </main>
      }
    >
      <RestoreContent />
    </Suspense>
  )
}
