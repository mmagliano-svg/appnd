'use client'

import { useState, useTransition } from 'react'
import { createMemoryInvite } from '@/actions/invites'

type InvitablePerson = {
  id: string
  name: string
  status: 'ghost' | 'invited'
}

export function InvitePeopleSection({
  memoryId,
  people,
}: {
  memoryId: string
  people: InvitablePerson[]
}) {
  if (people.length === 0) return null

  return (
    <div className="py-4 border-b border-border/50">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
        Invita alla vostra storia
      </p>
      <div className="space-y-2.5">
        {people.map((person) => (
          <InviteRow key={person.id} memoryId={memoryId} person={person} />
        ))}
      </div>
    </div>
  )
}

function InviteRow({
  memoryId,
  person,
}: {
  memoryId: string
  person: InvitablePerson
}) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState('')
  const [isPending, startTransition] = useTransition()

  function generate() {
    startTransition(async () => {
      try {
        const result = await createMemoryInvite(memoryId, person.id)
        setInviteUrl(result.inviteUrl)
        setErr('')
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Errore nella generazione del link.')
      }
    })
  }

  function copy() {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{person.name}</p>
          <p className="text-xs text-muted-foreground">
            {person.status === 'ghost' ? 'Non ancora su Appnd' : 'Invitato in precedenza'}
          </p>
        </div>
        {!inviteUrl && (
          <button
            type="button"
            onClick={generate}
            disabled={isPending}
            className="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-40 transition-colors"
          >
            {isPending ? '…' : 'Ottieni link'}
          </button>
        )}
      </div>

      {inviteUrl && (
        <div className="flex items-center gap-2 bg-background rounded-lg border border-border/40 px-3 py-2">
          <p className="text-xs text-muted-foreground/60 truncate flex-1 font-mono">
            {inviteUrl}
          </p>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 text-xs font-medium text-foreground/60 hover:text-foreground transition-colors"
          >
            {copied ? '✓ Copiato' : 'Copia'}
          </button>
        </div>
      )}

      {err && (
        <p className="text-xs text-destructive">{err}</p>
      )}
    </div>
  )
}
