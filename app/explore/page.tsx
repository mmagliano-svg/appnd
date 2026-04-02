import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getOnThisDayMemories } from '@/actions/memories'
import {
  getSearchableMemories,
  getExploreRanked,
  type RankedPerson,
  type RankedRecurring,
  type HeroCandidate,
} from '@/actions/explore'
import { ExploreSearch } from '@/components/explore/ExploreSearch'
import { OnThisDayCarousel } from '@/components/explore/OnThisDayCarousel'

// ── Shared UI ──────────────────────────────────────────────────────────────

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

// ── Deterministic label functions (spec §1–5) ──────────────────────────────
// All strings are predefined. No generation. Silence over weak copy.

/** Stable name-hashed soft color for avatar fallback. */
function avatarColor(name: string): string {
  const palette = [
    'bg-rose-100 text-rose-600',
    'bg-amber-100 text-amber-600',
    'bg-emerald-100 text-emerald-600',
    'bg-sky-100 text-sky-600',
    'bg-violet-100 text-violet-600',
    'bg-orange-100 text-orange-600',
    'bg-teal-100 text-teal-600',
  ]
  const hash = name.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
  return palette[hash % palette.length]
}

/** SPEC §2 — person insight label, using pre-computed yearsSpan from ranking engine. */
function personInsight(p: RankedPerson): string {
  const currentYear = new Date().getFullYear()
  const lastYear    = p.lastMemoryDate ? parseInt(p.lastMemoryDate.split('-')[0]) : 0
  if (p.memoryCount >= 8)                            return 'Parte della tua quotidianità'
  if (p.memoryCount >= 5 && lastYear === currentYear) return 'Con te spesso'
  if (p.yearsSpan >= 3)                              return 'Presenza costante'
  if (p.memoryCount >= 3)                            return 'Un volto ricorrente'
  return 'Fa parte della tua storia'
}

/** SPEC §1 — place insight label. isTopPlace = rank 0 in sorted list. */
function placeInsight(count: number, isTopPlace: boolean): string | null {
  if (isTopPlace) return 'Il centro della tua storia'
  if (count >= 5) return 'Dove torni spesso'
  if (count >= 3) return 'Un posto che torna'
  if (count >= 1) return 'Ci sei stato'
  return null
}

/** SPEC §3 — recurring moment label. */
function recurringContext(item: RankedRecurring): string | null {
  const { count, kind } = item
  if (kind === 'birthday') {
    if (count >= 3) return 'Ci sei sempre'
    if (count >= 2) return 'Torna ogni anno'
    return 'Un appuntamento fisso'
  }
  if (count >= 4) return "Sta diventando un'abitudine"
  if (count === 3) return 'Torna nel tempo'
  if (count === 2) return 'Sta iniziando a tornare'
  return null
}

