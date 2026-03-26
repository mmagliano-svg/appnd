'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createInvite } from '@/actions/invites'
import type { PersonSummary } from '@/actions/people'

interface Props {
  memoryId: string
  memoryTitle: string
  memoryDate: string
  memoryLocation: string | null
  heroPhoto: string | null
  contacts: PersonSummary[]
  isNewMemory: boolean
}

type Step = 'trigger' | 'pick' | 'share'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

function buildWhatsAppUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

function buildSmsUrl(text: string) {
  return `sms:?body=${encodeURIComponent(text)}`
}

export function ShareFlowClient({
  memoryId,
  memoryTitle,
  memoryDate,
  memoryLocation,
  heroPhoto,
  contacts,
  isNewMemory,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('trigger')
  const [selectedContact, setSelectedContact] = useState<PersonSummary | null>(null)
  const [email, setEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const shareText = `Ho un ricordo da condividere con te su Appnd: "${memoryTitle}". Aggiungiti → `

  function goToMemory() {
    router.push(`/memories/${memoryId}`)
  }

  function handleGenerateLink() {
    const inviteEmail = email.trim() || undefined
    setErrorMsg('')

    startTransition(async () => {
      try {
        const result = await createInvite(memoryId, inviteEmail)
        setInviteUrl(result.inviteUrl)
        setStep('share')
      } catch {
        setErrorMsg('Impossibile creare il link. Riprova.')
      }
    })
  }

  async function handleCopy() {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text
    }
  }

  function resetPick() {
    setSelectedContact(null)
    setEmail('')
    setErrorMsg('')
    setStep('pick')
  }

  // ── Shared hero block ──────────────────────────────────────────────────────
  const Hero = () => (
    <div className="relative w-full aspect-[4/3] max-h-72 bg-neutral-900 overflow-hidden shrink-0">
      {heroPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={heroPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
        <p className="text-white font-bold text-xl leading-tight">{memoryTitle}</p>
        <p className="text-white/60 text-xs mt-1">
          {formatDate(memoryDate)}
          {memoryLocation && ` · ${memoryLocation}`}
        </p>
      </div>
    </div>
  )

  // ──────────────────────────────────────────────────────────────────────────
  // STEP: trigger
  // ──────────────────────────────────────────────────────────────────────────
  if (step === 'trigger') {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <Hero />

        <div className="flex-1 flex flex-col justify-between px-5 py-8">
          <div className="space-y-3">
            {isNewMemory && (
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                Ricordo salvato ✓
              </p>
            )}
            <h1 className="text-3xl font-bold tracking-tight leading-snug">
              Vuoi condividerlo con qualcuno?
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              I momenti vissuti insieme diventano ricordi di entrambi.
            </p>
          </div>

          <div className="space-y-3 mt-10">
            <button
              onClick={() => setStep('pick')}
              className="w-full rounded-full bg-foreground text-background py-4 text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Invita qualcuno
            </button>
            <button
              onClick={goToMemory}
              className="w-full rounded-full py-4 text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Salta per ora
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STEP: pick person
  // ──────────────────────────────────────────────────────────────────────────
  if (step === 'pick') {
    const hasInput = email.trim().length > 0 || selectedContact !== null

    return (
      <main className="min-h-screen bg-background flex flex-col">
        <Hero />

        <div className="flex-1 flex flex-col px-5 py-6">
          {/* Back */}
          <button
            onClick={() => setStep('trigger')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 self-start"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
            Indietro
          </button>

          <h2 className="text-2xl font-bold tracking-tight mb-1">Con chi hai vissuto questo momento?</h2>
          <p className="text-sm text-muted-foreground mb-6">Scegli dai tuoi contatti o aggiungi una nuova persona.</p>

          {/* Existing contacts */}
          {contacts.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50 mb-3">
                Persone che conosci
              </p>
              <div className="flex flex-wrap gap-2">
                {contacts.map((c) => {
                  const isSelected = selectedContact?.userId === c.userId
                  return (
                    <button
                      key={c.userId}
                      onClick={() => {
                        setSelectedContact(isSelected ? null : c)
                        setEmail('')
                      }}
                      className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium border transition-all ${
                        isSelected
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-background text-foreground border-border hover:border-foreground/40'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${isSelected ? 'bg-background text-foreground' : 'bg-foreground text-background'}`}>
                        {c.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      {c.displayName}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Manual email input */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
              {contacts.length > 0 ? 'Oppure nuova persona' : 'Inserisci email'}
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (e.target.value) setSelectedContact(null)
              }}
              placeholder="email@esempio.com"
              className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground/50 px-1">
              Riceverà un link di invito via email.
            </p>
          </div>

          {errorMsg && (
            <p className="text-sm text-rose-500 mt-3">{errorMsg}</p>
          )}

          <div className="mt-auto pt-8">
            <button
              onClick={handleGenerateLink}
              disabled={!hasInput || isPending}
              className="w-full rounded-full bg-foreground text-background py-4 text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30"
            >
              {isPending ? 'Creazione link…' : 'Crea link di invito'}
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STEP: share
  // ──────────────────────────────────────────────────────────────────────────
  const fullShareText = inviteUrl ? `${shareText}${inviteUrl}` : ''

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Hero />

      <div className="flex-1 flex flex-col px-5 py-6">
        {/* Back */}
        <button
          onClick={resetPick}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
          </svg>
          Indietro
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Link pronto!</h2>
            <p className="text-sm text-muted-foreground">Scegli come condividerlo.</p>
          </div>
        </div>

        {/* Link preview box */}
        {inviteUrl && (
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 mb-6">
            <p className="text-xs text-muted-foreground/60 mb-1 font-medium">Link di invito</p>
            <p className="text-sm font-mono text-foreground/70 break-all leading-relaxed truncate">
              {inviteUrl}
            </p>
          </div>
        )}

        {/* Share options */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* WhatsApp */}
          <a
            href={buildWhatsAppUrl(fullShareText)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-background hover:bg-accent hover:border-foreground/20 active:scale-95 px-3 py-4 transition-all"
          >
            <div className="w-11 h-11 rounded-full bg-[#25D366]/10 flex items-center justify-center">
              {/* WhatsApp icon */}
              <svg className="w-6 h-6 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-center leading-tight">WhatsApp</span>
          </a>

          {/* SMS */}
          <a
            href={buildSmsUrl(fullShareText)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-background hover:bg-accent hover:border-foreground/20 active:scale-95 px-3 py-4 transition-all"
          >
            <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-center leading-tight">SMS</span>
          </a>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-background hover:bg-accent hover:border-foreground/20 active:scale-95 px-3 py-4 transition-all"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${copied ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-muted/50'}`}>
              {copied ? (
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <span className="text-xs font-medium text-center leading-tight">{copied ? 'Copiato!' : 'Copia link'}</span>
          </button>
        </div>

        <p className="text-xs text-muted-foreground/50 text-center mb-8 leading-relaxed">
          Chi riceve il link può unirsi al ricordo e aggiungere la sua versione.
        </p>

        <div className="mt-auto space-y-3">
          <button
            onClick={resetPick}
            className="w-full rounded-full border border-border py-3.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            + Invita un'altra persona
          </button>
          <button
            onClick={goToMemory}
            className="w-full rounded-full bg-foreground text-background py-3.5 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Vai al ricordo →
          </button>
        </div>
      </div>
    </main>
  )
}
