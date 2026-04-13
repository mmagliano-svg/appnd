'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateDisplayName, updateBirthDate } from '@/actions/profile'

interface Props {
  userId: string
  email: string
  initialDisplayName: string
  initialBirthDate: string
  memberSince: string
  stats: { memories: number; contributions: number }
}

function formatMemberSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  })
}

function initials(name: string, email: string) {
  const n = name.trim()
  if (n) {
    const parts = n.split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return n.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

export function ProfileClient({ userId, email, initialDisplayName, initialBirthDate, memberSince, stats }: Props) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [draft, setDraft] = useState(initialDisplayName)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [signingOut, setSigningOut] = useState(false)

  // Birth date
  const [birthDate, setBirthDate] = useState(initialBirthDate)
  const [birthDraft, setBirthDraft] = useState(initialBirthDate)
  const [editingBirth, setEditingBirth] = useState(false)
  const [birthSaved, setBirthSaved] = useState(false)
  const [birthError, setBirthError] = useState('')

  const ini = initials(displayName || draft, email)
  const displayLabel = displayName || email

  function startEdit() {
    setDraft(displayName)
    setEditing(true)
    setSaved(false)
    setError('')
  }

  function cancelEdit() {
    setDraft(displayName)
    setEditing(false)
    setError('')
  }

  function saveEdit() {
    const trimmed = draft.trim()
    if (!trimmed) {
      setError('Il nome non può essere vuoto.')
      return
    }
    startTransition(async () => {
      const result = await updateDisplayName(trimmed)
      if (result?.error) {
        setError(result.error)
      } else {
        setDisplayName(trimmed)
        setEditing(false)
        setSaved(true)
        router.refresh()
      }
    })
  }

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-28">

        {/* Top bar */}
        <div className="pt-6 pb-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
        </div>

        {/* Hero */}
        <div className="pt-8 pb-8 flex items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-foreground flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold tracking-tight text-background">{ini}</span>
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight leading-tight truncate">
              {displayLabel}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{email}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Con noi da {formatMemberSince(memberSince)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 pb-8 border-b border-border/50">
          <div>
            <p className="text-2xl font-bold tabular-nums leading-none">{stats.memories}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ricord{stats.memories === 1 ? 'o' : 'i'}
            </p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="text-2xl font-bold tabular-nums leading-none">{stats.contributions}</p>
            <p className="text-xs text-muted-foreground mt-1">
              contribut{stats.contributions === 1 ? 'o' : 'i'}
            </p>
          </div>
        </div>

        {/* ── Display name ── */}
        <div className="py-6 border-b border-border/50">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Nome
          </p>

          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                placeholder="Il tuo nome"
                autoFocus
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={isPending || !draft.trim()}
                  className="flex-1 rounded-full bg-foreground text-background py-2.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Salvataggio…' : 'Salva'}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={isPending}
                  className="flex-1 rounded-full border border-border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium">
                  {displayName || <span className="text-muted-foreground italic">Non impostato</span>}
                </p>
                {saved && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Salvato</p>
                )}
              </div>
              <button
                onClick={startEdit}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                Modifica
              </button>
            </div>
          )}
        </div>

        {/* ── Email ── */}
        <div className="py-6 border-b border-border/50">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Email
          </p>
          <p className="text-base text-foreground/80">{email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            L&apos;email non può essere modificata.
          </p>
        </div>

        {/* ── Birth date ── */}
        <div className="py-6 border-b border-border/50">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Data di nascita
          </p>

          {editingBirth ? (
            <div className="space-y-3">
              <input
                type="date"
                value={birthDraft}
                onChange={(e) => { setBirthDraft(e.target.value); setBirthError('') }}
                autoFocus
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {birthError && <p className="text-xs text-destructive">{birthError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    startTransition(async () => {
                      const result = await updateBirthDate(birthDraft)
                      if (result?.error) {
                        setBirthError(result.error)
                      } else {
                        setBirthDate(birthDraft)
                        setEditingBirth(false)
                        setBirthSaved(true)
                        router.refresh()
                      }
                    })
                  }}
                  disabled={isPending}
                  className="flex-1 rounded-full bg-foreground text-background py-2.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Salvataggio…' : 'Salva'}
                </button>
                <button
                  onClick={() => { setBirthDraft(birthDate); setEditingBirth(false); setBirthError('') }}
                  disabled={isPending}
                  className="flex-1 rounded-full border border-border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium">
                  {birthDate
                    ? new Date(birthDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
                    : <span className="text-muted-foreground italic">Non impostata</span>}
                </p>
                {birthSaved && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Salvato</p>
                )}
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  Serve per calcolare la tua età nei ricordi.
                </p>
              </div>
              <button
                onClick={() => { setBirthDraft(birthDate); setEditingBirth(true); setBirthSaved(false); setBirthError('') }}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                {birthDate ? 'Modifica' : 'Aggiungi'}
              </button>
            </div>
          )}
        </div>

        {/* ── Sign out ── */}
        <div className="pt-8">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full rounded-full border border-border py-3 text-sm font-medium text-muted-foreground hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50"
          >
            {signingOut ? 'Uscita in corso…' : 'Esci dall\'account'}
          </button>
        </div>

      </div>
    </main>
  )
}
