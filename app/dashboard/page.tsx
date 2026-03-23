import { getUserMemories, getAllUserTags } from '@/actions/memories'
import { DashboardClient } from '@/components/memory/DashboardClient'

export default async function DashboardPage() {
  const [memories, allTags] = await Promise.all([
    getUserMemories(),
    getAllUserTags(),
  ])

  return <DashboardClient memories={memories} allTags={allTags} />
}
