'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PublicStoryData {
  title: string
  year: number
  month: number
  authorName: string
  memories: {
    id: string
    title: string
    description: string | null
    start_date: string
    location_name: string | null
    photoUrl: string | null
  }[]
}

// ── Get or create a share token ───────────────────────────────────────────────

export async function getOrCreateStoryToken(
  year: number,
  month: number,
  memoryIds: string[],
  title: string,
): Promise<{ token: string } | { error: string }> {
  const supabase = await createServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Non autenticato' }

  // Return existing token if already shared
  const { data: existing } = await supabase
    .from('shared_stories')
    .select('token')
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()

  if (existing) return { token: existing.token }

  // Create new share record
  const { data, error } = await supabase
    .from('shared_stories')
    .insert({ user_id: user.id, year, month, memory_ids: memoryIds, title })
    .select('token')
    .single()

  if (error || !data) return { error: 'Errore nella creazione della storia' }
  return { token: data.token }
}

// ── Fetch public story (service role — bypasses RLS) ─────────────────────────

export async function getPublicStory(token: string): Promise<PublicStoryData | null> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: story } = await admin
    .from('shared_stories')
    .select('*')
    .eq('token', token)
    .single()

  if (!story) return null

  const { data: author } = await admin
    .from('users')
    .select('display_name, email')
    .eq('id', story.user_id)
    .single()

  const { data: memories } = await admin
    .from('memories')
    .select(`
      id, title, description, start_date, location_name,
      memory_contributions ( media_url, content_type )
    `)
    .in('id', story.memory_ids as string[])
    .order('start_date', { ascending: true })

  if (!memories) return null

  return {
    title: story.title as string,
    year: story.year as number,
    month: story.month as number,
    authorName: author?.display_name ?? author?.email ?? 'Utente Appnd',
    memories: memories.map((m) => {
      type Contrib = { media_url: string | null; content_type: string }
      const photo = (m.memory_contributions as Contrib[])
        ?.find((c) => c.content_type === 'photo' && c.media_url)
      return {
        id: m.id,
        title: m.title,
        description: m.description ?? null,
        start_date: m.start_date,
        location_name: m.location_name ?? null,
        photoUrl: photo?.media_url ?? null,
      }
    }),
  }
}
