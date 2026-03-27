import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getSharedPeople } from '@/actions/people'
import type { PersonSummary } from '@/actions/people'

// ── Helpers ────────────────────────────────────────────────────────────────

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    month: 'short',
    year: 'numeric',
  })
}

function formatDateFull(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  })
}

// ── Person Card ────────────────────────────────────────────────────────────

function PersonCard({ person }: { person: PersonSummary }) {
  const ini = initials(person.displayName)
  const firstName = person.displayName.trim().split(/\s+/)[0]

  return (
    <Link
      href={`/people/${person.userId}`}
      className="group flex flex-col rounded-3xl border border-border/50 bg-card overflow-hidden hover:border-foreground/20 hover:shadow-sm transition-all active:scale-[0.98]"
    >
      {/* Cover / Avatar area */}
      <div className="relative h-36 bg-muted overflow-hidden">
        {person.previewPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.previewPhotoUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900" />
        )}

        {/* Dark gradient overlay */}
        {person.previewPhotoUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        )}

        {/* Avatar bubble */}
        <div className="absolute bottom-3 left-3">
          {person.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.avatarUrl}
              alt={person.displayName}
              className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-foreground border-2 border-white shadow-md flex items-center justify-center">
              <span className="text-sm font-bold tracking-tight text-background">{ini}</span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-3.5">
        <p className="font-semibold text-sm leading-tight">{firstName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {person.sharedCount} moment{person.sharedCount === 1 ? 'o' : 'i'}
        </p>
        {person.firstMemoryDate && (
          <p className="text-[10px] text-muted-foreground/50 mt-1.5">
            Insieme dal {formatDateFull(person.firstMemoryDate)}
          </p>
        )}
        {person.lastMemoryDate && person.firstMemoryDate !== person.lastMemoryDate && (
          <p className="text-[10px] text-muted-foreground/50">
            Ultima volta {formatDateShort(person.lastMemoryDate)}
          </p>
        )}
      </div>
    </Link>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function PeoplePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const people = await getSharedPeople()

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-28">

        {/* Top bar */}
        <div className="pt-6 pb-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="pt-6 pb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            Le persone della tua storia
          </h1>
          <p className="text-sm text-muted-foreground">
            {people.length === 0
              ? 'I tuoi ricordi condivisi appariranno qui.'
              : `${people.length} person${people.length === 1 ? 'a' : 'e'} nella tua storia.`}
          </p>
        </div>

        {/* Empty state */}
        {people.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <p className="text-5xl">🌱</p>
            <p className="text-base font-medium">Ancora nessun ricordo condiviso.</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Crea un ricordo e invita qualcuno — apparirà qui non appena si unisce.
            </p>
            <Link
              href="/memories/new"
              className="inline-flex items-center gap-2 mt-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Crea un ricordo
            </Link>
          </div>
        )}

        {/* People grid */}
        {people.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {people.map((person) => (
              <PersonCard key={person.userId} person={person} />
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
