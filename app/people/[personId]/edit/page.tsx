'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getPersonById, updatePerson, type RelationshipType } from '@/actions/persons'
import { parseBirthDate, assembleBirthDate } from '@/lib/utils/anchors'
import { getUserGroups, type GroupSummary } from '@/actions/groups'
import { createClient } from '@/lib/supabase/client'
import { NicknameInput } from '@/components/people/NicknameInput'

// ── Constants ──────────────────────────────────────────────────────────────

const RELATIONSHIP_TYPES: { value: RelationshipType; label: string }[] = [
  { value: 'family',       label: 'Famiglia' },
  { value: 'partner',      label: 'Partner' },
  { value: 'child',        label: 'Figlio/a' },
  { value: 'parent',       label: 'Padre/Madre' },
  { value: 'sibling',      label: 'Fratello/Sorella' },
  { value: 'friend',       label: 'Amico/a' },
  { value: 'colleague',    label: 'Collega' },
  { value: 'acquaintance', label: 'Conoscente' },
  { value: 'other',        label: 'Altro' },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function initials(n: string) {
  const parts = n.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return n.slice(0, 2).toUpperCase()
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-5">
      {children}
    </p>
  )
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        {children}
      </label>
      {hint && (
        <span className="text-xs text-muted-foreground/40 normal-case tracking-normal font-normal">
          {hint}
        </span>
      )}
    </div>
  )
}

const inputCls =
  'w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring'

const textareaCls =
  'w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed'

// ── Page ───────────────────────────────────────────────────────────────────

