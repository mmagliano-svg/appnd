import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getOnThisDayMemories } from '@/actions/memories'
import { getTopPeople } from '@/actions/persons'
import {
  getSearchableMemories,
  getRecurringMoments,
  getExploreConnections,
} from '@/actions/explore'
import { getExploreData } from '@/actions/memories'
import { ExploreSearch } from '@/components/explore/ExploreSearch'
import { OnThisDayCarousel } from '@/components/explore/OnThisDayCarousel'

// ── Shared helpers ─────────────────────────────────────────────────────────

function plural(n: number) {
  return `${n} ${n === 1 ? 'momento' : 'momenti'}`
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50 mb-4">
      {children}
    </p>
  )
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
    </svg>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function ExplorePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    searchMemories,
    people,
    onThisDay,
    { topPlaces },
    recurringMoments,
    connections,
  ] = await Promise.all([
    getSearchableMemories(),
    getTopPeople(5),
    getOnThisDayMemories(),
    getExploreData(),
    getRecurringMoments(),
    getExploreConnections(),
  ])

  const todayLabel = new Date().toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
  })

  // Show all recurring moments (count 0 included), capped at 8
  // Already sorted: count > 0 desc, then count = 0 alphabetical
  const shownMoments = recurringMoments.slice(0, 8)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-28">

        {/* ── Header ── */}
        <div className="pt-10 pb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Esplora</h1>
          <p className="text-sm text-muted-foreground/50">Ci sono cose che tornano nella tua vita.</p>
        </div>

        {/* ── 1. SEARCH ── */}
        <ExploreSearch memories={searchMemories} />

        {/* ── 2. PERSONE ── */}
        {people.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Persone</SectionTitle>
              <Link
                href="/people"
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors -mt-4"
              >
                Vedi tutte →
              </Link>
            </div>
            <div
              className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4"
              style={{ scrollbarWidth: 'none' }}
            >
              {people.map((person) => {
                const ini       = person.name.trim().slice(0, 2).toUpperCase()
                const firstName = person.name.trim().split(/\s+/)[0]
                const photo     = person.avatarUrl ?? person.previewPhotoUrl
                return (
                  <Link
                    key={person.id}
                    href={`/people/${person.id}`}
                    className="flex-none flex flex-col items-center gap-2 group"
                  >
                    <div className="relative w-14 h-14 rounded-full overflow-hidden bg-foreground ring-2 ring-transparent group-hover:ring-foreground/20 transition-all">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo}
                          alt={person.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tracking-tight text-background">
                          {ini}
                        </span>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium leading-none">{firstName}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                        {plural(person.memoryCount)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── RIVIVI OGGI (optional, shown only when matches exist) ── */}
        {onThisDay.length > 0 && (
          <div className="mb-10">
            <OnThisDayCarousel
              memories={onThisDay}
              subtitle={`${todayLabel}, negli anni`}
            />
          </div>
        )}

        {/* ── 3. LUOGHI ── */}
        {topPlaces.length > 0 && (
          <section className="mb-10">
            <SectionTitle>Luoghi</SectionTitle>
            <div
              className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4"
              style={{ scrollbarWidth: 'none' }}
            >
              {topPlaces.slice(0, 5).map(({ place, count }) => (
                <Link
                  key={place}
                  href={`/places/${encodeURIComponent(place)}`}
                  className="flex-none rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.07] active:scale-[0.99] transition-all px-4 pt-4 pb-3.5 min-w-[130px] max-w-[170px] border border-foreground/[0.05]"
                >
                  <p className="text-sm font-semibold leading-snug truncate">{place}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1.5">{plural(count)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── 4. MOMENTI CHE TORNANO ── */}
        {shownMoments.length > 0 && (
          <section className="mb-10">
            <SectionTitle>Momenti che tornano</SectionTitle>
            <div
              className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4"
              style={{ scrollbarWidth: 'none' }}
            >
              {shownMoments.map((m) => (
                <Link
                  key={m.id}
                  href={m.href}
                  className="flex-none rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.07] active:scale-[0.99] transition-all px-4 py-3 min-w-[130px] max-w-[180px]"
                >
                  <p className="text-sm font-medium leading-snug line-clamp-2">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    {m.count === 0
                      ? 'Potrebbe essere il primo'
                      : `${m.count} ricord${m.count === 1 ? 'o' : 'i'} nel tempo`}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── 5. CONNESSIONI ── */}
        {connections.length > 0 && (
          <section className="mb-10">
            <SectionTitle>Connessioni</SectionTitle>
            <div className="space-y-2">
              {connections.map((c, i) => (
                <Link
                  key={i}
                  href={c.href}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.07] active:scale-[0.99] transition-all px-4 py-3.5 group"
                >
                  <p className="text-sm font-medium leading-snug">{c.label}</p>
                  <span className="text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors shrink-0">
                    <ChevronRight />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state ── */}
        {people.length === 0 && topPlaces.length === 0 && shownMoments.length === 0 && connections.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <p className="text-base font-medium">Ancora niente da esplorare.</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Aggiungi ricordi con luoghi e persone per vederli qui.
            </p>
            <Link href="/memories/new" className="inline-block text-sm underline underline-offset-2 mt-2">
              Crea il primo ricordo
            </Link>
          </div>
        )}

      </div>
    </main>
  )
}
