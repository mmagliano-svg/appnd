'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
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

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      setStatus('error')
      setErrorMessage('Qualcosa è andato storto. Riprova.')
    } else {
      setStatus('sent')
    }
  }

  if (status === 'sent') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-3">
          <div className="text-4xl">✉️</div>
          <h1 className="text-xl font-semibold tracking-tight">Controlla la tua email</h1>
          <p className="text-sm text-muted-foreground">
            Abbiamo inviato un link magico a <strong>{email}</strong>.
            <br />
            Clicca il link per accedere.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="text-xs text-muted-foreground underline underline-offset-4 mt-4"
          >
            Usa un'altra email
          </button>
        </div>
      </main>
    )
  }

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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="la@tuaemail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          {status === 'error' && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={status === 'loading' || !email.trim()}
          >
            {status === 'loading' ? 'Invio in corso…' : 'Continua con email'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Riceverai un link magico via email. Nessuna password richiesta.
        </p>
      </div>
    </main>
  )
}
