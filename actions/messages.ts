'use server'

import { createServerClient } from '@/lib/supabase/server'

export interface Message {
  id: string
  memory_id: string
  author_id: string
  content: string
  created_at: string
  author: {
    display_name: string | null
    email: string
    avatar_url: string | null
  }
}

// ── Fetch all messages for a memory ──────────────────────────────────────────

export async function getMessages(memoryId: string): Promise<Message[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('memory_messages')
    .select(`
      id, memory_id, author_id, content, created_at,
      users ( display_name, email, avatar_url )
    `)
    .eq('memory_id', memoryId)
    .order('created_at', { ascending: true })

  if (error || !data) return []

  return data.map((m) => {
    const u = m.users as unknown as { display_name: string | null; email: string; avatar_url: string | null } | null
    return {
      id: m.id,
      memory_id: m.memory_id,
      author_id: m.author_id,
      content: m.content,
      created_at: m.created_at,
      author: {
        display_name: u?.display_name ?? null,
        email: u?.email ?? '',
        avatar_url: u?.avatar_url ?? null,
      },
    }
  })
}

// ── Send a message ────────────────────────────────────────────────────────────

export async function sendMessage(
  memoryId: string,
  content: string,
): Promise<{ error?: string }> {
  const supabase = await createServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Non autenticato' }

  const trimmed = content.trim()
  if (!trimmed || trimmed.length > 2000) return { error: 'Messaggio non valido' }

  const { error } = await supabase
    .from('memory_messages')
    .insert({ memory_id: memoryId, author_id: user.id, content: trimmed })

  if (error) return { error: 'Errore nell\'invio del messaggio' }
  return {}
}
