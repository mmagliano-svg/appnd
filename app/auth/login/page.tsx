'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

// ── Inner component — reads searchParams ──────────────────────────────────

function LoginForm() {
  const searchParams = useSearchParams()
  const next        = searchParams.get('next')  ?? ''
  const draft       = searchParams.get('draft') ?? ''
  const momentTitle = searchParams.get('title') ?? ''

  // Emotional mode: user is coming from onboarding with a pending draft
  const isFromOnboarding = next.includes('/onboarding/restore')

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMessage('')

    // Build the callback URL with flat, top-level params only.
    // draft and next are separate params — no nested query strings — so
    // Supabase's emailRedirectTo allow-list matching works correctly and
    // the token survives URL-encoding through the full email redirect chain.
    const callbackParams = new URLSearchParams()
    if (next)  callbackParams.set('next',  next)
    if (draft) callbackParams.set('draft', draft)
    const redirectTo = `${window.location.origin}/auth/callback?${callbackParams.toString()}`

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      setStatus('error')
      setErrorMessage('Qualcosa è andato storto. Riprova.')
    } else {
      setStatus('sent')
    }
  }

  // ── Sent state ─────────────────────────────────────────────────────────
  if (status === 'sent') {
    return (
      <main
        className="flex min-h-screen items-center justify-center p-6"
        style={isFromOnboarding ? { background: '#F7F7F5' } : {}}
      >
        <div className="w-full max-w-sm text-center space-y-4">
          <div
            className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'rgba(17,17,17,0.05)' }}
          >
            ✉️
          </div>
          <div className="space-y-2">
            <h1
              className="text-[22px] font-semibold tracking-[-0.02em]"
              style={{ color: '#111111' }}
            >
              Controlla la tua email
            </h1>
            <p className="text-[15px]" style={{ color: '#909090' }}>
              Abbiamo inviato un link a{' '}
              <span style={{ color: '#555555', fontWeight: 500 }}>{email}</span>.
              {isFromOnboarding
                ? ' Clicca il link per salvare il tuo momento.'
                : ' Clicca il link per accedere.'}
            </p>
          </div>
          <button
            onClick={() => setStatus('idle')}
            className="text-[13px] underline underline-offset-4 mt-2"
            style={{ color: 'rgba(17,17,17,0.35)' }}
          >
            Usa un'altra email
          </button>
        </div>
      </main>
    )
  }

  // ── Idle / error state ─────────────────────────────────────────────────
  if (isFromOnboarding) {
    // ── Onboarding-specific emotional layout ──────────────────────────────
    return (
      <main
        className="flex min-h-screen items-center justify-center p-6"
        style={{ background: '#F7F7F5' }}
      >
        <div className="w-full max-w-sm space-y-8">

          <div className="space-y-2">
            <h1
              className="text-[30px] font-semibold leading-tight tracking-[-0.02em]"
              style={{ color: '#111111' }}
            >
              Non perderlo
            </h1>
            <p className="text-[16px]" style={{ color: '#909090' }}>
              {momentTitle
                ? <>Ti mandiamo un link per salvare <span style={{ color: '#555555', fontWeight: 500 }}>&ldquo;{momentTitle}&rdquo;</span>.</>
                : 'Ti mandiamo un link per salvarlo per sempre.'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="La tua email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="w-full bg-transparent text-[17px] focus:outline-none border-b pb-3"
                style={{
                  color: '#111111',
                  borderColor: 'rgba(17,17,17,0.12)',
                  caretColor: '#6B5FE8',
                }}
              />
            </div>

            {status === 'error' && (
              <p className="text-[13px]" style={{ color: '#E05252' }}>{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !email.trim()}
              className="w-full rounded-2xl py-4 text-[16px] font-medium tracking-[-0.01em] transition-transform active:scale-[0.97] disabled:opacity-40"
              style={{ background: '#6B5FE8', color: '#ffffff' }}
            >
              {status === 'loading' ? 'Invio in corso…' : 'Continua con email'}
            </button>
          </form>

          <p className="text-center text-[12px]" style={{ color: 'rgba(17,17,17,0.30)' }}>
            Ti mandiamo un link e il tuo momento sarà salvo.
          </p>

        </div>
      </main>
    )
  }

  // ── Generic login layout ───────────────────────────────────────────────
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Appnd</h1>
          <p className="text-sm text-muted-foreground">
            I momenti condivisi diventano ricordi condivisi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              placeholder="la@tuaemail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {status === 'error' && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || !email.trim()}
            className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {status === 'loading' ? 'Invio in corso…' : 'Continua con email'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Riceverai un link magico via email. Nessuna password richiesta.
        </p>
      </div>
    </main>
  )
}

// ── Page export — Suspense required for useSearchParams ───────────────────

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
