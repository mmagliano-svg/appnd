'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updateDisplayName(
  displayName: string,
): Promise<{ error?: string } | void> {
  const trimmed = displayName.trim()
  if (!trimmed) return { error: 'Il nome non può essere vuoto.' }
  if (trimmed.length > 60) return { error: 'Il nome è troppo lungo (max 60 caratteri).' }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { error } = await supabase
    .from('users')
    .update({ display_name: trimmed })
    .eq('id', user.id)

  if (error) return { error: 'Errore durante il salvataggio. Riprova.' }
}

export async function updateBirthDate(
  birthDate: string,
): Promise<{ error?: string } | void> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { error } = await supabase
    .from('users')
    .update({ birth_date: birthDate || null } as Record<string, unknown>)
    .eq('id', user.id)

  if (error) return { error: 'Errore durante il salvataggio. Riprova.' }
}
