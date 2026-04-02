import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ContributeFlow } from '@/components/memory/ContributeFlow'

export default async function ContributePage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch memory title + first photo for context header
  const { data: memory } = await supabase
    .from('memories')
    .select('id, title, memory_contributions(content_type, media_url)')
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

  return (
    <ContributeFlow
      memoryId={params.id}
      memoryTitle={memory.title}
      previewUrl={previewUrl}
    />
  )
}
