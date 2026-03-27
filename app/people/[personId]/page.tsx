import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getPersonDetail } from '@/actions/persons'
import { getSharedMemoriesWithUser } from '@/actions/people'
import { getCategoryByValue } from '@/lib/constants/categories'

// ── Helpers ────────────────────────────────────────────────────────────────

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function formatYear(d: string) { return new Date(d).getFullYear() }

function formatDayMonth(d: string) {
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
}

function formatFirstDate(d: string) {
  return new Date(d).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
}

// ── Shared UI ──────────────────────────────────────────────────────────────

function BackButton() {
  return (
    <div className="px-4 pt-6 pb-2">
      <Link
        href="/people"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
        </svg>
        Persone
      </Link>
    </div>
  )
}

function MemoryRow({ memory }: {
  memory: { id: string; title: string; start_date: string; location_name: string | null; category: string | null; previewUrl?: string | null }
}) {
  const catInfo = getCategoryByValue(memory.category)
  return (
    <Link
      href={`/memories/${memory.id}`}
      className="flex gap-3 rounded-2xl bg-muted/30 border border-border/40 hover:border-foreground/15 hover:bg-muted/50 transition-all group active:scale-[0.99] overflow-hidden"
    >
      <div className="w-24 shrink-0 self-stretch bg-muted overflow-hidden rounded-l-2xl">
        {memory.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={memory.previewUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" loading="lazy" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 py-3.5 pr-4 min-w-0">
        {catInfo && <p className="text-xs text-muted-foreground mb-1">{catInfo.emoji} {catInfo.label}</p>}
        <p className="font-semibold text-sm leading-snug line-clamp-2 mb-1">{memory.title}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{formatDayMonth(memory.start_date)}</span>
          {memory.location_name && (
            <><span className="text-border">·</span><span className="truncate">{memory.location_name}</span></>
          )}
        </div>
      </div>
    </Link>
  )
}

function TimelineByYear<T extends { id: string; start_date: string }>({
  items,
  renderItem,
  emptyNote,
}: {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  emptyNote: string
}) {
  const byYear: Record<number, T[]> = {}
  for (const item of items) {
    const y = formatYear(item.start_date)
    if (!byYear[y]) byYear[y] = []
    byYear[y].push(item)
  }
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b)

  if (items.length === 0) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-4xl">🌱</p>
        <p className="text-sm text-muted-foreground">{emptyNote}</p>
        <Link href="/memories/new" className="inline-flex items-center gap-2 mt-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium">
          Crea un ricordo
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {years.map((year) => (
        <div key={year}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{year}</span>
            <div className="flex-1 border-t border-border/40" />
          </div>
          <div className="space-y-3">
            {byYear[year].map((item) => renderItem(item))}
          </div>
        </div>
      ))}
      <div className="text-center pt-4 pb-2">
        <p className="text-xs text-muted-foreground/50 italic">
          {items.length === 1 ? 'Il primo di molti momenti insieme.' : `${items.length} momenti scritti insieme.`}
        </p>
      </div>
    </div>
  )
}

// ── Person entity view (people table) ─────────────────────────────────────

