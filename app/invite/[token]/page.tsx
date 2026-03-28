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

export default async function InvitePage({ params }: { params: { token: string } }) {
  const admin = createAdminClient()

  // Fetch invite + memory info
  const { data: invite } = await admin
    .from('memory_participants')
    .select(`
      id,
      invited_email,
      joined_at,
      memories ( id, title, happened_at, location_name, created_by )
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
    location_name: string | null
    created_by: string
  } | null

  // Fetch hero photo
  let heroPhoto: string | null = null
  if (memory) {
    const { data: photoRow } = await admin
      .from('memory_contributions')
      .select('media_url')
      .eq('memory_id', memory.id)
      .eq('content_type', 'photo')
      .not('media_url', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    heroPhoto = (photoRow as { media_url: string } | null)?.media_url ?? null
  }

  // Fetch creator name
  let creatorName = 'Qualcuno'
  if (memory?.created_by) {
    const { data: creator } = await admin
      .from('users')
      .select('display_name, email')
      .eq('id', memory.created_by)
      .single()
    creatorName = creator?.display_name ?? creator?.email ?? 'Qualcuno'
  }

  // Check current session
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const alreadyJoined = Boolean(invite.joined_at)

  // ── Already accepted + logged in ────────────────────────────────────────
  if (alreadyJoined && user) {
    return (
      <LandingPage heroPhoto={heroPhoto} memory={memory} creatorName={creatorName}>
        <div className="space-y-3">
          <p className="text-white/60 text-sm text-center">
            Sei già parte di questo ricordo.
          </p>
          <Link
            href={`/memories/${memory?.id}`}
            className="flex items-center justify-center w-full rounded-full bg-white text-black py-4 text-base font-semibold active:scale-[0.98] transition-all"
          >
            Apri il ricordo →
          </Link>
        </div>
      </LandingPage>
    )
  }

  // ── Not logged in — emotional landing ───────────────────────────────────
  if (!user) {
    return (
      <LandingPage heroPhoto={heroPhoto} memory={memory} creatorName={creatorName}>
        <Link
          href={`/auth/login?next=/invite/${params.token}`}
          className="flex items-center justify-center w-full rounded-full bg-white text-black py-4 text-base font-semibold active:scale-[0.98] transition-all"
        >
          Guarda il ricordo →
        </Link>
      </LandingPage>
    )
  }

  // ── Logged in, not yet accepted ──────────────────────────────────────────
  async function accept() {
    'use server'
    await acceptInvite(params.token)
    redirect(`/memories/${memory?.id}`)
  }

  return (
    <LandingPage heroPhoto={heroPhoto} memory={memory} creatorName={creatorName}>
      <form action={accept}>
        <button
          type="submit"
          className="flex items-center justify-center w-full rounded-full bg-white text-black py-4 text-base font-semibold active:scale-[0.98] transition-all"
        >
          Entra nel ricordo →
        </button>
      </form>
    </LandingPage>
  )
}

// ── Landing shell ────────────────────────────────────────────────────────────

function LandingPage({
  heroPhoto,
  memory,
  creatorName,
  children,
}: {
  heroPhoto: string | null
  memory: { id: string; title: string; happened_at: string; location_name: string | null } | null
  creatorName: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col">

      {/* ── Full-bleed hero ── */}
      <div className="relative flex-1 flex flex-col">
        {/* Background photo */}
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhoto}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950" />
        )}

        {/* Gradient overlay — strong at bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.92) 100%)',
          }}
        />

        {/* ── Content — pinned to bottom ── */}
        <div className="relative z-10 mt-auto px-6 pb-10 space-y-6">

          {/* Tag */}
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
            Appnd · Momento condiviso
          </p>

          {/* Memory info */}
          {memory ? (
            <div className="space-y-1.5">
              <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
                {memory.title}
              </h1>
              <p className="text-sm text-white/55">
                {formatDate(memory.happened_at)}
                {memory.location_name && (
                  <span> · {memory.location_name}</span>
                )}
              </p>
            </div>
          ) : (
            <h1 className="text-3xl font-bold text-white">Invito a un ricordo</h1>
          )}

          {/* Creator message */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-4">
            <p className="text-sm text-white/80 leading-relaxed">
              <span className="font-semibold text-white">{creatorName}</span>
              {' '}ha un ricordo da condividere con te.
              Entra per vederlo.
            </p>
          </div>

          {/* CTA */}
          {children}

          <p className="text-[11px] text-white/30 text-center">
            Nessuna app da scaricare. Accedi in 30 secondi.
          </p>
        </div>
      </div>

    </main>
  )
}
