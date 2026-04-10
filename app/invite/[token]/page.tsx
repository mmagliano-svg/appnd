import { acceptInvite } from '@/actions/invites'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default async function InvitePage({ params }: { params: { token: string } }) {
  const admin = createAdminClient()

  // ── Fetch invite + memory ──────────────────────────────────────────────────
  const { data: invite } = await admin
    .from('memory_participants')
    .select(`
      id,
      invited_email,
      joined_at,
      memories ( id, title, happened_at, start_date, location_name, description, created_by )
    `)
    .eq('invite_token', params.token)
    .single()

  if (!invite) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-xs">
          <p className="text-3xl">🔍</p>
          <h1 className="text-xl font-bold tracking-tight">Invito non trovato</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Il link potrebbe essere scaduto o non valido.
          </p>
          <Link href="/" className="text-sm text-muted-foreground underline">
            Torna alla home
          </Link>
        </div>
      </main>
    )
  }

  const memory = invite.memories as unknown as {
    id: string
    title: string
    happened_at: string
    start_date?: string
    location_name: string | null
    description: string | null
    created_by: string
  } | null

  if (!memory) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-xs">
          <h1 className="text-xl font-bold tracking-tight">Ricordo non disponibile</h1>
          <Link href="/" className="text-sm text-muted-foreground underline">Torna alla home</Link>
        </div>
      </main>
    )
  }

  // ── Fetch contributions, participants, creator — all via admin (no RLS) ──
  const [contribResult, participantsResult, creatorResult] = await Promise.all([
    admin
      .from('memory_contributions')
      .select('id, content_type, text_content, media_url, caption, created_at, author_id, users ( display_name, email )')
      .eq('memory_id', memory.id)
      .order('created_at', { ascending: true }),
    admin
      .from('memory_participants')
      .select('id, user_id, display_name, joined_at, users ( display_name, email, avatar_url )')
      .eq('memory_id', memory.id),
    admin
      .from('users')
      .select('display_name, email')
      .eq('id', memory.created_by)
      .single(),
  ])

  const contributions = contribResult.data ?? []
  const participants = participantsResult.data ?? []
  const creatorName = creatorResult.data?.display_name ?? creatorResult.data?.email?.split('@')[0] ?? 'Qualcuno'

  // Hero photo — first photo contribution
  const heroPhoto = contributions.find(
    (c) => c.content_type === 'photo' && c.media_url
  )?.media_url ?? null

  // Photo contributions (excluding hero)
  const photoContribs = contributions.filter(
    (c) => c.content_type === 'photo' && c.media_url && c.media_url !== heroPhoto
  )

  // Text contributions
  const textContribs = contributions.filter(
    (c) => (c.content_type === 'text' || c.content_type === 'note') && c.text_content
  )

  // People names
  const people = participants
    .filter((p) => p.joined_at || p.display_name)
    .map((p) => {
      const u = p.users as { display_name?: string | null; email?: string | null } | null
      return u?.display_name ?? p.display_name ?? u?.email?.split('@')[0] ?? null
    })
    .filter(Boolean) as string[]

  const memoryDate = memory.start_date ?? memory.happened_at

  // ── Auth state ─────────────────────────────────────────────────────────────
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const alreadyJoined = Boolean(invite.joined_at)

  // Already joined + logged in → go straight to memory
  if (alreadyJoined && user) {
    redirect(`/memories/${memory.id}`)
  }

  // ── Accept action (for authenticated, not-yet-joined) ─────────────────────
  async function accept() {
    'use server'
    await acceptInvite(params.token)
    redirect(`/memories/${memory!.id}`)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background pb-28">

      {/* ── Hero ── */}
      <div className="relative w-full aspect-[4/3] max-h-[420px] overflow-hidden bg-muted">
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhoto}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0.75) 100%)',
          }}
        />

        {/* Tag + title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 z-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-2">
            Momento condiviso
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
            {memory.title}
          </h1>
          <p className="text-sm text-white/55 mt-1.5">
            {formatDate(memoryDate)}
            {memory.location_name && <span> · {memory.location_name}</span>}
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-lg mx-auto px-4">

        {/* Creator message */}
        <div className="mt-5 rounded-2xl bg-foreground/[0.04] border border-border/40 px-4 py-4">
          <p className="text-sm text-foreground/70 leading-relaxed">
            <span className="font-semibold text-foreground">{creatorName}</span>
            {' '}ha un ricordo da condividere con te.
          </p>
        </div>

        {/* Description */}
        {memory.description && (
          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/30 mb-2">
              Ti ricordi quando...
            </p>
            <p className="text-base leading-relaxed text-foreground/80 whitespace-pre-wrap">
              {memory.description}
            </p>
          </div>
        )}

        {/* Photo gallery */}
        {photoContribs.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/30">
              Frammenti
            </p>
            <div className="grid grid-cols-2 gap-2">
              {photoContribs.slice(0, 4).map((c) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={c.id}
                  src={c.media_url!}
                  alt={c.caption ?? ''}
                  className="w-full aspect-square rounded-xl object-cover"
                  loading="lazy"
                  draggable={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Text contributions */}
        {textContribs.length > 0 && (
          <div className="mt-6 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/30">
              Cosa ricordano
            </p>
            {textContribs.slice(0, 3).map((c) => {
              const authorData = c.users as { display_name?: string | null; email?: string | null } | null
              const authorName = authorData?.display_name ?? authorData?.email?.split('@')[0] ?? 'Qualcuno'
              const ini = initials(authorName)
              return (
                <div key={c.id} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center text-[9px] font-bold text-background shrink-0">
                      {ini}
                    </div>
                    <span className="text-xs font-medium text-foreground/60">{authorName}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/70 pl-8 line-clamp-3">
                    {c.text_content}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* People */}
        {people.length > 0 && (
          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/30 mb-2">
              Chi c&apos;era
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {people.map((name) => (
                <div key={name} className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-[11px] font-bold">
                    {initials(name)}
                  </div>
                  <span className="text-[10px] text-foreground/50 max-w-[48px] truncate text-center">
                    {name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Soft hint */}
        <p className="mt-8 text-[11px] text-muted-foreground/30 text-center leading-relaxed">
          Questo momento fa parte di qualcosa di condiviso.
        </p>
      </div>

      {/* ── Sticky bottom CTA ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border/60">
        <div className="max-w-lg mx-auto px-4 py-4">
          {!user ? (
            <>
              <p className="text-[11px] text-muted-foreground/50 text-center mb-2">
                {creatorName} ti aspetta
              </p>
              <Link
                href={`/auth/login?next=/invite/${params.token}`}
                className="flex items-center justify-center w-full rounded-full bg-foreground text-background py-3.5 text-sm font-semibold active:scale-[0.98] transition-all"
              >
                Entra nel ricordo →
              </Link>
            </>
          ) : (
            <form action={accept}>
              <p className="text-[11px] text-muted-foreground/50 text-center mb-2">
                Questo momento è anche tuo
              </p>
              <button
                type="submit"
                className="flex items-center justify-center w-full rounded-full bg-foreground text-background py-3.5 text-sm font-semibold active:scale-[0.98] transition-all"
              >
                Accetta invito →
              </button>
            </form>
          )}
        </div>
      </div>

    </main>
  )
}
