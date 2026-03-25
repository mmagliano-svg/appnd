import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { DeleteButton } from '@/components/memory/DeleteButton'
import { getCategoryByValue } from '@/lib/constants/categories'
import { formatMemoryDateFull, formatMemoryDate, formatPeriodDisplay } from '@/lib/utils/dates'
import InviteForm from './InviteForm'

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
  const category = (memory as { category?: string | null }).category
  const catInfo = getCategoryByValue(category)

  const memoryEndDate = (memory as { end_date?: string | null }).end_date ?? null
  const memoryStartDate = (memory as { start_date?: string }).start_date ?? memory.happened_at
  const memoryParentPeriodId = (memory as { parent_period_id?: string | null }).parent_period_id ?? null
  const isPeriod = Boolean(memoryEndDate)

  // Fetch child events if this is a period (RLS ensures user can only see their own)
  const { data: childEventsData } = isPeriod
    ? await supabase
        .from('memories')
        .select('id, title, start_date, location_name, category')
        .eq('parent_period_id', memory.id)
        .is('end_date', null)
        .order('start_date', { ascending: true })
    : { data: [] }
  const childEvents = (childEventsData ?? []) as Array<{
    id: string; title: string; start_date: string; location_name: string | null; category: string | null
  }>

  // Fetch parent period if this is an event with a parent
  const parentPeriod = !isPeriod && memoryParentPeriodId
    ? await supabase
        .from('memories')
        .select('id, title, start_date, end_date')
        .eq('id', memoryParentPeriodId)
        .single()
        .then(({ data }) => data as { id: string; title: string; start_date: string; end_date: string } | null)
    : null

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-16">

        {/* Top navigation */}
        <div className="flex items-center justify-between pt-6 pb-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            I tuoi ricordi
          </Link>
          {isCreator && (
            <div className="flex items-center gap-2">
              <Link href={`/memories/${params.id}/edit`}>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Modifica
                </Button>
              </Link>
              <DeleteButton memoryId={params.id} />
            </div>
          )}
        </div>

        {/* Memory hero section */}
        <div className="pt-6 pb-8 border-b border-border/50">
          {/* Category label */}
          {catInfo && (
            <Link
              href={`/dashboard?category=${catInfo.value}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-3 group"
            >
              <span>{catInfo.emoji}</span>
              <span className="uppercase tracking-wider group-hover:underline underline-offset-2">
                {catInfo.label}
              </span>
            </Link>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-tight leading-tight mb-3">
            {memory.title}
          </h1>

          {/* Meta: date + location */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatMemoryDateFull(
                (memory as { start_date?: string }).start_date ?? memory.happened_at,
                (memory as { end_date?: string | null }).end_date ?? null
              )}
            </span>
            {memory.location_name && (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {memory.location_name}
              </span>
            )}
          </div>

          {/* Connections / Tags */}
          {tags.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border/40">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5">
                Connessioni
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className="inline-flex items-center rounded-full border border-border bg-background hover:bg-accent hover:border-foreground/20 px-3 py-1.5 text-xs font-medium text-foreground/70 hover:text-foreground transition-all"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {memory.description && (
            <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {memory.description}
            </p>
          )}

          {/* Parent period reference */}
          {parentPeriod && (
            <div className="mt-5 pt-4 border-t border-border/40">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Parte di
              </p>
              <Link
                href={`/memories/${parentPeriod.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border hover:border-foreground/20 bg-background hover:bg-accent/30 px-4 py-3 transition-all group"
              >
                <div>
                  <p className="text-sm font-medium group-hover:text-foreground transition-colors">
                    {parentPeriod.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatPeriodDisplay(parentPeriod.start_date, parentPeriod.end_date)}
                  </p>
                </div>
                <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Participants */}
        {participants.length > 0 && (
          <div className="py-5 border-b border-border/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5">
              Partecipanti
            </p>
            <div className="flex flex-wrap gap-2">
              {participants.map((p) => {
                const name =
                  p.users?.display_name ?? p.users?.email ?? p.invited_email ?? '?'
                const initials = name.slice(0, 2).toUpperCase()
                const isMe = p.user_id === user?.id
                const chip = (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors ${
                      isMe
                        ? 'bg-secondary'
                        : 'bg-secondary hover:bg-accent cursor-pointer'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                      {initials}
                    </div>
                    <span className="text-xs font-medium">{name}</span>
                    {!isMe && (
                      <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                )
                if (!isMe && p.user_id) {
                  return (
                    <Link key={p.id} href={`/people/${p.user_id}`}>
                      {chip}
                    </Link>
                  )
                }
                return <div key={p.id}>{chip}</div>
              })}
            </div>
          </div>
        )}

        {/* Child events (only for periods) */}
        {isPeriod && (
          <div className="py-5 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Momenti di questo periodo · {childEvents.length}
              </p>
              <Link href="/memories/new">
                <Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-foreground rounded-full px-3">
                  + Aggiungi
                </Button>
              </Link>
            </div>
            {childEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Nessun momento collegato a questo periodo.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {childEvents.map((ev) => {
                  const evCat = getCategoryByValue(ev.category)
                  return (
                    <li key={ev.id}>
                      <Link
                        href={`/memories/${ev.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border hover:border-foreground/20 bg-card hover:bg-accent/30 px-4 py-3 transition-all group"
                      >
                        <div className="min-w-0">
                          {evCat && (
                            <p className="text-xs text-muted-foreground mb-0.5">
                              {evCat.emoji} {evCat.label}
                            </p>
                          )}
                          <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
                            {ev.title}
                          </p>
                          {ev.location_name && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">📍 {ev.location_name}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatMemoryDate(ev.start_date, null)}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {/* Contributions */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Contributi · {contributions.length}
            </p>
            <Link href={`/memories/${params.id}/contribute`}>
              <Button size="sm" className="rounded-full px-4 text-xs">
                + Aggiungi
              </Button>
            </Link>
          </div>

          {contributions.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="text-3xl mb-3">✦</div>
              <p className="text-sm font-medium">Ancora nessun contributo.</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Aggiungi i tuoi pensieri, ricordi o note su questo momento.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {contributions.map((c) => {
                const authorName =
                  (c as { users?: { display_name?: string | null; email?: string | null } }).users
                    ?.display_name ??
                  (c as { users?: { display_name?: string | null; email?: string | null } }).users
                    ?.email ??
                  'Anonimo'
                const isOwn = c.author_id === user?.id
                return (
                  <li
                    key={c.id}
                    className={`rounded-2xl p-4 space-y-2 ${
                      isOwn
                        ? 'bg-foreground/5 border border-foreground/10'
                        : 'bg-card border border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">
                        {isOwn ? 'Tu' : authorName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(c.created_at)}
                      </span>
                    </div>
                    {c.text_content && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/85">
                        {c.text_content}
                      </p>
                    )}
                    {c.media_url && (
                      <img
                        src={c.media_url}
                        alt={c.caption ?? ''}
                        className="w-full rounded-xl object-cover max-h-64"
                      />
                    )}
                    {c.caption && c.content_type === 'photo' && (
                      <p className="text-xs text-muted-foreground italic">
                        {c.caption}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Invite section */}
        <div className="mt-8 pt-6 border-t border-border/50">
          <InviteForm memoryId={params.id} />
        </div>
      </div>
    </main>
  )
}
