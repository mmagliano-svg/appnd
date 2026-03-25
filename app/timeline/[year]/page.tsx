import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getTimelineMonthsForYear } from '@/actions/timeline'
import { MonthsView } from '@/components/timeline/MonthsView'
import { TimelinePageWrapper } from '@/components/timeline/TimelinePageWrapper'

interface Props {
  params: { year: string }
}

export default async function TimelineYearPage({ params }: Props) {
  const year = Number(params.year)
  if (!Number.isInteger(year) || year < 1900 || year > 2100) notFound()

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const months = await getTimelineMonthsForYear(year)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-28">
        <div className="pt-10 pb-2" />

        <TimelinePageWrapper>
          <MonthsView year={year} months={months} />
        </TimelinePageWrapper>
      </div>
    </main>
  )
}
