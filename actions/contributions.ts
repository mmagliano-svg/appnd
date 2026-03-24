'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { ContentType } from '@/lib/supabase/types'

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
