'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { claimPerson } from '@/actions/persons'

interface ClaimPersonButtonProps {
  personId: string
  personName: string
  /** Whether the person record has at least one nickname stored */
  hasNicknames: boolean
  /** Whether the person record has a full birth date with year (YYYY-MM-DD) */
  hasBirthYear: boolean
}

type Step = 'idle' | 'verify' | 'success'

export function ClaimPersonButton({
  personId,
  personName,
  hasNicknames,
  hasBirthYear,
}: ClaimPersonButtonProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('idle')
  const [nickname, setNickname] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const hasVerifiableData = hasNicknames || hasBirthYear

  // ── Soft label — no interactive claim possible ─────────────────────────

  if (!hasVerifiableData) {
    return (
      <p className="text-xs text-muted-foreground/35 mt-4 italic">
        Profilo non ancora verificabile
      </p>
    )
  }

  // ── CTA + modal — verification data is available ───────────────────────

  function openModal() {
    setStep('verify')
    setError('')
    setNickname('')
    setBirthYear('')
  }

  function closeModal() {
    if (isPending) return
    setStep('idle')
    setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await claimPerson(personId, {
        nickname: nickname.trim() || undefined,
        birthYear: birthYear.trim() || undefined,
      })
      if (result.success) {
        setStep('success')
        router.refresh()
      } else {
        setError(result.error ?? 'Qualcosa è andato storto. Riprova.')
      }
    })
  }

  return (
    <>
      {/* ── Visible CTA ── */}
      <button
        type="button"
        onClick={openModal}
        className="mt-5 flex items-center gap-2.5 rounded-2xl border border-border/60 bg-muted/40 hover:bg-muted/70 hover:border-foreground/20 px-5 py-3 text-sm font-medium transition-all active:scale-[0.98]"
      >
        <span className="text-base leading-none shrink-0">👤</span>
        <span>Questa persona potresti essere tu</span>
        <svg
          className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto shrink-0"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* ── Modal backdrop ── */}
      {step !== 'idle' && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-background border border-border/60 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {step === 'success' ? (
              /* ── Success state ── */
              <div className="px-6 py-10 text-center">
                <p className="text-4xl mb-4">✓</p>
                <h2 className="text-lg font-bold mb-1">Profilo collegato</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Ora puoi vedere tutti i ricordi in cui sei presente.
                </p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full rounded-full bg-foreground text-background py-3 text-sm font-semibold"
                >
                  Continua
                </button>
              </div>
            ) : (
              /* ── Verification form ── */
              <form onSubmit={handleSubmit}>
                <div className="px-6 pt-7 pb-2">
                  <h2 className="text-lg font-bold mb-1">Sei {personName}?</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Rispondi alle domande per collegare il tuo account a questo profilo.
                  </p>
                </div>

                <div className="px-6 py-5 space-y-5">

                  {/* Question 1 — name / nickname */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                      {hasNicknames ? 'Il tuo soprannome' : 'Come ti chiami?'}
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder={hasNicknames ? 'Es. Marco, Marchino…' : `Es. ${personName}`}
                      autoComplete="off"
                      autoFocus
                      className="w-full bg-muted rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
                    />
                  </div>

                  {/* Question 2 — birth year, only when stored */}
                  {hasBirthYear && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                        Anno di nascita
                      </label>
                      <input
                        type="number"
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value)}
                        placeholder="Es. 1995"
                        min="1900"
                        max={new Date().getFullYear()}
                        className="w-full bg-muted rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
                      />
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <p className="text-sm text-destructive leading-snug">{error}</p>
                  )}
                </div>

                <div className="px-6 pb-7 flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isPending}
                    className="flex-1 rounded-full border border-border py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 rounded-full bg-foreground text-background py-3 text-sm font-semibold active:scale-[0.98] transition-all disabled:opacity-40"
                  >
                    {isPending ? 'Verifica…' : 'Sono io'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
