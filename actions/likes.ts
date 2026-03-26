'use server'

import { createServerClient } from '@/lib/supabase/server'

export interface LikeState {
  count: number
  likedByMe: boolean
}

export async function getLikeState(memoryId: string): Promise<LikeState> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, count } = await supabase
    .from('memory_likes')
    .select('user_id', { count: 'exact' })
    .eq('memory_id', memoryId)

  const likedByMe = Boolean(user && (data ?? []).some((r) => r.user_id === user.id))
  return { count: count ?? 0, likedByMe }
}

export async function toggleLike(
  memoryId: string,
): Promise<LikeState & { error?: string }> {
  const supabase = await createServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { count: 0, likedByMe: false, error: 'Non autenticato' }

  // Check if already liked
  const { data: existing } = await supabase
    .from('memory_likes')
    .select('user_id')
    .eq('memory_id', memoryId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('memory_likes')
      .delete()
      .eq('memory_id', memoryId)
      .eq('user_id', user.id)
  } else {
    await supabase
      .from('memory_likes')
      .insert({ memory_id: memoryId, user_id: user.id })
  }

  return getLikeState(memoryId)
}
