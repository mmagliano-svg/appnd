# CLAUDE.md — Appnd MVP

## Cos'è Appnd
Appnd è una piattaforma di memoria relazionale. Permette alle persone di registrare momenti vissuti insieme, co-costruirli con i partecipanti, e navigarli come storia di una relazione nel tempo.

Tagline: Appnd is where shared moments become shared memories.

Insight fondamentale: il ricordo non appartiene a una persona — appartiene a chi lo ha vissuto insieme.

---

## Obiettivo dell'MVP
Testare una sola ipotesi: le persone creano e co-costruiscono ricordi con qualcun altro in modo continuativo?

L'MVP deve essere funzionante, non completo. Ogni feature che non serve a validare questa ipotesi va rimossa o posticipata.

---

## Stack tecnico
- Frontend: Next.js 14 (App Router)
- Styling: Tailwind CSS + shadcn/ui
- Backend: Next.js API Routes / Server Actions
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth (magic link + email)
- Storage media: Supabase Storage
- Deployment: Vercel
- AI (Fase 2): Anthropic Claude API — da aggiungere dopo validazione

Lingua del codice: inglese (variabili, commenti, funzioni)
Lingua UI: italiano (MVP per mercato italiano)

---

## Architettura dati (schema Supabase)

### users
id (uuid, PK), email, display_name, avatar_url, created_at

### memories
id (uuid, PK), title (text), description (text, nullable), happened_at (date), location_name (text, nullable), created_by (uuid, FK → users), created_at (timestamp), updated_at (timestamp)

### memory_participants
id (uuid, PK), memory_id (uuid, FK → memories), user_id (uuid, FK → users, nullable), invited_email (text, nullable), invite_token (text, unique), joined_at (timestamp, nullable)

### memory_contributions
id (uuid, PK), memory_id (uuid, FK → memories), author_id (uuid, FK → users), content_type (enum: text | photo | note), text_content (text, nullable), media_url (text, nullable), caption (text, nullable), created_at (timestamp)

### memory_media
id (uuid, PK), memory_id (uuid, FK → memories), contribution_id (uuid, FK → memory_contributions, nullable), uploaded_by (uuid, FK → users), storage_path (text), media_type (enum: image | video), created_at (timestamp)

---

## Feature IN scope per MVP

### Auth
- Registrazione e login via magic link (email)
- Profilo utente base (nome, avatar)

### Crea un ricordo
- Titolo, data, luogo (testo libero), descrizione
- Upload foto (max 10 per ricordo)

### Invita un partecipante
- Input email → generazione invite token → email con link magico
- L'invitato può accedere anche senza account preesistente
- Accettazione invito → join al ricordo

### Co-costruzione del ricordo
- Ogni partecipante può aggiungere testo, foto, note
- Tutte le contribuzioni visibili a tutti i partecipanti
- Ordine cronologico

### Vista "NOI"
- Lista ricordi condivisi tra me e una persona specifica
- Ordinati per happened_at, con anteprima foto + titolo

### Dashboard personale
- Lista ricordi a cui partecipo
- Badge se ci sono nuove contribuzioni da leggere

---

## Feature FUORI scope per MVP
- AI (titoli automatici, recap, tagging) — Fase 2
- Memory Graph — Fase 3
- Spazi gruppo / viaggi / team — Fase 2
- Feed o dimensione social
- Esportazione PDF/libro — Fase 3
- Notifiche push — usare email per ora
- App mobile — web mobile-first è sufficiente
- Cancellazione / archiviazione ricordi

---

## Principi di design
- Mobile-first: layout progettato prima per smartphone
- Semplicità emotiva: UI intima, non tecnica. Font puliti, spazio bianco, foto in primo piano
- Velocità di input: creare un ricordo in meno di 60 secondi
- Nessun feed pubblico: tutto privato per default

---

## Flusso utente principale
1. Mattia crea un ricordo ("Cena al Baffo, 15 marzo 2026")
2. Aggiunge foto e descrizione
3. Invita Luca via email
4. Luca riceve il link → accede → crea account → vede il ricordo
5. Luca aggiunge la sua foto e la sua versione
6. Entrambi vedono il ricordo completo con entrambe le prospettive
7. "Vista NOI" mostra nel tempo tutti i momenti condivisi con Luca

---

## Struttura del progetto Next.js

/app
  /auth/login
  /auth/callback
  /dashboard
  /memories/new
  /memories/[id]
  /memories/[id]/contribute
  /people/[userId]
  /invite/[token]
/components
  /memory — MemoryCard, MemoryForm, ContributionList, ContributionForm, MediaUploader
  /people — RelationshipView
  /ui — shadcn components
/lib
  /supabase — client.ts, server.ts, types.ts
  /utils — invite.ts
/actions — memories.ts, contributions.ts, invites.ts

---

## Convenzioni di codice
- TypeScript ovunque, no any
- Tipi generati da Supabase (supabase gen types)
- Server Actions per mutazioni
- use client solo dove strettamente necessario
- Naming: componenti PascalCase, funzioni camelCase, file kebab-case
- Errori gestiti esplicitamente, no silent failures
- Niente console.log in produzione

---

## Variabili d'ambiente
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=

---

## Priorità di sviluppo (ordine)
1. Setup progetto (Next.js + Supabase + deploy Vercel)
2. Auth (magic link, callback, sessione)
3. Crea ricordo (form base, salvataggio DB)
4. Upload foto (Supabase Storage)
5. Sistema inviti (token, email, accettazione)
6. Vista ricordo condiviso (contribuzioni multiple)
7. Aggiungi contributo (testo + foto)
8. Dashboard personale (lista ricordi)
9. Vista NOI (ricordi con una persona)
10. Polish UI (mobile, animazioni, empty states)

---

## Note per Claude Code
- Costruisci una funzionalità alla volta, nell'ordine indicato
- Testa ogni step con dati reali prima di passare al successivo
- Se una feature non è in scope MVP, non implementarla — segnalala come Fase 2
- Usa migrations Supabase per ogni modifica al DB
- RLS (Row Level Security) attivata fin dall'inizio — requisito di sicurezza
- Gli utenti vedono solo i ricordi a cui partecipano
