import { acceptInvite } from '@/actions/invites'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function InvitePage({ params }: { params: { token: string } }) {
  // Use admin client for token lookup — RLS would block anonymous reads
  const adminSupabase = createAdminClient()
  const { data: invite } = await adminSupabase
    .from('memory_participants')
    .select(`
      id,
      invited_email,
      joined_at,
      memories ( id, title, happened_at, location_name )
    `)
    .eq('invite_token', params.token)
    .single()

  // Invalid token
  if (!invite) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-xs">
          <div className="text-4xl">🔍</div>
          <h1 className="text-xl font-bold tracking-tight">Invito non trovato</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Il link potrebbe essere scaduto o non valido.
          </p>
        </div>
      </main>
    )
  }

  // Check current session (separate from admin client)
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memory = invite.memories
  const alreadyJoined = Boolean(invite.joined_at)

  // Already accepted + logged in → redirect to memory
  if (alreadyJoined && user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-xs">
          <div className="text-4xl">✅</div>
          <h1 className="text-xl font-bold tracking-tight">Sei già nel ricordo</h1>
          <p className="text-sm text-muted-foreground">
            Hai già accettato questo invito.
          </p>
          <a href={`/memories/${memory?.id}`}>
            <Button className="rounded-full px-6">Vai al ricordo →</Button>
          </a>
        </div>
      </main>
    )
  }

  // Not logged in → push to login first
  if (!user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-3">
            <div className="text-4xl">📬</div>
            <h1 className="text-2xl font-bold tracking-tight">Sei stato invitato</h1>
            {memory && (
              <div className="rounded-2xl border border-border bg-card p-4 text-left space-y-1 mt-4">
                <p className="font-semibold leading-snug">"{memory.title}"</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(memory.happened_at)}
                  {memory.location_name && ` · ${memory.location_name}`}
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground pt-1">
              Accedi per unirti a questo ricordo.
            </p>
          </div>
          <a href={`/auth/login?next=/invite/${params.token}`} className="block">
            <Button className="w-full rounded-full py-6 text-base font-medium">
              Accedi per continuare
            </Button>
          </a>
        </div>
      </main>
    )
  }

  // Logged in, not yet accepted → show accept form
  async function accept() {
    'use server'
    await acceptInvite(params.token)
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="text-4xl">📬</div>
          <h1 className="text-2xl font-bold tracking-tight">Sei stato invitato</h1>
          {memory && (
            <div className="rounded-2xl border border-border bg-card p-4 text-left space-y-1 mt-4">
              <p className="font-semibold leading-snug">{memory.title}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(memory.happened_at)}
                {memory.location_name && (
                  <span> · {memory.location_name}</span>
                )}
              </p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Accetta per vedere e co-costruire questo ricordo insieme.
          </p>
        </div>

        <form action={accept}>
          <Button type="submit" className="w-full rounded-full py-6 text-base font-medium">
            Accetta e partecipa
          </Button>
        </form>
      </div>
    </main>
  )
}