async function PersonEntityView({ id }: { id: string }) {
  const person = await getPersonDetail(id)
  if (!person) return null

  const ini = initials(person.name)
  const sorted = person.memories   // already sorted ascending by start_date

  // Derived — no extra queries
  const lastDate = sorted.length > 0 ? sorted[sorted.length - 1].start_date : null

  // Hero memory: most recent with photo, fallback to most recent
  const heroMemory =
    [...sorted].reverse().find((m) => m.previewUrl) ??
    (sorted.length > 0 ? sorted[sorted.length - 1] : null)

  // Shared places from existing memory data
  const placeMap = new Map<string, number>()
  for (const m of sorted) {
    if (m.location_name) placeMap.set(m.location_name, (placeMap.get(m.location_name) ?? 0) + 1)
  }
  const topPlaces = Array.from(placeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-28">
        <BackButton />

        {/* ── Hero ── */}
        <div className="px-4 pt-6 pb-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center shrink-0 overflow-hidden">
              {person.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={person.avatarUrl} alt={person.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold tracking-tight text-background">{ini}</span>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                La tua storia con
              </p>
              <h1 className="text-2xl font-bold tracking-tight leading-none">{person.name}</h1>
            </div>
          </div>

          {sorted.length > 0 && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums leading-none">{person.stats.totalCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  moment{person.stats.totalCount === 1 ? 'o' : 'i'}
                </p>
              </div>
              {person.stats.firstDate && (
                <>
                  <div className="w-px h-8 bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground">Insieme dal</p>
                    <p className="text-sm font-semibold">{formatFirstDate(person.stats.firstDate)}</p>
                  </div>
                </>
              )}
              {lastDate && lastDate !== person.stats.firstDate && (
                <>
                  <div className="w-px h-8 bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ultimo ricordo</p>
                    <p className="text-sm font-semibold">{formatFirstDate(lastDate)}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Hero memory — emotional anchor ── */}
        {heroMemory && (
          <div className="px-4 mb-8">
            <Link
              href={`/memories/${heroMemory.id}`}
              className="block rounded-2xl overflow-hidden border border-border/40 hover:border-foreground/20 active:scale-[0.99] transition-all group"
            >
              {heroMemory.previewUrl && (
                <div className="aspect-[16/9] overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroMemory.previewUrl}
                    alt={heroMemory.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="eager"
                    draggable={false}
                  />
                </div>
              )}
              <div className="px-4 py-3.5">
                <p className="font-semibold text-sm leading-snug line-clamp-2 mb-1">{heroMemory.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDayMonth(heroMemory.start_date)}</span>
                  {heroMemory.location_name && (
                    <><span className="text-border">·</span><span className="truncate">{heroMemory.location_name}</span></>
                  )}
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* ── Shared places ── */}
        {topPlaces.length > 0 && (
          <div className="px-4 mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Luoghi</p>
            <div className="flex flex-wrap gap-2">
              {topPlaces.map(([place, count]) => (
                <span
                  key={place}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium"
                >
                  📍 {place}{count > 1 && <span className="text-muted-foreground/60"> · {count}</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Timeline ── */}
        <div className="px-4">
          {sorted.length > 1 && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Tutti i momenti
            </p>
          )}
          <TimelineByYear
            items={sorted}
            renderItem={(m) => <MemoryRow key={m.id} memory={m} />}
            emptyNote={`Nessun ricordo con ${person.name} ancora. Crea un momento e aggiungi ${person.name} nella sezione "Con chi eri?".`}
          />
        </div>
      </div>
    </main>
  )
}

// ── Registered user view (NOI — fallback) ─────────────────────────────────

async function RegisteredUserView({ userId, currentUserId }: { userId: string; currentUserId: string }) {
  if (userId === currentUserId) return null
  const result = await getSharedMemoriesWithUser(userId)
  if (!result) return null

  const { otherUser, memories, stats } = result
  const ini = initials(otherUser.displayName)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-28">
        <BackButton />

        <div className="px-4 pt-6 pb-8">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center shrink-0">
              <span className="text-xl font-bold tracking-tight text-background">{ini}</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">La tua storia con</p>
              <h1 className="text-2xl font-bold tracking-tight leading-none">{otherUser.displayName}</h1>
            </div>
          </div>

          {memories.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums leading-none">{stats.totalCount}</p>
                <p className="text-xs text-muted-foreground mt-1">moment{stats.totalCount === 1 ? 'o' : 'i'}</p>
              </div>
              {stats.firstDate && (
                <><div className="w-px h-8 bg-border" /><div><p className="text-xs text-muted-foreground">Insieme dal</p><p className="text-sm font-semibold">{formatFirstDate(stats.firstDate)}</p></div></>
              )}
              {stats.uniqueLocations > 0 && (
                <><div className="w-px h-8 bg-border" /><div className="text-center"><p className="text-2xl font-bold tabular-nums leading-none">{stats.uniqueLocations}</p><p className="text-xs text-muted-foreground mt-1">luogh{stats.uniqueLocations === 1 ? 'o' : 'i'}</p></div></>
              )}
            </div>
          )}
        </div>

        {stats.allPhotos.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-2 px-4 mb-6" style={{ scrollbarWidth: 'none' }}>
            {stats.allPhotos.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" loading="lazy" draggable={false} />
            ))}
          </div>
        )}

        <div className="px-4">
          <TimelineByYear
            items={memories}
            renderItem={(m) => <MemoryRow key={m.id} memory={m} />}
            emptyNote={`Nessun ricordo condiviso ancora con ${otherUser.displayName}.`}
          />
        </div>
      </div>
    </main>
  )
}

// ── Router ─────────────────────────────────────────────────────────────────

export default async function PersonPage({ params }: { params: { personId: string } }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Try people table first (ghost / invited / active entities)
  const personView = await PersonEntityView({ id: params.personId })
  if (personView) return personView

  // Fallback: registered user NOI view (userId passed as personId from dashboard "Con chi")
  const userView = await RegisteredUserView({ userId: params.personId, currentUserId: user.id })
  if (userView) return userView

  notFound()
}
