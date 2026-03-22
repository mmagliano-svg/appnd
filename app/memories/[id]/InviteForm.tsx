'use client'

import { useState } from 'react'
import { createInvite } from '@/actions/invites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function InviteForm({ memoryId }: { memoryId: string }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [inviteUrl, setInviteUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMessage('')

    try {
      const result = await createInvite(memoryId, email)
      setInviteUrl(result.inviteUrl)
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Errore imprevisto.')
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-sm text-muted-foreground underline underline-offset-4 py-2"
      >
        Invita qualcuno
      </button>
    )
  }

  if (status === 'done') {
    return (
      <div className="rounded-xl border p-4 space-y-3 text-sm">
        <p className="font-medium">Invito creato!</p>
        <p className="text-muted-foreground text-xs">
          {process.env.NEXT_PUBLIC_RESEND_CONFIGURED
            ? `Un'email è stata inviata a ${email}.`
            : 'Condividi manualmente questo link:'}
        </p>
        <div className="bg-secondary rounded-lg p-3 font-mono text-xs break-all">
          {inviteUrl}
        </div>
        <button
          onClick={() => {
            setOpen(false)
            setStatus('idle')
            setEmail('')
            setInviteUrl('')
          }}
          className="text-xs text-muted-foreground underline underline-offset-4"
        >
          Invita un'altra persona
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border p-4 space-y-3">
      <p className="text-sm font-medium">Invita qualcuno</p>
      <Input
        type="email"
        placeholder="email@esempio.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />
      {status === 'error' && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={status === 'loading'} className="flex-1">
          {status === 'loading' ? 'Invio…' : 'Invia invito'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setOpen(false); setStatus('idle'); setEmail('') }}
        >
          Annulla
        </Button>
      </div>
    </form>
  )
}
