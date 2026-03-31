import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getTimelineMemories } from '@/actions/memories'
import { TimelineAnimated } from '@/components/timeline/TimelineAnimated'
import { FIXED_CALENDAR_ANCHORS, isMemoryMatchingFixedAnchor } from '@/lib/utils/anchors'

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: { anchor?: string }
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const memories = await getTimelineMemories()

  // Resolve anchor filter from query param
  const anchorId = searchParams.anchor
  const anchor   = anchorId
    ? FIXED_CALENDAR_ANCHORS.find((a) => a.id === anchorId) ?? null
    : null

  const filteredMemories = anchor
    ? memories.filter((m) => isMemoryMatchingFixedAnchor(m.start_date, anchor))
    : memories

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-28">
        <TimelineAnimated
          memories={filteredMemories}
          anchorLabel={anchor?.label}
        />
      </div>
    </main>
  )
}
