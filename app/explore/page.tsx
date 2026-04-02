import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getOnThisDayMemories } from '@/actions/memories'
import { getTopPeople } from '@/actions/persons'
import {
  getSearchableMemories,
  getRecurringMoments,
  getExploreConnections,
  type RecurringMomentItem,
} from '@/actions/explore'
import { getExploreData } from '@/actions/memories'
import { ExploreSearch } from '@/components/explore/ExploreSearch'
import { OnThisDayCarousel } from '@/components/explore/OnThisDayCarousel'
import type { Person } from '@/actions/persons'

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

// ── Deterministic insight helpers ─────────────────────────────────────────
// All strings are predefined. No generation, no inference beyond stated rules.

/** Soft color for avatar fallback — name-hashed, stable per person. */
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

/**
 * SPEC §2 — Person insight label.
 * Inputs: memoryCount, yearsSpan, lastMemoryYear vs currentYear.
 */
function personInsight(person: Person): string {
  const currentYear = new Date().getFullYear()
  const lastYear  = person.lastMemoryDate  ? parseInt(person.lastMemoryDate.split('-')[0])  : 0
  const firstYear = person.firstMemoryDate ? parseInt(person.firstMemoryDate.split('-')[0]) : lastYear
  const yearsSpan = (lastYear && firstYear) ? lastYear - firstYear : 0

  if (person.memoryCount >= 8)                             return 'Parte della tua quotidianità'
  if (person.memoryCount >= 5 && lastYear === currentYear) return 'Con te spesso'
  if (yearsSpan >= 3)                                      return 'Presenza costante'
  if (person.memoryCount >= 3)                             return 'Un volto ricorrente'
  return 'Fa parte della tua storia'
}

/**
 * SPEC §1 — Place insight label.
 * isTopPlace = this is the #1 most frequent place.
 * Returns null if no signal.
 */
function placeInsight(count: number, isTopPlace: boolean): string | null {
  if (isTopPlace)  return 'Il centro della tua storia'
  if (count >= 5)  return 'Dove torni spesso'
  if (count >= 3)  return 'Un posto che torna'
  if (count >= 1)  return 'Ci sei stato'
  return null
}

/**
 * SPEC §5 — Hero insight line for primary place card.
 * Returns null if count < 3 (no strong signal).
 */
function placeHeroText(count: number): string | null {
  if (count >= 5) return 'Negli ultimi anni, torni sempre qui'
  if (count >= 3) return 'Negli ultimi anni, è sempre presente'
  return null
}

/**
 * SPEC §3 — Recurring moment label.
 * Birthday and fixed-calendar anchors have separate tiers.
 * Returns null if count = 0 (no signal for fixed anchors).
 */
