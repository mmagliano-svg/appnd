import { createAdminClient, createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function JoinPage({ params }: { params: { token: string } }) {
  const admin = createAdminClient()

  // Load invite by token — admin client bypasses RLS (viewer may be unauthenticated)
  const { data: invite } = await admin
    .from('memory_invites')
    .select('id, memory_id, person_id, inviter_user_id, status')
    .eq('token', params.token)
    .maybeSingle()

  if (!invite || invite.status === 'expired') {
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

  // Mark as opened (fire-and-forget — never block rendering)
  if (invite.status === 'pending') {
    admin
      .from('memory_invites')
      .update({ status: 'opened', opened_at: new Date().toISOString() })
      .eq('id', invite.id)
      .then(() => {})
      .catch(() => {})
  }

  // Fetch memory and inviter in parallel
  const [memoryRes, inviterRes] = await Promise.all([
    admin
      .from('memories')
      .select('id, title, start_date, location_name')
      .eq('id', invite.memory_id)
      .maybeSingle(),
    admin
      .from('users')
      .select('display_name, email')
      .eq('id', invite.inviter_user_id)
      .maybeSingle(),
  ])

  const memory = memoryRes.data as {
    id: string
    title: string
    start_date: string
    location_name: string | null
  } | null

  // Hero photo — first chronological photo on the memory
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

  const inviter = inviterRes.data
  const inviterName = inviter?.display_name ?? inviter?.email?.split('@')[0] ?? 'Qualcuno'

  // Check session
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memoryTarget = memory ? `/memories/${memory.id}` : '/dashboard'
  const authTarget = `/auth/login?next=/join/${params.token}`

  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col">

      {/* ── Full-bleed hero ── */}
      <div className="relative flex-1 flex flex-col">

        {/* Background */}
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhoto}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950" />
        )}

        {/* Gradient overlay — strong at bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.94) 100%)',
          }}
        />

        {/* ── Content — pinned to bottom ── */}
        <div className="relative z-10 mt-auto px-6 pb-12 space-y-7">

          {/* Eyebrow */}
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
            Appnd · La vostra storia
          </p>

          {/* Memory */}
          {memory && (
            <div className="space-y-1.5">
              <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
                {memory.title}
              </h1>
              <p className="text-sm text-white/50">
                {formatDate(memory.start_date)}
                {memory.location_name && (
                  <span> · {memory.location_name}</span>
                )}
              </p>
            </div>
          )}

          {/* Emotional message */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-4">
            <p className="text-sm text-white/80 leading-relaxed">
              <span className="font-semibold text-white">{inviterName}</span>
              {' '}ha salvato questo momento con te.
              <br />
              Entra per vedere tutta la vostra storia.
            </p>
          </div>

          {/* Primary CTA */}
          <Link
            href={user ? memoryTarget : authTarget}
            className="flex items-center justify-center w-full rounded-full bg-white text-black py-4 text-base font-semibold active:scale-[0.98] transition-all"
          >
            Entra per vedere tutta la vostra storia →
          </Link>

          {/* Secondary CTA */}
          <div className="text-center">
            <Link
              href="/"
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Non ora
            </Link>
          </div>

          <p className="text-[11px] text-white/25 text-center">
            Nessuna app da scaricare. Accedi in 30 secondi.
          </p>

        </div>
      </div>

    </main>
  )
}
