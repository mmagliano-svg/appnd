import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getTimelineMemories } from '@/actions/memories'
import { TimelineAnimated } from '@/components/timeline/TimelineAnimated'

export default async function TimelinePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const memories = await getTimelineMemories()

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-28">
        <TimelineAnimated memories={memories} />
      </div>
    </main>
  )
}
