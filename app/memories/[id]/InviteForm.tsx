'use client'

import { useState } from 'react'
import { createInvite } from '@/actions/invites'

export default function InviteForm({ memoryId }: { memoryId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')

  async function generateLink() {
    setLoading(true)
    setError('')
    try {
      const result = await createInvite(memoryId)
      setInviteUrl(result.inviteUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto.')
    } finally {
      setLoading(false)
    }
  }

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      await createInvite(memoryId, email)
      setEmailSent(true)
      setShowEmail(false)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback silenzioso
    }
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(`Ti invito a ricordare insieme su Appnd 📖\n${inviteUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  function reset() {
    setOpen(false)
    setInviteUrl('')
    setCopied(false)
    setShowEmail(false)
    setEmail('')
    setEmailSent(false)
    setError('')
  }

  // Stato chiuso
  if (!open) {
    return (
      <div className="text-center">
        <button
          onClick={() => { setOpen(true); generateLink() }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 group"
        >
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Invita qualcuno a co-costruire questo ricordo
        </button>
      </div>
    )
  }

  // Caricamento
  if (loading && !inviteUrl) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <p className="text-sm text-muted-foreground animate-pulse">Generazione link in corso…</p>
      </div>
    )
  }

  // Errore
  if (error && !inviteUrl) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-card p-5 space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Riprova
        </button>
      </div>
    )
  }

  // Link pronto
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">

      {/* Header */}
      <div>
        <p className="text-sm font-medium">Condividi questo ricordo</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Chiunque abbia il link può unirsi e aggiungere la sua prospettiva.
        </p>
      </div>

      {/* Pulsanti principali */}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all border ${
            copied
              ? 'bg-foreground text-background border-foreground'
              : 'bg-background border-border hover:border-foreground/30'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copiato!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copia link
            </>
          )}
        </button>

        <button
          onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium bg-[#25D366] text-white hover:bg-[#1ebe5d] transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </button>
      </div>

      {/* Email opzionale */}
      {!showEmail && !emailSent && (
        <button
          onClick={() => setShowEmail(true)}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1 text-center"
        >
          Invia anche via email →
        </button>
      )}

      {showEmail && (
        <form onSubmit={sendEmail} className="space-y-2 pt-1 border-t border-border">
          <p className="text-xs text-muted-foreground pt-2">Email (opzionale)</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@esempio.com"
              required
              autoFocus
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {loading ? '…' : 'Invia'}
            </button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            type="button"
            onClick={() => { setShowEmail(false); setError('') }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Annulla
          </button>
        </form>
      )}

      {emailSent && (
        <p className="text-xs text-muted-foreground text-center pt-1 border-t border-border">
          ✓ Email inviata
        </p>
      )}

      {/* Chiudi */}
      <button
        onClick={reset}
        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1 text-center"
      >
        Chiudi
      </button>
    </div>
  )
}
