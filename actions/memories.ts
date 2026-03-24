'use server'

import { createServerClient } from '@/lib/supabase/server'
import { generateInviteToken } from '@/lib/utils/invite'
import { normalizeTags } from '@/lib/utils/tags'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export interface CreateMemoryInput {
  title: string
  happened_at: string
  location_name?: string
  description?: string
  category?: string
  tags?: string[]
}

export interface UpdateMemoryInput {
  id: string
  title: string
  happened_at: string
  location_name?: string
  description?: string
  category?: string
  tags?: string[]
}

// Non-redirecting version — returns memory ID, caller handles navigation
export async function createMemoryReturnId(input: CreateMemoryInput): Promise<string> {
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
      category: input.category || null,
      tags: normalizeTags(input.tags ?? []),
      created_by: user!.id,
    })
    .select('id')
    .single()

  if (memoryError || !memory) {
    throw new Error('Impossibile creare il ricordo. Riprova.')
  }

  await supabase.from('memory_participants').insert({
    memory_id: memory.id,
    user_id: user!.id,
    invite_token: generateInviteToken(),
    joined_at: new Date().toISOString(),
  })

  return memory.id
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
      category: input.category || null,
      tags: normalizeTags(input.tags ?? []),
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

export async function updateMemory(input: UpdateMemoryInput) {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/auth/login')

  // Only the creator can edit
  const { data: memory } = await supabase
    .from('memories')
    .select('created_by')
    .eq('id', input.id)
    .single()

  if (!memory || memory.created_by !== user.id) {
    throw new Error('Non hai i permessi per modificare questo ricordo.')
  }

  const { error } = await supabase
    .from('memories')
    .update({
      title: input.title.trim(),
      happened_at: input.happened_at,
      location_name: input.location_name?.trim() || null,
      description: input.description?.trim() || null,
      category: input.category || null,
      tags: normalizeTags(input.tags ?? []),
    })
    .eq('id', input.id)

  if (error) {
    throw new Error('Impossibile aggiornare il ricordo. Riprova.')
  }

  revalidatePath(`/memories/${input.id}`)
  redirect(`/memories/${input.id}`)
}

export async function deleteMemory(id: string) {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/auth/login')

  // Only creator can delete
  const { data: memory } = await supabase
    .from('memories')
    .select('created_by')
    .eq('id', id)
    .single()

  if (!memory || memory.created_by !== user.id) {
    throw new Error('Non hai i permessi per eliminare questo ricordo.')
  }

  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error('Impossibile eliminare il ricordo. Riprova.')
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
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
        description,
        category,
        tags,
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
    }) as Array<{
      id: string
      title: string
      happened_at: string
      location_name: string | null
      description: string | null
      category: string | null
      tags: string[]
      created_by: string
      created_at: string
      memory_contributions: { id: string }[]
    }>
}

export async function getAllUserTags(): Promise<string[]> {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return []

  const { data } = await supabase
    .from('memory_participants')
    .select(`
      memories ( tags )
    `)
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)

  if (!data) return []

  const allTags = data
    .flatMap((p) => (p.memories as { tags: string[] } | null)?.tags ?? [])
    .filter(Boolean)

  // Return unique tags sorted alphabetically
  return Array.from(new Set(allTags)).sort()
}
