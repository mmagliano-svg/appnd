import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ProfileClient } from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch profile from users table
  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, email, created_at')
    .eq('id', user.id)
    .single()

  const stats = await (async () => {
    const { count: memoriesCount } = await supabase
      .from('memory_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('joined_at', 'is', null)

    const { count: contribCount } = await supabase
      .from('memory_contributions')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id)

    return {
      memories: memoriesCount ?? 0,
      contributions: contribCount ?? 0,
    }
  })()

  return (
    <ProfileClient
      userId={user.id}
      email={profile?.email ?? user.email ?? ''}
      initialDisplayName={profile?.display_name ?? ''}
      initialBirthDate={(() => {
        // birth_date column added by migration 0023 — not yet in TS types.
        // Safe cast: returns empty string if column doesn't exist yet.
        const p = profile as { birth_date?: string | null } | null
        return p?.birth_date ?? ''
      })()}
      memberSince={profile?.created_at ?? user.created_at}
      stats={stats}
    />
  )
}
