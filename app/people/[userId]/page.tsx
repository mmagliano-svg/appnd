import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getCategoryByValue } from '@/lib/constants/categories'

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

  // Can't view your own "NOI" page
  if (params.userId === user.id) {
    return notFound()
  }

  const { data: otherUser } = await supabase
    .from('users')
    .select('id, display_name, email')
    .eq('id', params.userId)
    .single()

  if (!otherUser) notFound()

  // Get all memories I'm part of
  const { data: myParticipations } = await supabase
    .from('memory_participants')
    .select('memory_id')
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)

  const myMemoryIds = (myParticipations ?? []).map((p) => p.memory_id)

  if (myMemoryIds.length === 0) {
    return renderPage(otherUser.display_name ?? otherUser.email, [])
  }

  // Get memories the other user is also part of
  const { data: sharedParticipations } = await supabase
    .from('memory_participants')
    .select('memory_id')
    .eq('user_id', params.userId)
    .not('joined_at', 'is', null)
    .in('memory_id', myMemoryIds)

  const sharedIds = (sharedParticipations ?? []).map((p) => p.memory_id)

  if (sharedIds.length === 0) {
    return renderPage(otherUser.display_name ?? otherUser.email, [])
  }

  const { data: memories } = await supabase
    .from('memories')
    .select(`
      id, title, happened_at, location_name, category, description,
      memory_contributions ( id )
    `)
    .in('id', sharedIds)
    .order('happened_at', { ascending: false })

  const otherName = otherUser.display_name ?? otherUser.email

  return renderPage(otherName, memories ?? [])
}

function renderPage(
  otherName: string,
  memories: Array<{
    id: string
    title: string
    happened_at: string
    location_name: string | null
    category: string | null
    description: string | null
    memory_contributions: { id: string }[]
  }>
) {
  const initials = otherName.slice(0, 2).toUpperCase()

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-16">

        {/* Top nav */}
        <div className="pt-6 pb-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            I tuoi ricordi
          </Link>
        </div>

        {/* Hero */}
        <div className="pt-6 pb-8 border-b border-border/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-foreground/10 flex items-center justify-center text-xl font-bold tracking-tight">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Noi & {otherName}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {memories.length === 0
                  ? 'Nessun ricordo condiviso ancora'
                  : `${memories.length} moment${memories.length === 1 ? 'o' : 'i'} condivisi`}
              </p>
            </div>
          </div>
        </div>

        {/* Memory list */}
        <div className="pt-6">
          {memories.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="text-4xl mb-2">🌱</div>
              <p className="text-base font-medium">Ancora tutto da scrivere.</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Non avete ancora ricordi condivisi. Crea un ricordo e invita {otherName} a partecipare.
              </p>
              <Link
                href="/memories/new"
                className="inline-flex items-center gap-2 mt-4 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                Crea un ricordo
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {memories.map((memory) => {
                const catInfo = getCategoryByValue(memory.category)
                const contribCount = memory.memory_contributions.length
                return (
                  <li key={memory.id}>
                    <Link href={`/memories/${memory.id}`}>
                      <div className="rounded-2xl border border-border bg-card hover:bg-accent/30 transition-colors p-4 space-y-2.5">
                        {/* Category */}
                        {catInfo && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{catInfo.emoji}</span>
                            <span className="uppercase tracking-wider">{catInfo.label}</span>
                          </span>
                        )}

                        {/* Title */}
                        <h2 className="font-semibold text-base leading-snug">{memory.title}</h2>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(memory.happened_at)}
                          </span>
                          {memory.location_name && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {memory.location_name}
                            </span>
                          )}
                        </div>

                        {/* Description preview */}
                        {memory.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {memory.description}
                          </p>
                        )}

                        {/* Contributions badge */}
                        {contribCount > 0 && (
                          <div className="flex items-center gap-1 pt-1">
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary rounded-full px-2.5 py-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {contribCount} contribut{contribCount === 1 ? 'o' : 'i'}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
