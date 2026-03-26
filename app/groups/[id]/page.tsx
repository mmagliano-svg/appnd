import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getGroupDetail } from '@/actions/groups'
import { GROUP_TYPES } from '@/lib/constants/groups'
import { getCategoryByValue } from '@/lib/constants/categories'
import { formatMemoryDate } from '@/lib/utils/dates'
import { GroupInviteButton } from './GroupInviteButton'

function getGroupEmoji(type: string) {
  return GROUP_TYPES.find((t) => t.value === type)?.emoji ?? '◎'
}

function getGroupLabel(type: string) {
  return GROUP_TYPES.find((t) => t.value === type)?.label ?? type
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { new?: string }
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const group = await getGroupDetail(params.id)
  if (!group) notFound()

  const isCreator = group.createdBy === user.id
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const groupInviteUrl = `${appUrl}/g/${group.inviteToken}`
  const isNew = searchParams.new === '1'

  return (
    <main className="min-h-screen bg-background">

      {/* ── Header ── */}
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
        </div>
      </div>

      {/* ── Group hero ── */}
      <div className="max-w-lg mx-auto px-4 pb-4 border-b border-border/40">
        {/* New-group celebration banner */}
        {isNew && (
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 px-4 py-3 mb-5 flex items-center gap-3">
            <span className="text-lg">🎉</span>
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Gruppo creato!</p>
              <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">Condividi il link per invitare le persone.</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-4">
          {/* Group avatar */}
          <div className="w-14 h-14 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center shrink-0 text-2xl">
            {getGroupEmoji(group.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-0.5">
              {getGroupLabel(group.type)}
            </p>
            <h1 className="text-2xl font-bold tracking-tight leading-tight">{group.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {group.members.length} {group.members.length === 1 ? 'membro' : 'membri'} · {group.memories.length} moment{group.memories.length === 1 ? 'o' : 'i'}
            </p>
          </div>
        </div>

        {/* Members row */}
        <div className="flex items-center gap-2 mt-5 flex-wrap">
          {group.members.map((m) => {
            const isMe = m.userId === user.id
            const ini = initials(m.displayName)
            return (
              <div key={m.id} className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
                <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center text-[9px] font-bold text-background">
                  {ini}
                </div>
                <span className="text-xs font-medium">{isMe ? 'Tu' : m.displayName}</span>
                {m.role === 'admin' && (
                  <span className="text-[9px] text-muted-foreground/50">admin</span>
                )}
              </div>
            )
          })}

          {/* Invite button */}
          <GroupInviteButton inviteUrl={groupInviteUrl} />
        </div>
      </div>

      {/* ── Memories timeline ── */}
      <div className="max-w-lg mx-auto px-4 pt-6 pb-32">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
            Momenti condivisi
          </p>
        </div>

        {group.memories.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-3xl">✦</p>
            <p className="text-sm font-medium">Nessun momento ancora.</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Crea il primo momento del gruppo e invita gli altri a contribuire.
            </p>
            <Link
              href={`/memories/new?group=${group.id}`}
              className="inline-flex items-center gap-2 mt-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              + Aggiungi momento
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {group.memories.map((m) => {
              const catInfo = getCategoryByValue(m.categories[0] ?? null)
              return (
                <Link
                  key={m.id}
                  href={`/memories/${m.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card hover:border-foreground/20 hover:bg-accent/20 transition-all group overflow-hidden"
                >
                  {/* Photo thumbnail */}
                  <div className="w-16 h-16 shrink-0 bg-muted overflow-hidden">
                    {m.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.previewUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                        {catInfo ? (
                          <span className="text-xl">{catInfo.emoji}</span>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-3 pr-4">
                    {catInfo && (
                      <p className="text-xs text-muted-foreground mb-0.5">{catInfo.emoji} {catInfo.label}</p>
                    )}
                    <p className="text-sm font-semibold leading-snug truncate">{m.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">{formatMemoryDate(m.startDate, null)}</p>
                      {m.locationName && (
                        <p className="text-xs text-muted-foreground truncate">· {m.locationName}</p>
                      )}
                    </div>
                  </div>

                  <svg className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 mr-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <div className="fixed bottom-6 right-4 z-50" style={{ right: 'max(1rem, calc((100vw - 32rem) / 2 + 1rem))' }}>
        <Link
          href={`/memories/new?group=${group.id}`}
          className="flex items-center gap-2.5 rounded-full bg-foreground text-background pl-5 pr-6 py-3.5 text-sm font-semibold shadow-xl hover:bg-foreground/90 active:scale-95 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuovo momento
        </Link>
      </div>

    </main>
  )
}
