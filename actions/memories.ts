'use server'

import { createServerClient } from '@/lib/supabase/server'
import { generateInviteToken } from '@/lib/utils/invite'
import { redirect } from 'next/navigation'

export interface CreateMemoryInput {
  title: string
  happened_at: string
  location_name?: string
  description?: string
}

export async function createMemory(input: CreateMemoryInput) {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/auth/login')

  const { data: memory, error: memoryError } = await supabase
    .from('memories')
    .insert({
      title: input.title.trim(),
      happened_at: input.happened_at,
      location_name: input.location_name?.trim() || null,
      description: input.description?.trim() || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (memoryError || !memory) {
    throw new Error('Impossibile creare il ricordo. Riprova.')
  }

  const { error: participantError } = await supabase
    .from('memory_participants')
    .insert({
      memory_id: memory.id,
      user_id: user.id,
      invite_token: generateInviteToken(),
      joined_at: new Date().toISOString(),
    })

  if (participantError) {
    throw new Error('Errore interno. Riprova.')
  }

  redirect(`/memories/${memory.id}`)
}

export async function getUserMemories() {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/auth/login')

  const { data, error } = await supabase
    .from('memory_participants')
    .select(`
      memory_id,
      joined_at,
      memories (
        id,
        title,
        happened_at,
        location_name,
        created_by,
        created_at,
        memory_contributions ( id )
      )
    `)
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)
    .order('joined_at', { ascending: false })

  if (error) throw new Error(`Impossibile caricare i ricordi. Dettaglio: ${error.message}`)

  return data
    .map((p) => p.memories)
    .filter(Boolean)
    .sort((a, b) => {
      if (!a || !b) return 0
      return new Date(b.happened_at).getTime() - new Date(a.happened_at).getTime()
    })
}
