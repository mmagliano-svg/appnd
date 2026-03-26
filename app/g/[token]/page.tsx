import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getGroupByInviteToken, joinGroup } from '@/actions/groups'
import { GROUP_TYPES } from '@/lib/constants/groups'

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

export default async function GroupInviteLanding({ params }: { params: { token: string } }) {
  const preview = await getGroupByInviteToken(params.token)

  if (!preview) {
    return (
      <main className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-xs">
          <p className="text-3xl">🔍</p>
          <h1 className="text-xl font-bold text-white tracking-tight">Gruppo non trovato</h1>
          <p className="text-sm text-white/50 leading-relaxed">
            Il link potrebbe essere scaduto o non valido.
          </p>
          <Link href="/" className="text-sm text-white/40 underline">Torna alla home</Link>
        </div>
      </main>
    )
  }

  // Check if already logged in
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in → join immediately and redirect
  if (user) {
    const { groupId, error } = await joinGroup(params.token)
    if (!error && groupId) redirect(`/groups/${groupId}`)
  }

  // Not logged in → show landing
  const memberNames = preview.previewMembers.map((m) => m.displayName).join(', ')

  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col">
      <div className="flex-1 flex flex-col justify-end px-6 pb-12 pt-20 relative">

        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-950" />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.04) 0%, transparent 60%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 space-y-8">

          {/* Group identity */}
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center text-3xl">
              {getGroupEmoji(preview.type)}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-2">
                {getGroupLabel(preview.type)} · Appnd
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
                {preview.name}
              </h1>
            </div>

            {/* Members */}
            {preview.memberCount > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  {preview.previewMembers.map((m, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[11px] font-bold text-white/80"
                      style={{ marginLeft: i > 0 ? '-6px' : 0 }}
                    >
                      {initials(m.displayName)}
                    </div>
                  ))}
                  {preview.memberCount > 4 && (
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white/60 -ml-1.5">
                      +{preview.memberCount - 4}
                    </div>
                  )}
                </div>
                <p className="text-sm text-white/50">
                  {memberNames}{preview.memberCount > 4 ? ` e altri ${preview.memberCount - 4}` : ''} {preview.memberCount === 1 ? 'già nel gruppo' : 'già nel gruppo'}
                </p>
              </div>
            )}
          </div>

          {/* Invite message */}
          <div className="rounded-2xl bg-white/8 border border-white/10 px-4 py-4">
            <p className="text-sm text-white/75 leading-relaxed">
              <span className="font-semibold text-white">{preview.inviterName}</span>
              {' '}ti ha invitato a far parte di questo gruppo.
              Unisciti per condividere e co-costruire i ricordi insieme.
            </p>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Link
              href={`/auth/login?next=/g/${params.token}`}
              className="flex items-center justify-center w-full rounded-full bg-white text-black py-4 text-base font-semibold active:scale-[0.98] transition-all"
            >
              Unisciti al gruppo →
            </Link>
            <p className="text-xs text-white/25 text-center">
              Nessuna app. Accedi in 30 secondi.
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}
