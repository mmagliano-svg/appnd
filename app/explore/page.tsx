import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getExploreData, getOnThisDayMemories } from '@/actions/memories'
import { getCategoryByValue } from '@/lib/constants/categories'
import { OnThisDayCarousel } from '@/components/explore/OnThisDayCarousel'

function plural(n: number) {
  return `${n} ${n === 1 ? 'momento' : 'momenti'}`
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function SectionHeader({ title, count, unit }: { title: string; count: number; unit: string }) {
  return (
    <div className="flex items-baseline justify-between mb-5">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {count > 0 && (
        <span className="text-xs text-muted-foreground">
          {count} {unit}
        </span>
      )}
    </div>
  )
}

export default async function ExplorePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ topTags, topPlaces, categories }, onThisDay] = await Promise.all([
    getExploreData(),
    getOnThisDayMemories(),
  ])

  // Subtitle: "25 marzo, negli anni"
  const todayLabel = new Date().toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
  })

  const isEmpty = topTags.length === 0 && topPlaces.length === 0 && categories.length === 0

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-28">

        {/* Header */}
        <div className="pt-10 pb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Esplora</h1>
          <p className="text-sm text-muted-foreground">La tua storia, da tutti i punti di vista.</p>
        </div>

        {/* ── RIVIVI OGGI (se ci sono ricordi in questa data) ── */}
        {onThisDay.length > 0 && (
          <div className="mb-14">
            <OnThisDayCarousel
              memories={onThisDay}
              subtitle={`${todayLabel}, negli anni`}
            />
          </div>
        )}

        {isEmpty ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-base font-medium">Ancora niente da esplorare.</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Aggiungi ricordi con luoghi, tag e categorie per vederli qui.
            </p>
            <Link href="/memories/new" className="inline-block text-sm underline underline-offset-2 mt-2">
              Crea il primo ricordo
            </Link>
          </div>
        ) : (
          <div className="space-y-14">

            {/* ── CONNESSIONI ── */}
            {topTags.length > 0 && (
              <section>
                <SectionHeader
                  title="Connessioni"
                  count={topTags.length}
                  unit={topTags.length === 1 ? 'tag' : 'tag'}
                />
                <div className="grid grid-cols-2 gap-3">
                  {topTags.map(({ tag, count, previewUrl }) => (
                    <Link
                      key={tag}
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-muted group"
                    >
                      {/* Photo or fallback */}
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-6xl font-bold text-muted-foreground/15 uppercase select-none">
                            {tag[0]}
                          </span>
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                      {/* Label */}
                      <div className="absolute bottom-0 left-0 right-0 p-3.5">
                        <p className="text-white text-sm font-semibold leading-tight">#{tag}</p>
                        <p className="text-white/60 text-xs mt-0.5">{plural(count)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── LUOGHI ── */}
            {topPlaces.length > 0 && (
              <section>
                <SectionHeader
                  title="Luoghi"
                  count={topPlaces.length}
                  unit={topPlaces.length === 1 ? 'luogo' : 'luoghi'}
                />
                <div className="space-y-2.5">
                  {topPlaces.map(({ place, count, previewUrl }) => (
                    <Link
                      key={place}
                      href={`/places/${encodeURIComponent(place)}`}
                      className="flex items-center gap-3.5 p-3 rounded-2xl bg-muted/40 hover:bg-muted/70 active:scale-[0.99] transition-all group"
                    >
                      {/* Thumbnail */}
                      <div className="w-[68px] h-[68px] rounded-xl overflow-hidden bg-muted shrink-0">
                        {previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-muted-foreground/35"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate leading-tight">{place}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{plural(count)}</p>
                      </div>

                      <span className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                        <ChevronRight />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── CAPITOLI ── */}
            {categories.length > 0 && (
              <section>
                <SectionHeader
                  title="Capitoli"
                  count={categories.length}
                  unit={categories.length === 1 ? 'capitolo' : 'capitoli'}
                />
                <div className="space-y-2.5">
                  {categories.map(({ value, count }) => {
                    const cat = getCategoryByValue(value)
                    if (!cat) return null
                    return (
                      <Link
                        key={value}
                        href={`/dashboard?category=${value}`}
                        className="flex items-center gap-3.5 p-3 rounded-2xl bg-muted/40 hover:bg-muted/70 active:scale-[0.99] transition-all group"
                      >
                        {/* Emoji bubble */}
                        <div className="w-11 h-11 rounded-xl bg-background flex items-center justify-center shrink-0 shadow-sm text-xl">
                          {cat.emoji}
                        </div>

                        {/* Text */}
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{cat.label}</p>
                          <p className="text-xs text-muted-foreground">{plural(count)}</p>
                        </div>

                        <span className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                          <ChevronRight />
                        </span>
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
