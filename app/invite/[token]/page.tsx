import { acceptInvite } from '@/actions/invites'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function InvitePage({ params }: { params: { token: string } }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invite } = await supabase
    .from('memory_participants')
    .select(`
      id,
      invited_email,
      joined_at,
      memories ( id, title, happened_at, location_name )
    `)
    .eq('invite_token', params.token)
    .single()

  if (!invite) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-2">
          <p className="text-xl">🔍</p>
          <h1 className="text-xl font-semibold">Invito non trovato</h1>
          <p className="text-sm text-muted-foreground">
            Il link potrebbe essere scaduto o non valido.
          </p>
        </div>
      </main>
    )
  }

  const memory = invite.memories
  const alreadyJoined = Boolean(invite.joined_at)

  if (alreadyJoined && user) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-xl">✅</p>
          <h1 className="text-xl font-semibold">Hai già accettato questo invito</h1>
          <a href={`/memories/${memory?.id}`}>
            <Button>Vai al ricordo</Button>
          </a>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="space-y-2">
            <p className="text-3xl">📬</p>
            <h1 className="text-xl font-semibold">Sei stato invitato</h1>
            {memory && (
              <p className="text-muted-foreground text-sm">
                Per accedere al ricordo <strong>"{memory.title}"</strong>,
                accedi con la tua email.
              </p>
            )}
          </div>
          <a
            href={`/auth/login?next=/invite/${params.token}`}
          >
            <Button className="w-full">Accedi per continuare</Button>
          </a>
        </div>
      </main>
    )
  }

  async function accept() {
    'use server'
    await acceptInvite(params.token)
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="space-y-2">
          <p className="text-3xl">📬</p>
          <h1 className="text-xl font-semibold">Sei stato invitato</h1>
          {memory && (
            <div className="space-y-1">
              <p className="font-medium">{memory.title}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(memory.happened_at).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                {memory.location_name && ` · ${memory.location_name}`}
              </p>
            </div>
          )}
        </div>

        <form action={accept}>
          <Button type="submit" className="w-full">
            Accetta invito e partecipa
          </Button>
        </form>
      </div>
    </main>
  )
}