export default function EditPersonPage() {
  const router = useRouter()
  const { personId } = useParams<{ personId: string }>()
  const fileRef = useRef<HTMLInputElement>(null)

  // Identity
  const [name, setName]           = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [nicknames, setNicknames] = useState<string[]>([])

  // Birthday
  const [birthDay,   setBirthDay]   = useState('')   // '01'–'31'
  const [birthMonth, setBirthMonth] = useState('')   // '01'–'12'
  const [birthYear,  setBirthYear]  = useState('')   // '1990' or ''

  // Avatar
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile]             = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview]       = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar]         = useState(false)

  // Relationship
  const [relationshipType, setRelationshipType] = useState<RelationshipType | null>(null)
  const [relationLabel, setRelationLabel]       = useState('')
  const [shortBio, setShortBio]                 = useState('')

  // Story
  const [howWeMet, setHowWeMet]           = useState('')
  const [sharedContext, setSharedContext] = useState('')

  // Groups
  const [groups, setGroups]                     = useState<GroupSummary[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])

  // UI
  const [fetching, setFetching]       = useState(true)
  const [error, setError]             = useState('')
  const [isPending, startTransition]  = useTransition()

  useEffect(() => {
    Promise.all([getPersonById(personId), getUserGroups()])
      .then(([p, g]) => {
        if (!p) { router.replace('/people'); return }
        setName(p.name)
        setFirstName(p.firstName ?? '')
        setLastName(p.lastName ?? '')
        setNicknames(p.nicknames)
        if (p.birthDate) {
          const { day, month, year } = parseBirthDate(p.birthDate)
          setBirthDay(day)
          setBirthMonth(month)
          setBirthYear(year)
        }
        setCurrentAvatarUrl(p.avatarUrl)
        setRelationshipType(p.relationshipType)
        setRelationLabel(p.relationLabel ?? '')
        setShortBio(p.shortBio ?? '')
        setHowWeMet(p.howWeMet ?? '')
        setSharedContext(p.sharedContext ?? '')
        setGroups(g)
        setSelectedGroupIds(p.groups.map((gr) => gr.id))
        setFetching(false)
      })
      .catch(() => router.replace('/people'))
  }, [personId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setRemoveAvatar(false)
  }

  function handleRemoveAvatar() {
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  function toggleRelationshipType(value: RelationshipType) {
    setRelationshipType((prev) => (prev === value ? null : value))
  }

  function toggleGroup(id: string) {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')

    startTransition(async () => {
      try {
        let newAvatarUrl: string | null | undefined = undefined

        if (removeAvatar) {
          newAvatarUrl = null
        } else if (avatarFile) {
          const supabase = createClient()
          const ext = avatarFile.name.split('.').pop() ?? 'jpg'
          const path = `people/${personId}/${Date.now()}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('memory-media')
            .upload(path, avatarFile, { upsert: true })

          if (uploadError) throw new Error('Caricamento immagine fallito. Riprova.')

          const { data: { publicUrl } } = supabase.storage
            .from('memory-media')
            .getPublicUrl(path)

          newAvatarUrl = publicUrl
        }

        const computedBirthDate = assembleBirthDate(birthDay, birthMonth, birthYear)

        await updatePerson(personId, {
          name,
          firstName:        firstName    || null,
          lastName:         lastName     || null,
          nicknames:        nicknames,
          avatarUrl:        newAvatarUrl,
          birthDate:        computedBirthDate,
          relationshipType: relationshipType,
          relationLabel:    relationLabel || null,
          shortBio:         shortBio     || null,
          howWeMet:         howWeMet     || null,
          sharedContext:    sharedContext || null,
          groupIds:         selectedGroupIds,
        })

        router.push(`/people/${personId}`)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore nel salvataggio.')
      }
    })
  }

  const displayedAvatar = avatarPreview ?? (removeAvatar ? null : currentAvatarUrl)

  if (fetching) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Caricamento…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-20">

        {/* Header */}
        <div className="pt-6 pb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
            Indietro
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Modifica persona</h1>
          <p className="text-sm text-muted-foreground mt-1">Visibile solo a te.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">

          {/* ── SECTION 1: IDENTITÀ ── */}
          <section className="space-y-5">
            <SectionHeader>Identità</SectionHeader>

            {/* Avatar */}
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-full bg-foreground flex items-center justify-center shrink-0 overflow-hidden relative group"
              >
                {displayedAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayedAvatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold tracking-tight text-background">
                    {name ? initials(name) : '?'}
                  </span>
                )}
                <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </button>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-sm font-medium text-foreground hover:opacity-70 transition-opacity text-left"
                >
                  {displayedAvatar ? 'Cambia foto' : 'Aggiungi foto'}
                </button>
                {displayedAvatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-sm text-muted-foreground hover:text-rose-500 transition-colors text-left"
                  >
                    Rimuovi
                  </button>
                )}
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />

            {/* Display name */}
            <div>
              <FieldLabel hint="*">Come lo chiami</FieldLabel>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Il nome con cui lo conosci"
                className={inputCls}
              />
            </div>

            {/* First + Last name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel hint="facoltativo">Nome</FieldLabel>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Marco"
                  className={inputCls}
                />
              </div>
              <div>
                <FieldLabel hint="facoltativo">Cognome</FieldLabel>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Rossi"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Nicknames */}
            <div>
              <FieldLabel hint="facoltativo">Soprannomi</FieldLabel>
              <NicknameInput
                value={nicknames}
                onChange={setNicknames}
                placeholder="Marko, il Prof, Gio…"
              />
            </div>

            {/* Birthday */}
            <div className="space-y-2">
              <FieldLabel hint="facoltativo">Compleanno</FieldLabel>
              <div className="flex gap-2 items-center">
                <select
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value)}
                  className="w-[4.5rem] rounded-2xl border border-input bg-background px-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">G</option>
                  {Array.from({ length: 31 }, (_, i) => {
                    const d = String(i + 1).padStart(2, '0')
                    return <option key={d} value={d}>{i + 1}</option>
                  })}
                </select>
                <select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value)}
                  className="flex-1 rounded-2xl border border-input bg-background px-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Mese</option>
                  {['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                    'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'].map((m, i) => (
                    <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="Anno"
                  min={1900}
                  max={2030}
                  className="w-20 rounded-2xl border border-input bg-background px-3 py-3 text-sm text-muted-foreground/70 placeholder:text-muted-foreground/35 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {(birthDay && birthMonth) && (
                <button
                  type="button"
                  onClick={() => { setBirthDay(''); setBirthMonth(''); setBirthYear('') }}
                  className="text-xs text-muted-foreground/35 hover:text-muted-foreground/60 transition-colors"
                >
                  Rimuovi data
                </button>
              )}
            </div>
          </section>

          {/* ── SECTION 2: RELAZIONE ── */}
          <section className="space-y-5">
            <SectionHeader>Che ruolo ha nella tua vita?</SectionHeader>

            {/* Relationship type chips */}
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIP_TYPES.map(({ value, label }) => {
                const active = relationshipType === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleRelationshipType(value)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                      active
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Free-text label */}
            <div>
              <FieldLabel hint="facoltativo">In parole tue</FieldLabel>
              <input
                type="text"
                value={relationLabel}
                onChange={(e) => setRelationLabel(e.target.value)}
                placeholder="Es. migliore amico, mentore, collega stretto…"
                className={inputCls}
              />
            </div>

            {/* Short bio */}
            <div>
              <FieldLabel hint="facoltativo">Una riga su di lei/lui</FieldLabel>
              <textarea
                value={shortBio}
                onChange={(e) => setShortBio(e.target.value)}
                placeholder="Una riga su chi è questa persona per te"
                rows={2}
                className={textareaCls}
              />
            </div>
          </section>

          {/* ── SECTION 3: STORIA ── */}
          <section className="space-y-5">
            <SectionHeader>La vostra storia</SectionHeader>

            <div>
              <FieldLabel hint="facoltativo">Come vi siete conosciuti</FieldLabel>
              <textarea
                value={howWeMet}
                onChange={(e) => setHowWeMet(e.target.value)}
                placeholder="All'università, in palestra, a un evento…"
                rows={2}
                className={textareaCls}
              />
            </div>

            <div>
              <FieldLabel hint="facoltativo">Cosa vi unisce</FieldLabel>
              <textarea
                value={sharedContext}
                onChange={(e) => setSharedContext(e.target.value)}
                placeholder="Cosa vi unisce — un posto, un progetto, una fase di vita…"
                rows={2}
                className={textareaCls}
              />
            </div>

            {/* Groups */}
            {groups.length > 0 && (
              <div>
                <FieldLabel hint="facoltativo">Gruppi in comune</FieldLabel>
                <div className="flex flex-wrap gap-2 mt-0.5">
                  {groups.map((g) => {
                    const active = selectedGroupIds.includes(g.id)
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGroup(g.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          active
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                        }`}
                      >
                        {g.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          {error && (
            <p className="text-sm text-rose-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={!name.trim() || isPending}
            className="w-full rounded-full bg-foreground text-background py-4 text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30"
          >
            {isPending ? 'Salvataggio…' : 'Salva'}
          </button>

        </form>
      </div>
    </main>
  )
}
