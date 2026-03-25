import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getTimelineYears } from '@/actions/timeline'
import { YearsView } from '@/components/timeline/YearsView'
import { TimelinePageWrapper } from '@/components/timeline/TimelinePageWrapper'

export default async function TimelinePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const years = await getTimelineYears()

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-28">
        <div className="pt-10 pb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Timeline</h1>
          <p className="text-sm text-muted-foreground">La tua storia nel tempo.</p>
        </div>

        <TimelinePageWrapper>
          <YearsView yearGroups={years} />
        </TimelinePageWrapper>
      </div>
    </main>
  )
}
