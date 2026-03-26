import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getSharedPeople } from '@/actions/people'
import { ShareFlowClient } from '@/components/invite/ShareFlowClient'

export default async function SharePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { new?: string }
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verify memory exists and user has access
  const { data: memory } = await supabase
    .from('memories')
    .select('id, title, start_date, location_name')
    .eq('id', params.id)
    .single()
  if (!memory) notFound()

  const { data: participant } = await supabase
    .from('memory_participants')
    .select('id')
    .eq('memory_id', params.id)
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)
    .single()
  if (!participant) notFound()

  // Get first photo for hero
  const { data: photoRow } = await supabase
    .from('memory_contributions')
    .select('media_url')
    .eq('memory_id', params.id)
    .eq('content_type', 'photo')
    .not('media_url', 'is', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  // Existing contacts for quick-select
  const contacts = await getSharedPeople()

  return (
    <ShareFlowClient
      memoryId={params.id}
      memoryTitle={memory.title}
      memoryDate={memory.start_date}
      memoryLocation={memory.location_name}
      heroPhoto={(photoRow as { media_url: string } | null)?.media_url ?? null}
      contacts={contacts}
      isNewMemory={searchParams.new === '1'}
    />
  )
}