/** SPEC §5 — hero card subtitle, derived from the ranked HeroCandidate. */
function heroCardText(c: HeroCandidate): string | null {
  switch (c.kind) {
    case 'place':
      if (c.count >= 5) return 'Negli ultimi anni, torni sempre qui'
      if (c.count >= 3) return 'Negli ultimi anni, è sempre presente'
      return null
    case 'person':
      if (c.count >= 8)     return 'Parte della tua quotidianità'
      if (c.yearsSpan >= 3) return 'Presenza costante'
      if (c.count >= 5)     return 'Con te spesso'
      return 'Un volto ricorrente'
    case 'recurring':
      if (c.isBirthday)  return 'Ci sei sempre'
      if (c.count >= 4)  return "Sta diventando un'abitudine"
      return 'Torna nel tempo'
  }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function ExplorePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [searchMemories, ranked, onThisDay] = await Promise.all([
    getSearchableMemories(),
    getExploreRanked(),
    getOnThisDayMemories(),
  ])

  const { hero, people, places, recurring, connections } = ranked

  const todayLabel = new Date().toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
  })

  const primaryText = hero.primary ? heroCardText(hero.primary) : null

  // Build secondary cards — ranking engine gives us 1; page layer adds a second
  // if needed to satisfy the person→place rule. No new queries: uses places[].
  type SecondaryCard = { candidate: HeroCandidate; text: string }
  const secondaryCards: SecondaryCard[] = []

  if (hero.secondary) {
    const t = heroCardText(hero.secondary)
    if (t) secondaryCards.push({ candidate: hero.secondary, text: t })
  }

  // Special rule: if primary is a PERSON, ensure at least one PLACE in secondary
  if (
    hero.primary?.kind === 'person' &&
    !secondaryCards.some(({ candidate: c }) => c.kind === 'place') &&
    places.length > 0
  ) {
    const p = places[0]
    const placeCandidate: HeroCandidate = {
      kind: 'place', subject: p.place,
      href: `/places/${encodeURIComponent(p.place)}`,
      score: p.score, count: p.count, yearsCount: p.yearsCount, yearsSpan: 0, isBirthday: false,
    }
    const t = heroCardText(placeCandidate)
    if (t) secondaryCards.push({ candidate: placeCandidate, text: t })
  }

  const shownSecondaries = secondaryCards.slice(0, 2)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-28">

        {/* ── Header ── */}
        <div className="pt-10 pb-2">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Scopri la tua storia</h1>
          <p className="text-sm text-muted-foreground/50">
            Ci sono momenti che tornano
          </p>
        </div>

        {/* ── Search ── */}
        <div className="mt-6 mb-12">
          <ExploreSearch memories={searchMemories} />
        </div>

        {/* ── 1. PATTERN CHE EMERGONO ── */}
        {hero.primary && primaryText && (
          <section className="mb-12">
            <SectionTitle>Cose che fanno parte di te</SectionTitle>
            <div className="space-y-3">

              {/* Primary — full width, visually dominant */}
              <Link
                href={hero.primary.href}
                className="flex items-center justify-between gap-4 rounded-2xl bg-foreground/[0.08] hover:bg-foreground/[0.1] active:scale-[0.99] transition-all px-5 py-6 min-h-[110px] group"
              >
                <div className="min-w-0">
                  <p className="text-xl font-semibold leading-snug truncate">{hero.primary.subject}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{primaryText}</p>
                </div>
                <span className="text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors shrink-0">
                  <ChevronRight />
                </span>
              </Link>

              {/* Secondaries — 2-col grid when 2 exist, full-width when 1 */}
              {shownSecondaries.length > 0 && (
                <div className={shownSecondaries.length === 2 ? 'grid grid-cols-2 gap-3 mt-4' : 'mt-4'}>
                  {shownSecondaries.map(({ candidate: c, text: t }) => (
                    <Link
                      key={`${c.kind}:${c.subject}`}
                      href={c.href}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.06] active:scale-[0.99] transition-all px-4 py-4 min-h-[70px] group"
                    >
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium leading-snug truncate">{c.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{t}</p>
                      </div>
                      <span className="text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors shrink-0">
                        <ChevronRight />
                      </span>
                    </Link>
                  ))}
                </div>
              )}

            </div>
          </section>
        )}

        {/* ── 2. LE TUE PERSONE ── */}
        {people.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Le tue persone</SectionTitle>
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
                const color     = avatarColor(person.name)
                return (
                  <Link
                    key={person.id}
                    href={`/people/${person.id}`}
                    className="flex-none flex flex-col items-center gap-2 group"
                  >
                    <div
                      className={[
                        'relative w-14 h-14 rounded-full overflow-hidden',
                        'ring-2 ring-transparent group-hover:ring-foreground/20 transition-all',
                        photo ? '' : color,
                      ].join(' ')}
                    >
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo}
                          alt={person.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tracking-tight">
                          {ini}
                        </span>
                      )}
                    </div>
                    <div className="text-center max-w-[64px]">
                      <p className="text-xs font-medium leading-none truncate">Con {firstName}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5 leading-tight">
                        {personInsight(person)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── RIVIVI OGGI ── */}
        {onThisDay.length > 0 && (
          <div className="mb-12">
            <OnThisDayCarousel
              memories={onThisDay}
              subtitle={`${todayLabel}, negli anni`}
            />
          </div>
        )}

        {/* ── 3. I LUOGHI DELLA TUA VITA ── */}
        {places.length > 0 && (
          <section className="mb-12">
            <SectionTitle>I luoghi della tua storia</SectionTitle>
            <div
              className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4"
              style={{ scrollbarWidth: 'none' }}
            >
              {places.map((p) => {
                const label = placeInsight(p.count, p.isTopPlace)
                return (
                  <Link
                    key={p.place}
                    href={`/places/${encodeURIComponent(p.place)}`}
                    className="flex-none rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.07] active:scale-[0.99] transition-all px-4 pt-4 pb-3.5 min-w-[140px] max-w-[180px] border border-foreground/[0.05]"
                  >
                    <p className="text-sm font-semibold leading-snug truncate">{p.place}</p>
                    {label && (
                      <p className="text-[10px] text-muted-foreground/60 mt-1.5">{label}</p>
                    )}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── 4. COSE CHE TORNANO ── */}
        {recurring.length > 0 && (
          <section className="mb-12">
            <SectionTitle>Cose che tornano</SectionTitle>
            <div
              className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4"
              style={{ scrollbarWidth: 'none' }}
            >
              {recurring.map((m) => {
                const ctx = recurringContext(m)
                return (
                  <Link
                    key={m.id}
                    href={m.href}
                    className="flex-none rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.07] active:scale-[0.99] transition-all px-4 py-3.5 min-w-[130px] max-w-[180px]"
                  >
                    <p className="text-sm font-medium leading-snug line-clamp-2">{m.label}</p>
                    {ctx && (
                      <p className="text-[10px] text-muted-foreground/50 mt-1">{ctx}</p>
                    )}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── 5. CONNESSIONI ── */}
        {connections.length > 0 && (
          <section className="mb-10">
            <SectionTitle>Relazioni che tornano</SectionTitle>
            <div className="space-y-2">
              {connections.map((c, i) => (
                <Link
                  key={i}
                  href={c.href}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.07] active:scale-[0.99] transition-all px-5 py-4 group"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold leading-snug truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground/55 mt-0.5">{c.subtitle}</p>
                  </div>
                  <span className="text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors shrink-0">
                    <ChevronRight />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state ── */}
        {people.length === 0 && places.length === 0 && recurring.length === 0 && connections.length === 0 && (
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
