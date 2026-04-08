import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ id?: string }>
}

export default async function CelebratePage({ searchParams }: Props) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { id } = await searchParams
  if (!id) redirect('/dashboard')

  const { data: memory } = await supabase
    .from('memories')
    .select('id, title, start_date, happened_at')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (!memory) redirect('/dashboard')

  // Count how many OTHER people have already been invited or are present
  const { count: inviteCount } = await supabase
    .from('memory_participants')
    .select('id', { count: 'exact', head: true })
    .eq('memory_id', id)
    .neq('user_id', user.id)

  const invited = inviteCount ?? 0

  // Prefer start_date (current schema) → happened_at (legacy) → null
  const dateSource = (memory as { start_date?: string | null }).start_date ?? memory.happened_at
  const happenedLabel = dateSource
    ? new Date(dateSource).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <main
      className="h-[100dvh] flex flex-col items-center justify-center px-7 text-center"
      style={{ background: '#F7F7F5' }}
    >
      <div className="animate-ob-celebrate w-full max-w-sm space-y-10">

        {/* Sparkle */}
        <p className="text-4xl select-none" aria-hidden style={{ color: 'rgba(17,17,17,0.18)' }}>✦</p>

        {/* Copy */}
        <div className="space-y-3">
          <h1
            className="text-[30px] font-semibold leading-tight tracking-[-0.02em]"
            style={{ color: '#111111' }}
          >
            Questo momento esiste
          </h1>
          <p className="text-[17px] leading-snug" style={{ color: '#909090' }}>
            {invited > 0
              ? invited === 1
                ? 'Abbiamo avvisato 1 persona che era con te'
                : `Abbiamo avvisato ${invited} persone che erano con te`
              : 'E può crescere nel tempo'}
          </p>
        </div>

        {/* Memory preview card */}
        <div
          className="rounded-2xl bg-white px-5 py-4 text-left"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)' }}
        >
          <p
            className="text-base font-semibold leading-tight line-clamp-2 mb-1.5"
            style={{ color: '#111111' }}
          >
            {memory.title}
          </p>
          {happenedLabel && (
            <p className="text-[13px]" style={{ color: '#ABABAB' }}>{happenedLabel}</p>
          )}
        </div>

        {/* CTAs */}
        <div className="space-y-3">

          {/* Primary: open the memory */}
          <Link
            href={`/memories/${memory.id}`}
            className="block w-full rounded-2xl py-4 text-[16px] font-medium text-center active:scale-[0.985] transition-transform"
            style={{ background: '#6B5FE8', color: '#ffffff' }}
          >
            Continua questo momento →
          </Link>

          {/* Secondary: invite — always visible, weight depends on context */}
          {invited === 0 ? (
            // No one invited yet — full card weight to encourage action
            <Link
              href={`/memories/${memory.id}`}
              className="block w-full rounded-2xl py-3.5 text-[15px] font-medium text-center active:scale-[0.985] transition-transform"
              style={{
                background: 'white',
                border:     '1px solid rgba(17,17,17,0.10)',
                color:      '#111111',
                boxShadow:  '0 1px 8px rgba(0,0,0,0.04)',
              }}
            >
              Invita chi era con te
            </Link>
          ) : (
            // Already invited people — lighter text link
            <Link
              href={`/memories/${memory.id}`}
              className="block w-full py-2.5 text-[14px] text-center active:opacity-50 transition-opacity"
              style={{ color: 'rgba(17,17,17,0.38)' }}
            >
              Invita qualcun altro
            </Link>
          )}

          <Link
            href="/dashboard"
            className="block w-full py-3 text-[14px] text-center"
            style={{ color: 'rgba(17,17,17,0.25)' }}
          >
            Vai alla home
          </Link>

        </div>
      </div>
    </main>
  )
}
