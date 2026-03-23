import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from '@/components/memory/CategoryBadge'
import { TagBadge } from '@/components/memory/TagBadge'
import { DeleteButton } from '@/components/memory/DeleteButton'
import InviteForm from './InviteForm'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function MemoryPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: memory } = await supabase
    .from('memories')
    .select(`
      *,
      memory_participants (
        id,
        user_id,
        invited_email,
        joined_at,
        users ( id, display_name, email )
      ),
      memory_contributions (
        id,
        content_type,
        text_content,
        media_url,
        caption,
        created_at,
        author_id,
        users ( id, display_name, email )
      )
    `)
    .eq('id', params.id)
    .single()

  if (!memory) notFound()

  const isParticipant = memory.memory_participants.some(
    (p) => p.user_id === user?.id && p.joined_at
  )

  if (!isParticipant) notFound()

  const isCreator = memory.created_by === user?.id

  const contributions = [...memory.memory_contributions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const participants = memory.memory_participants.filter((p) => p.joined_at)
  const tags: string[] = (memory as { tags?: string[] }).tags ?? []

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <div className="py-8 space-y-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-muted-foreground">
            ← I tuoi ricordi
          </Link>
          {isCreator && (
            <div className="flex gap-2">
              <Link href={`/memories/${params.id}/edit`}>
                <Button variant="outline" size="sm">Modifica</Button>
              </Link>
              <DeleteButton memoryId={params.id} />
            </div>
          )}
        </div>

        {/* Memory header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{memory.title}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(memory.happened_at)}
            {memory.location_name && ` · ${memory.location_name}`}
          </p>

          {/* Category + Tags */}
          {((memory as { category?: string | null }).category || tags.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <CategoryBadge category={(memory as { category?: string | null }).category} size="md" />
              {tags.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}

          {memory.description && (
            <p className="text-sm mt-3 text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {memory.description}
            </p>
          )}
        </div>

        {/* Participants */}
        {participants.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Con:</span>
            {participants.map((p) => {
              const name = p.users?.display_name ?? p.users?.email ?? p.invited_email ?? '?'
              return (
                <span
                  key={p.id}
                  className="text-xs bg-secondary rounded-full px-3 py-1"
                >
                  {name}
                </span>
              )
            })}
          </div>
        )}

        {/* Contributions */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Contributi
          </h2>

          {contributions.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-muted-foreground text-sm">Ancora nessun contributo.</p>
              <p className="text-xs text-muted-foreground">Sii il primo ad aggiungere qualcosa.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {contributions.map((c) => {
                const authorName =
                  (c as { users?: { display_name?: string | null; email?: string | null } }).users?.display_name ??
                  (c as { users?: { display_name?: string | null; email?: string | null } }).users?.email ??
                  'Anonimo'
                const isOwn = c.author_id === user?.id
                return (
                  <li
                    key={c.id}
                    className={`rounded-xl border p-4 space-y-2 ${isOwn ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{isOwn ? 'Tu' : authorName}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(c.created_at)}</span>
                    </div>
                    {c.text_content && (
                      <p className="text-sm whitespace-pre-wrap">{c.text_content}</p>
                    )}
                    {c.media_url && (
                      <img
                        src={c.media_url}
                        alt={c.caption ?? ''}
                        className="w-full rounded-lg object-cover max-h-64"
                      />
                    )}
                    {c.caption && c.content_type === 'photo' && (
                      <p className="text-xs text-muted-foreground italic">{c.caption}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-3">
          <Link href={`/memories/${params.id}/contribute`}>
            <Button className="w-full">+ Aggiungi contributo</Button>
          </Link>

          <InviteForm memoryId={params.id} />
        </div>
      </div>
    </main>
  )
}
