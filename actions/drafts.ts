'use server'

// Server-side persistence for the pre-auth onboarding draft.
//
// Why this exists:
//   The create flow collects a title, optional photo, and people before the
//   user authenticates.  Previously this state lived only in localStorage,
//   which breaks when the user opens the magic link from Gmail (webview) or
//   a different browser — both have empty localStorage.
//
//   Solution: persist the draft in the database using the service-role client
//   before redirecting to auth.  The draft is identified by an opaque 64-char
//   hex token that travels in the URL (part of the `next` param):
//
//     /auth/login?next=/onboarding/restore?draft=TOKEN
//       → emailRedirectTo includes next= encoded
//       → callback redirects to /onboarding/restore?draft=TOKEN
//       → restore reads TOKEN from URL, fetches draft from server
//
//   localStorage remains as a secondary fallback for the same-browser path.

import { createAdminClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import type { DraftPerson } from '@/lib/onboarding/draft'

export interface SaveDraftInput {
  title: string
  description: string
  start_date: string
  /** Compressed base64 JPEG data-URL from Canvas API — optional */
  image_data?: string
  /** People the user added ("Chi era con te?") — optional */
  people?: DraftPerson[]
}

/**
 * Persists the pre-auth onboarding draft server-side.
 *
 * Called from client components before redirecting to auth.
 * Does NOT require authentication — uses service-role client.
 * Returns an opaque token that uniquely identifies this draft across any
 * browser context (Gmail webview, different browser, incognito, etc.).
 */
export async function saveDraft(input: SaveDraftInput): Promise<{ token: string }> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('onboarding_drafts')
    .insert({
      title:       input.title,
      description: input.description || null,
      start_date:  input.start_date,
      image_data:  input.image_data || null,
      people:      input.people?.length
        ? (input.people as unknown as Json)
        : null,
    })
    .select('token')
    .single()

  if (error || !data) {
    throw new Error('Impossibile salvare il momento. Riprova.')
  }

  return { token: data.token }
}

/**
 * Fetches a draft by its opaque token.
 *
 * Returns null if:
 * - Token not found
 * - Draft already consumed (cannot replay)
 * - Draft expired (> 7 days old)
 */
export async function fetchDraft(token: string): Promise<{
  title: string
  description: string
  start_date: string
  image_data?: string
  people?: DraftPerson[]
} | null> {
  if (!token || token.length < 10) return null

  const admin = createAdminClient()

  const { data } = await admin
    .from('onboarding_drafts')
    .select('title, description, start_date, image_data, people, consumed_at, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (!data) return null
  if (data.consumed_at) return null                            // already used
  if (new Date(data.expires_at) < new Date()) return null     // expired

  return {
    title:      data.title,
    description: data.description ?? '',
    start_date: data.start_date,
    image_data: data.image_data ?? undefined,
    people:     Array.isArray(data.people)
      ? (data.people as unknown as DraftPerson[])
      : undefined,
  }
}

/**
 * Marks a draft as consumed so it cannot be replayed.
 * Called after the memory has been successfully created.
 * Idempotent — safe to call multiple times.
 */
export async function consumeDraft(token: string): Promise<void> {
  if (!token) return
  const admin = createAdminClient()
  await admin
    .from('onboarding_drafts')
    .update({ consumed_at: new Date().toISOString() })
    .eq('token', token)
    .is('consumed_at', null)   // only update if not already consumed
}
