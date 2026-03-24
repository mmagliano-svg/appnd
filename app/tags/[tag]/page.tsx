import Link from 'next/link'
import { getUserMemories } from '@/actions/memories'
import { getCategoryByValue } from '@/lib/constants/categories'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function TagPage({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag)
  const memories = await getUserMemories()
  const tagged = memories.filter((m) => m.tags.includes(tag))

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-16">

        {/* Header */}
        <div className="pt-6 pb-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            I tuoi ricordi
          </Link>

          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Connessione
          </p>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            #{tag}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tagged.length === 0
              ? 'Nessun ricordo con questa connessione.'
              : `${tagged.length} ricord${tagged.length === 1 ? 'o' : 'i'} collegat${tagged.length === 1 ? 'o' : 'i'}`}
          </p>
        </div>

        {/* Memory list */}
        {tagged.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="text-4xl mb-2">○</div>
            <p className="text-base font-medium">Nessun ricordo trovato</p>
            <p className="text-sm text-muted-foreground">
              Non ci sono ricordi con la connessione #{tag}.
            </p>
            <Link
              href="/dashboard"
              className="inline-block text-sm text-foreground underline underline-offset-2 mt-2"
            >
              Torna ai ricordi
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {tagged.map((memory) => {
              const catInfo = getCategoryByValue(memory.category)
              const otherTags = memory.tags.filter((t) => t !== tag)
              return (
                <li key={memory.id}>
                  <Link href={`/memories/${memory.id}`} className="block group">
                    <div className="rounded-2xl border bg-card p-5 hover:border-foreground/20 transition-all hover:shadow-sm space-y-2.5">
                      {/* Top: category + date */}
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

                      {/* Title */}
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

                      {/* Description preview */}
                      {memory.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {memory.description}
                        </p>
                      )}

                      {/* Other tags on this memory */}
                      {otherTags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap pt-0.5">
                          {otherTags.slice(0, 4).map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              #{t}
                            </span>
                          ))}
                          {otherTags.length > 4 && (
                            <span className="text-xs text-muted-foreground self-center">
                              +{otherTags.length - 4}
                            </span>
                          )}
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
    </main>
  )
}
