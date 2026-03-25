import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getTimelineEventsForMonth } from '@/actions/timeline'
import { DaysView } from '@/components/timeline/DaysView'
import { TimelinePageWrapper } from '@/components/timeline/TimelinePageWrapper'

interface Props {
  params: { year: string; month: string }
}

export default async function TimelineMonthPage({ params }: Props) {
  const year = Number(params.year)
  const month = Number(params.month)

  if (
    !Number.isInteger(year) || year < 1900 || year > 2100 ||
    !Number.isInteger(month) || month < 1 || month > 12
  ) {
    notFound()
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const dayGroups = await getTimelineEventsForMonth(year, month)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-28">
        <div className="pt-10 pb-2" />

        <TimelinePageWrapper>
          <DaysView year={year} month={month} dayGroups={dayGroups} />
        </TimelinePageWrapper>
      </div>
    </main>
  )
}