function recurringContext(item: RecurringMomentItem): string | null {
  const { count, kind } = item
  if (kind === 'birthday') {
    if (count >= 3) return 'Ci sei sempre'
    if (count >= 2) return 'Torna ogni anno'
    return 'Un appuntamento fisso'   // birthdays are inherently recurrent
  }
  if (count >= 4) return "Sta diventando un'abitudine"
  if (count === 3) return 'Torna nel tempo'
  if (count === 2) return 'Sta iniziando a tornare'
  if (count === 1) return "L'hai vissuto una volta"
  return null   // count = 0 → no signal
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

  // Only show recurring items that have a non-null label
  const shownMoments = recurringMoments
    .filter((m) => recurringContext(m) !== null)
    .slice(0, 8)

  // ── Hero insights ──────────────────────────────────────────────────────────
  // Primary: top place with spec §5 hero text.
  // Secondary 1: top recurring moment (count ≥ 2).
  // Secondary 2: top person (memoryCount ≥ 3).
  // Connections section is separate — no deduplication needed here.
  type HeroInsight = { subject: string; text: string; href: string }

  let primaryInsight: HeroInsight | null = null
  const secondaryInsights: HeroInsight[] = []

  if (topPlaces.length > 0) {
    const { place, count } = topPlaces[0]
    const heroText = placeHeroText(count)
    if (heroText) {
      primaryInsight = {
        subject: place,
        text: heroText,
        href: `/places/${encodeURIComponent(place)}`,
      }
    }
  }

  // Secondary 1 — top recurring moment with a non-null label
  const topRecurring = recurringMoments.find((m) => m.count >= 2)
  if (topRecurring) {
    const ctx = recurringContext(topRecurring)
    if (ctx) {
      secondaryInsights.push({
        subject: topRecurring.label,
        text: ctx,
        href: topRecurring.href,
      })
    }
  }

  // Secondary 2 — top person
  if (people.length > 0 && people[0].memoryCount >= 3) {
    secondaryInsights.push({
      subject: people[0].name.trim().split(/\s+/)[0],
      text: personInsight(people[0]),
      href: `/people/${people[0].id}`,
    })
  }

  // Fallback: if still no primary, promote first secondary
  if (!primaryInsight && secondaryInsights.length > 0) {
    primaryInsight = secondaryInsights.shift()!
  }

  const shownSecondaries = secondaryInsights.slice(0, 2)
  const hasHero = primaryInsight !== null

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-28">

        {/* ── Header ── */}
        <div className="pt-10 pb-2">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Esplora</h1>
          <p className="text-sm text-muted-foreground/50">
            Ci sono storie che si ripetono, anche senza accorgertene.
          </p>
        </div>

        {/* ── Search ── */}
        <div className="mt-6 mb-12">
          <ExploreSearch memories={searchMemories} />
        </div>

        {/* ── 1. PATTERN CHE EMERGONO ── */}
        {hasHero && (
          <section className="mb-12">
            <SectionTitle>Pattern che emergono</SectionTitle>
            <div className="space-y-3">

              {/* Primary — visually dominant */}
              <Link
                href={primaryInsight!.href}
                className="flex items-center justify-between gap-4 rounded-2xl bg-foreground/[0.06] hover:bg-foreground/[0.09] active:scale-[0.99] transition-all px-5 py-5 group"
              >
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-snug truncate">{primaryInsight!.subject}</p>
                  <p className="text-sm text-muted-foreground/55 mt-0.5 leading-relaxed">{primaryInsight!.text}</p>
                </div>
                <span className="text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors shrink-0">
                  <ChevronRight />
                </span>
              </Link>

              {/* Secondaries — side-by-side when two exist */}
              {shownSecondaries.length > 0 && (
                <div className={shownSecondaries.length === 2 ? 'grid grid-cols-2 gap-3' : ''}>
                  {shownSecondaries.map((s, i) => (
                    <Link
                      key={i}
                      href={s.href}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.07] active:scale-[0.99] transition-all px-4 py-4 group"
                    >
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold leading-snug truncate">{s.subject}</p>
                        <p className="text-[11px] text-muted-foreground/50 mt-0.5 line-clamp-2 leading-relaxed">{s.text}</p>
                      </div>
                      <span className="text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors shrink-0">
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
                      <p className="text-xs font-medium leading-none truncate">{firstName}</p>
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
        {topPlaces.length > 0 && (
          <section className="mb-12">
            <SectionTitle>I luoghi della tua vita</SectionTitle>
            <div
              className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4"
              style={{ scrollbarWidth: 'none' }}
            >
              {topPlaces.slice(0, 5).map(({ place, count }, i) => {
                const label = placeInsight(count, i === 0)
                return (
                  <Link
                    key={place}
                    href={`/places/${encodeURIComponent(place)}`}
                    className="flex-none rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.07] active:scale-[0.99] transition-all px-4 pt-4 pb-3.5 min-w-[140px] max-w-[180px] border border-foreground/[0.05]"
                  >
                    <p className="text-sm font-semibold leading-snug truncate">{place}</p>
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
        {shownMoments.length > 0 && (
          <section className="mb-12">
            <SectionTitle>Cose che tornano</SectionTitle>
            <div
              className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4"
              style={{ scrollbarWidth: 'none' }}
            >
              {shownMoments.map((m) => {
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
            <SectionTitle>Connessioni</SectionTitle>
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
