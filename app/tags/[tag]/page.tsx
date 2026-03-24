import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getCategoryByValue } from '@/lib/constants/categories'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default async function TagPage({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag)

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch all memories the user participates in, filter by tag
  const { data, error } = await supabase
    .from('memory_participants')
    .select(`
      memories (
        id,
        title,
        happened_at,
        location_name,
        description,
        category,
        tags
      )
    `)
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)

  if (error) notFound()

  const allMemories = (data ?? [])
    .map((p) => p.memories)
    .filter(Boolean) as Array<{
      id: string
      title: string
      happened_at: string
      location_name: string | null
      description: string | null
      category: string | null
      tags: string[]
    }>

  const tagged = allMemories
    .filter((m) => m.tags?.includes(tag))
    .sort((a, b) => new Date(b.happened_at).getTime() - new Date(a.happened_at).getTime())

  const count = tagged.length

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-16">

        {/* Back */}
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

        {/* Header */}
        <div className="pt-10 pb-10 border-b border-border/50">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Connessione
          </p>
          <h1 className="text-5xl font-bold tracking-tight mb-4 leading-none">
            {capitalize(tag)}
          </h1>
          <p className="text-base text-muted-foreground">
            {count === 0
              ? 'Ancora nessun momento.'
              : count === 1
              ? '1 momento vissuto insieme.'
              : `${count} momenti vissuti insieme.`}
          </p>
          {/* Subtle tag anchor — secondary, not protagonist */}
          <p className="text-xs text-muted-foreground/50 mt-3">#{tag}</p>
        </div>

        {/* Empty state */}
        {count === 0 ? (
          <div className="text-center py-24 space-y-3">
            <div className="text-4xl mb-3">○</div>
            <p className="text-base font-medium">Nessun momento ancora.</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              I momenti legati a {capitalize(tag)} appariranno qui.
            </p>
            <Link
              href="/memories/new"
              className="inline-block text-sm text-foreground underline underline-offset-2 mt-1"
            >
              Aggiungi un ricordo
            </Link>
          </div>
        ) : (
          <ul className="space-y-3 pt-6">
            {tagged.map((memory) => {
              const catInfo = getCategoryByValue(memory.category)
              const otherTags = (memory.tags ?? []).filter((t) => t !== tag)
              return (
                <li key={memory.id}>
                  <div className="rounded-2xl border bg-card hover:border-foreground/20 transition-all hover:shadow-sm">
                    {/* Card body — links to memory */}
                    <Link href={`/memories/${memory.id}`} className="block p-5 space-y-2.5 group">
                      <div className="flex items-center justify-between gap-2">
                        {catInfo ? (
                          <span className="text-xs text-muted-foreground font-medium">
                            {catInfo.emoji} {catInfo.label}
                          </span>
                        ) : (
                          <span />
                        )}
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDate(memory.happened_at)}
                        </span>
                      </div>

                      <div>
                        <h2 className="font-semibold text-base leading-snug group-hover:text-foreground">
                          {memory.title}
                        </h2>
                        {memory.location_name && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <span>📍</span>
                            <span>{memory.location_name}</span>
                          </p>
                        )}
                      </div>

                      {memory.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {memory.description}
                        </p>
                      )}
                    </Link>

                    {/* Other tags — outside the card link to avoid nested <a> */}
                    {otherTags.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap px-5 pb-4">
                        {otherTags.slice(0, 4).map((t) => (
                          <Link
                            key={t}
                            href={`/tags/${encodeURIComponent(t)}`}
                            className="inline-flex items-center rounded-full bg-muted hover:bg-muted/70 px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            #{t}
                          </Link>
                        ))}
                        {otherTags.length > 4 && (
                          <span className="text-xs text-muted-foreground self-center">
                            +{otherTags.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
