import { Suspense } from 'react'
import { getUserMemories, getAllUserTags } from '@/actions/memories'
import { DashboardClient } from '@/components/memory/DashboardClient'

export default async function DashboardPage() {
  const [memories, allTags] = await Promise.all([
    getUserMemories(),
    getAllUserTags(),
  ])

  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Caricamento…</p>
      </main>
    }>
      <DashboardClient memories={memories} allTags={allTags} />
    </Suspense>
  )
}
