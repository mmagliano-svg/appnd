import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function PersonPage({ params }: { params: { userId: string } }) {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: otherUser } = await supabase
    .from('users')
    .select('id, display_name, email')
    .eq('id', params.userId)
    .single()

  if (!otherUser) notFound()

  const { data: myParticipations } = await supabase
    .from('memory_participants')
    .select('memory_id')
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)

  const myMemoryIds = (myParticipations ?? []).map((p) => p.memory_id)

  const { data: sharedParticipations } = await supabase
    .from('memory_participants')
    .select('memory_id')
    .eq('user_id', params.userId)
    .not('joined_at', 'is', null)
    .in('memory_id', myMemoryIds)

  const sharedIds = (sharedParticipations ?? []).map((p) => p.memory_id)

  const { data: memories } = await supabase
    .from('memories')
    .select(`
      id, title, happened_at, location_name,
      memory_contributions ( id )
    `)
    .in('id', sharedIds)
    .order('happened_at', { ascending: false })

  const otherName = otherUser.display_name ?? otherUser.email

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <div className="py-8 space-y-6">
        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground block mb-4">
            ← I tuoi ricordi
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Noi & {otherName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {memories?.length ?? 0} moment{(memories?.length ?? 0) === 1 ? 'o' : 'i'} condivisi
          </p>
        </div>

        {!memories || memories.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-4xl">🌱</p>
            <p className="text-muted-foreground text-sm">
              Non avete ancora ricordi condivisi.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {memories.map((memory) => (
              <li key={memory.id}>
                <Link href={`/memories/${memory.id}`}>
                  <div className="rounded-xl border bg-card p-4 hover:bg-accent transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-medium text-sm">{memory.title}</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(memory.happened_at)}
                          {memory.location_name && ` · ${memory.location_name}`}
                        </p>
                      </div>
                      {memory.memory_contributions.length > 0 && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {memory.memory_contributions.length} contribut{memory.memory_contributions.length === 1 ? 'o' : 'i'}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
