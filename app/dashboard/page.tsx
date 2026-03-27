import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getUserMemories, getAllUserTags } from '@/actions/memories'
import { getTopPeople } from '@/actions/persons'
import { getUserGroups } from '@/actions/groups'
import { DashboardClient } from '@/components/memory/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, email')
    .eq('id', user.id)
    .single()

  const [memories, allTags, people, groups] = await Promise.all([
    getUserMemories(),
    getAllUserTags(),
    getTopPeople(6),
    getUserGroups(),
  ])

  // New user with no memories → onboarding
  if (memories.length === 0) redirect('/onboarding')

  const displayName = profile?.display_name ?? profile?.email ?? user.email ?? ''

  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Caricamento…</p>
      </main>
    }>
      <DashboardClient
        memories={memories}
        allTags={allTags}
        people={people}
        groups={groups}
        currentUser={{ displayName }}
      />
    </Suspense>
  )
}
