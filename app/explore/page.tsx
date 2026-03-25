import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getExploreData } from '@/actions/memories'
import { getCategoryByValue } from '@/lib/constants/categories'

function plural(n: number, singular: string, plural: string) {
  return `${n} ${n === 1 ? singular : plural}`
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4 text-muted-foreground/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

export default async function ExplorePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { topTags, topPlaces, categories } = await getExploreData()

  const isEmpty = topTags.length === 0 && topPlaces.length === 0 && categories.length === 0

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-28">

        {/* Header */}
        <div className="pt-10 pb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Esplora</h1>
          <p className="text-sm text-muted-foreground">
            La tua storia, da tutti i punti di vista.
          </p>
        </div>

        {isEmpty ? (
          <div className="text-center py-20 space-y-3">
            <div className="text-4xl mb-3">○</div>
            <p className="text-base font-medium">Ancora nessun dato da esplorare.</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Aggiungi qualche ricordo con luoghi, tag e categorie per vederli qui.
            </p>
            <Link
              href="/memories/new"
              className="inline-block text-sm text-foreground underline underline-offset-2 mt-2"
            >
              Crea il primo ricordo
            </Link>
          </div>
        ) : (
          <div className="space-y-12">

            {/* ── CONNESSIONI ── */}
            {topTags.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Connessioni
                  </h2>
                  <span className="text-xs text-muted-foreground/50">
                    {topTags.length} {topTags.length === 1 ? 'tag' : 'tag'}
                  </span>
                </div>
                <div className="divide-y divide-border/50">
                  {topTags.map(({ tag, count }) => (
                    <Link
                      key={tag}
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="flex items-center justify-between py-3.5 -mx-4 px-4 hover:bg-accent/30 transition-colors group"
                    >
                      <span className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors">
                        #{tag}
                      </span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs text-muted-foreground">
                          {plural(count, 'momento', 'momenti')}
                        </span>
                        <ChevronRight />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── LUOGHI ── */}
            {topPlaces.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Luoghi
                  </h2>
                  <span className="text-xs text-muted-foreground/50">
                    {topPlaces.length} {topPlaces.length === 1 ? 'luogo' : 'luoghi'}
                  </span>
                </div>
                <div className="divide-y divide-border/50">
                  {topPlaces.map(({ place, count }) => (
                    <Link
                      key={place}
                      href={`/places/${encodeURIComponent(place)}`}
                      className="flex items-center justify-between py-3.5 -mx-4 px-4 hover:bg-accent/30 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <svg
                          className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-medium text-foreground truncate">
                          {place}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {plural(count, 'momento', 'momenti')}
                        </span>
                        <ChevronRight />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── CAPITOLI ── */}
            {categories.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Capitoli
                  </h2>
                  <span className="text-xs text-muted-foreground/50">
                    {categories.length} {categories.length === 1 ? 'capitolo' : 'capitoli'}
                  </span>
                </div>
                <div className="divide-y divide-border/50">
                  {categories.map(({ value, count }) => {
                    const cat = getCategoryByValue(value)
                    if (!cat) return null
                    return (
                      <Link
                        key={value}
                        href={`/dashboard?category=${value}`}
                        className="flex items-center justify-between py-3.5 -mx-4 px-4 hover:bg-accent/30 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg leading-none">{cat.emoji}</span>
                          <span className="text-sm font-medium text-foreground">
                            {cat.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs text-muted-foreground">
                            {plural(count, 'momento', 'momenti')}
                          </span>
                          <ChevronRight />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </main>
  )
}
