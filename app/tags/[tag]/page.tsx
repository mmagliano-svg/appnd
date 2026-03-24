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

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default async function TagPage({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag)
  const memories = await getUserMemories()
  const tagged = memories
    .filter((m) => m.tags.includes(tag))
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

        {/* Header — the "connection space" */}
        <div className="pt-8 pb-8 border-b border-border/50">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Connessione
          </p>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {capitalize(tag)}
          </h1>
          <p className="text-sm text-muted-foreground mb-5">
            {count === 0
              ? 'Nessun momento legato a questa connessione.'
              : count === 1
              ? '1 momento collegato'
              : `${count} momenti collegati`}
          </p>

          {/* Active chip — visual anchor "you are here" */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-foreground text-background px-3 py-1.5 text-xs font-semibold">
              #{tag}
            </span>
            {count > 0 && (
              <span className="text-xs text-muted-foreground">
                · tutti i momenti legati a questa connessione
              </span>
            )}
          </div>
        </div>

        {/* Memory list or empty state */}
        {count === 0 ? (
          <div className="text-center py-24 space-y-3">
            <div className="text-4xl mb-3">○</div>
            <p className="text-base font-medium">Nessun ricordo qui.</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Non hai ancora momenti legati a questa connessione.
            </p>
            <Link
              href="/memories/new"
              className="inline-block text-sm text-foreground underline underline-offset-2 mt-1"
            >
              Crea un ricordo
            </Link>
          </div>
        ) : (
          <ul className="space-y-3 pt-6">
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

                      {/* Title + location */}
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

                      {/* Other tags — clickable, explore related connections */}
                      {otherTags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap pt-0.5">
                          {otherTags.slice(0, 4).map((t) => (
                            <Link
                              key={t}
                              href={`/tags/${encodeURIComponent(t)}`}
                              onClick={(e) => e.stopPropagation()}
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
