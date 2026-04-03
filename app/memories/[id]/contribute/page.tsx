import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ContributeFlow } from '@/components/memory/ContributeFlow'

export default async function ContributePage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch memory title + first photo + participant count for context header
  const { data: memory } = await supabase
    .from('memories')
    .select('id, title, memory_contributions(content_type, media_url), memory_participants(user_id, joined_at)')
    .eq('id', params.id)
    .single()

  if (!memory) notFound()

  const previewUrl =
    (
      memory.memory_contributions as {
        content_type: string
        media_url: string | null
      }[]
    ).find((c) => c.content_type === 'photo' && c.media_url)?.media_url ?? null

  const participantCount = (
    memory.memory_participants as { user_id: string | null; joined_at: string | null }[]
  ).filter((p) => p.joined_at != null).length

  return (
    <ContributeFlow
      memoryId={params.id}
      memoryTitle={memory.title}
      previewUrl={previewUrl}
      participantCount={participantCount}
    />
  )
}
