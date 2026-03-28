import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ShareStep } from '@/components/memory/ShareStep'

export default async function SharePage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: memory } = await supabase
    .from('memories')
    .select('id, title')
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

  const { data: rows } = await supabase
    .from('memory_people')
    .select('people ( id, name )')
    .eq('memory_id', params.id)

  const people = (rows ?? [])
    .map((r) => r.people as { id: string; name: string } | null)
    .filter(Boolean) as { id: string; name: string }[]

  if (people.length === 0) redirect(`/memories/${params.id}`)

  return <ShareStep memoryId={params.id} memoryTitle={memory.title} people={people} />
}
