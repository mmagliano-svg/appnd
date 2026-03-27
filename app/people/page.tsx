import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getAllPersons } from '@/actions/persons'
import type { Person } from '@/actions/persons'

// ── Helpers ────────────────────────────────────────────────────────────────

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function formatDateFull(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  })
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    month: 'short',
    year: 'numeric',
  })
}

// ── Person Card ────────────────────────────────────────────────────────────

function PersonCard({ person }: { person: Person }) {
  const ini = initials(person.name)

  return (
    <Link
      href={`/people/${person.id}`}
      className="group flex flex-col rounded-3xl border border-border/50 bg-card overflow-hidden hover:border-foreground/20 hover:shadow-sm transition-all active:scale-[0.98]"
    >
      {/* Cover */}
      <div className="relative h-32 bg-muted overflow-hidden">
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

        {person.previewPhotoUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        )}

        {/* Avatar bubble */}
        <div className="absolute bottom-2.5 left-3">
          {person.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.avatarUrl}
              alt={person.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-foreground border-2 border-white shadow flex items-center justify-center">
              <span className="text-xs font-bold tracking-tight text-background">{ini}</span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-3.5 py-3">
        <p className="font-semibold text-sm leading-tight truncate">{person.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {person.memoryCount} moment{person.memoryCount === 1 ? 'o' : 'i'}
        </p>
        {person.firstMemoryDate && (
          <p className="text-[10px] text-muted-foreground/50 mt-1.5 leading-tight">
            Dal {formatDateFull(person.firstMemoryDate)}
          </p>
        )}
        {person.lastMemoryDate && person.lastMemoryDate !== person.firstMemoryDate && (
          <p className="text-[10px] text-muted-foreground/50 leading-tight">
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

  const people = await getAllPersons()

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
              ? 'Le persone che aggiungi ai tuoi ricordi appariranno qui.'
              : `${people.length} person${people.length === 1 ? 'a' : 'e'} nella tua storia.`}
          </p>
        </div>

        {/* Empty state */}
        {people.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <p className="text-5xl">🌱</p>
            <p className="text-base font-medium">Ancora nessuna persona.</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Crea un ricordo e nella sezione &ldquo;Con chi eri?&rdquo; aggiungi le persone coinvolte.
            </p>
            <Link
              href="/memories/new"
              className="inline-flex items-center gap-2 mt-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Crea un ricordo
            </Link>
          </div>
        )}

        {/* Grid */}
        {people.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {people.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
