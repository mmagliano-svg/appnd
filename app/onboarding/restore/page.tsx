'use client'

// ── /onboarding/restore ────────────────────────────────────────────────────
// Landing page after auth in the onboarding flow.
// Reads the memory draft stored in localStorage by /create/photo or /create/text,
// creates the memory via server action, uploads any saved photo, then redirects.
//
// Auth flow:
//   /create/photo (or /create/text)
//     → localStorage draft (title, description, start_date, image_data_url?)
//     → /auth/login?next=/onboarding/restore
//     → /onboarding/restore
//     → createMemoryReturnId + optional photo upload
//     → /onboarding/celebrate?id=xxx

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMemoryReturnId } from '@/actions/memories'
import { addFragment } from '@/actions/contributions'
import { createInvite } from '@/actions/invites'
import { createClient } from '@/lib/supabase/client'
import type { MemoryDraft } from '@/lib/onboarding/draft'
import { DRAFT_KEY } from '@/lib/onboarding/draft'

type RestoreState = 'loading' | 'saving' | 'uploading' | 'inviting' | 'error' | 'no-draft'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true when a string looks like an email address */
function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert a base64 data-URL into a Blob */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}

/**
 * Upload the draft photo (base64 data-URL) to Supabase Storage, then create
 * a photo contribution linked to the newly created memory.
 * Returns silently on any failure — the memory is already saved, so a photo
 * upload failure should never break the flow.
 */
async function attachDraftPhoto(
  supabase: ReturnType<typeof createClient>,
  memoryId: string,
  imageDataUrl: string,
): Promise<void> {
  // 1. Convert base64 → Blob
  let blob: Blob
  try {
    blob = await dataUrlToBlob(imageDataUrl)
  } catch {
    return // conversion failed — silent fallback
  }

  // 2. Upload to Supabase Storage (same bucket + path format as ContributeFlow)
  const ext  = blob.type === 'image/png' ? 'png' : 'jpg'
  const path = `${memoryId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('memory-media')
    .upload(path, blob, { contentType: blob.type, upsert: false })

  if (uploadError) {
    console.error('[restore] photo upload failed:', uploadError.message)
    return
  }

  // 3. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('memory-media')
    .getPublicUrl(path)

  if (!publicUrl) return

  // 4. Create a photo contribution — links the image to the memory
  const result = await addFragment({
    memoryId,
    content_type: 'photo',
    media_url: publicUrl,
  })

  if (result.error) {
    console.error('[restore] addFragment failed:', result.error)
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingRestorePage() {
  const router = useRouter()
  const [state, setState] = useState<RestoreState>('loading')
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
        router.replace('/auth/login?next=' + encodeURIComponent('/onboarding/restore'))
        return
      }

      // Step 2 — read draft from localStorage
      let draft: MemoryDraft | null = null
      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (raw) draft = JSON.parse(raw) as MemoryDraft
      } catch {
        // parse failed — show fallback
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

      // Step 5 — create invites for any email-based people in the draft
      const emailPeople = (draft.people ?? [])
        .map(p => p.value.trim())
        .filter(v => v && looksLikeEmail(v))

      if (emailPeople.length > 0) {
        if (!cancelled) setState('inviting')
        for (const email of emailPeople) {
          try {
            await createInvite(memoryId, email)
          } catch (err) {
            // An individual invite failure must never block the flow
            console.error('[restore] invite failed for', email, err)
          }
        }
      }

      // Step 6 — clean up localStorage and navigate
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ }

      if (!cancelled) router.replace(`/onboarding/celebrate?id=${memoryId}`)
    }

    restore()
    return () => { cancelled = true }
  }, [router])

  // ── Manual retry ────────────────────────────────────────────────────────────
  function handleRetry() {
    setState('loading')
    setErrorMsg('')
    router.replace('/onboarding/restore')
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
    state === 'saving'    ? 'Salvando il tuo momento…'   :
    state === 'uploading' ? 'Caricando la foto…'          :
    state === 'inviting'  ? 'Avvisando le persone…'       :
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
