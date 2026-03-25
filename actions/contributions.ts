'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { ContentType } from '@/lib/supabase/types'
import { sendContributionNotification } from '@/lib/email/notifications'

export interface CreateContributionInput {
  memoryId: string
  content_type: ContentType
  text_content?: string
  media_url?: string
  caption?: string
}

export async function createContribution(input: CreateContributionInput) {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/auth/login')

  const { data: participant } = await supabase
    .from('memory_participants')
    .select('id')
    .eq('memory_id', input.memoryId)
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)
    .single()

  if (!participant) {
    throw new Error('Non sei un partecipante di questo ricordo.')
  }

  const { error } = await supabase
    .from('memory_contributions')
    .insert({
      memory_id: input.memoryId,
      author_id: user.id,
      content_type: input.content_type,
      text_content: input.text_content?.trim() || null,
      media_url: input.media_url || null,
      caption: input.caption?.trim() || null,
    })

  if (error) {
    throw new Error('Impossibile salvare il contributo. Riprova.')
  }

  // ── Notify other participants ────────────────────────────────────────────
  // Fire-and-forget: email failures must never break the contribution flow.
  try {
    // Fetch memory title + contributor display name in parallel
    const [{ data: memory }, { data: contributor }] = await Promise.all([
      supabase.from('memories').select('title').eq('id', input.memoryId).single(),
      supabase.from('users').select('display_name, email').eq('id', user.id).single(),
    ])

    if (memory && contributor) {
      const contributorName =
        contributor.display_name ?? contributor.email ?? 'Qualcuno'

      // Get all OTHER joined participants with their email addresses
      const { data: participants } = await supabase
        .from('memory_participants')
        .select('user_id')
        .eq('memory_id', input.memoryId)
        .neq('user_id', user.id)           // exclude the contributor
        .not('joined_at', 'is', null)       // only joined participants

      if (participants && participants.length > 0) {
        const userIds = participants
          .map((p) => p.user_id)
          .filter(Boolean) as string[]

        const { data: recipientUsers } = await supabase
          .from('users')
          .select('email')
          .in('id', userIds)

        // Send one email per recipient — silent on individual failures
        await Promise.allSettled(
          (recipientUsers ?? []).map((r) =>
            sendContributionNotification({
              recipientEmail: r.email,
              contributorName,
              memoryTitle: memory.title,
              memoryId: input.memoryId,
              contentType: input.content_type,
            })
          )
        )
      }
    }
  } catch {
    // Intentionally silent — email is best-effort
  }

  revalidatePath(`/memories/${input.memoryId}`)
  redirect(`/memories/${input.memoryId}`)
}

// Non-redirecting version — used when the caller handles navigation
export async function addMediaContribution(
  memoryId: string,
  mediaUrl: string,
  caption?: string
) {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/auth/login')

  await supabase.from('memory_contributions').insert({
    memory_id: memoryId,
    author_id: user!.id,
    content_type: 'photo' as ContentType,
    media_url: mediaUrl,
    caption: caption?.trim() || null,
    text_content: null,
  })
}
