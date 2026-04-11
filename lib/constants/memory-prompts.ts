/**
 * Memory Prompt Library — Taxonomy V1
 *
 * Each prompt is typed as one of three structural entities:
 *
 *   - moment   : a single specific event (first concert, day X, one trip)
 *                → routes to /memories/new
 *   - period   : a phase of life with duration (a relationship, a job,
 *                a school year, a house you lived in)
 *                → routes to /periods/new
 *   - cluster  : a recurring/thematic collection of moments sharing
 *                one anchor (a city visited many times, all weddings)
 *                → routes to /clusters/new
 *
 * Every prompt must:
 *   1. Evoke a visual scene (starts with Dove / Quando / In che…)
 *   2. Imply WHEN (time anchor)
 *   3. Imply WHERE (place anchor)
 *   4. Optionally imply WHO (people)
 *
 * Prompts are NOT final titles. Moment prompts carry an `example`
 * field — a short realistic title shown as "es. ..." on the
 * /memories/new page so the user has a concrete reference of what
 * a good title looks like.
 */

export type PromptType = 'moment' | 'period' | 'cluster'

export type MemoryPromptCategory =
  | 'relationships'
  | 'home'
  | 'travel'
  | 'work'
  | 'sports'
  | 'events'
  | 'family'
  | 'friends'

export interface Prompt {
  id: string
  text: string
  type: PromptType
  category: MemoryPromptCategory
  /** Short realistic title example, shown as "es. {example}" on the creation page. */
  example?: string
}

export const PROMPTS: Prompt[] = [
  // ── Relationships ─────────────────────────────────────────────────────────
  { id: 'rel-first-sight',       type: 'moment', category: 'relationships', text: 'Dove hai visto per la prima volta la persona che poi è diventata importante per te?', example: 'Festa di Marco, inverno 2014' },
  { id: 'rel-longest-start',     type: 'period', category: 'relationships', text: 'Dove vi siete conosciuti quando è iniziata la tua relazione più lunga?' },
  { id: 'rel-first-date',        type: 'moment', category: 'relationships', text: 'Dove sei andato al tuo primo appuntamento vero? Chi era con te?', example: 'Primo aperitivo con Anna a Trastevere' },
  { id: 'rel-first-summer',      type: 'period', category: 'relationships', text: 'Dove avete passato la prima estate insieme? Che anno era?' },
  { id: 'rel-meeting-parents',   type: 'moment', category: 'relationships', text: 'Dove siete andati quando hai presentato qualcuno ai tuoi per la prima volta?', example: 'Pranzo di Pasqua a casa dei miei' },
  { id: 'rel-first-shared-home', type: 'period', category: 'relationships', text: 'In che città era la prima casa che hai condiviso con qualcuno?' },
  { id: 'rel-love-moment',       type: 'moment', category: 'relationships', text: 'Dove eri il giorno in cui hai capito di essere innamorato? Con chi?', example: 'Sera di luglio a Ortigia' },

  // ── Home / Places ─────────────────────────────────────────────────────────
  { id: 'home-all-houses',       type: 'cluster', category: 'home', text: 'Ti ricordi tutte le case in cui hai vissuto?' },
  { id: 'home-first-own',        type: 'period',  category: 'home', text: 'In che città era la prima casa che hai chiamato “casa tua”? Con chi ci vivevi?' },
  { id: 'home-childhood-room',   type: 'period',  category: 'home', text: 'In che città vivevi quando avevi la tua prima stanza da bambino?' },
  { id: 'home-big-move',         type: 'moment',  category: 'home', text: 'Da dove a dove è stato il trasloco più importante della tua vita?', example: 'Trasloco da Roma a Milano, 2019' },
  { id: 'home-return-spot',      type: 'cluster', category: 'home', text: 'C’è un posto in cui tornavi sempre da bambino?' },
  { id: 'home-first-away',       type: 'period',  category: 'home', text: 'In che città era la prima casa che hai avuto lontano dalla famiglia?' },
  { id: 'home-childhood-block',  type: 'period',  category: 'home', text: 'In che quartiere giocavi da piccolo? Con chi eri sempre insieme?' },
  { id: 'home-last-real',        type: 'period',  category: 'home', text: 'Dove era l’ultima casa in cui hai vissuto a lungo?' },

  // ── Travel ────────────────────────────────────────────────────────────────
  { id: 'travel-first-alone',    type: 'moment',  category: 'travel', text: 'Dove sei andato nel tuo primo viaggio da solo? Che anno era?', example: 'Weekend a Barcellona, 22 anni' },
  { id: 'travel-first-sea',      type: 'moment',  category: 'travel', text: 'Dove sei andato la prima volta che hai visto il mare? Con chi eri?', example: 'Primo giorno al mare a Sabaudia con nonna' },
  { id: 'travel-same-city',      type: 'cluster', category: 'travel', text: 'C’è una città in cui sei tornato più volte nella vita?' },
  { id: 'travel-train-trip',     type: 'moment',  category: 'travel', text: 'Un viaggio in treno che ricordi ancora — dove stavi andando?', example: 'Treno notturno Roma-Parigi' },
  { id: 'travel-first-flight',   type: 'moment',  category: 'travel', text: 'La prima volta che hai preso un aereo — dove stavi andando?', example: 'Primo volo Roma-Londra' },
  { id: 'travel-one-night',      type: 'moment',  category: 'travel', text: 'Un posto dove sei stato solo una notte, ma te lo ricordi ancora?', example: 'Notte da solo a Berlino' },
  { id: 'travel-longest',        type: 'moment',  category: 'travel', text: 'Il viaggio più lungo che hai fatto — dove sei andato e con chi?', example: 'Due settimane in Giappone con Luca' },

  // ── Work / School ─────────────────────────────────────────────────────────
  { id: 'work-first-day',        type: 'moment',  category: 'work', text: 'Dove eri il tuo primo giorno di lavoro? Con chi?', example: 'Primo giorno in via Torino' },
  { id: 'work-longest-job',      type: 'period',  category: 'work', text: 'Dove lavoravi nel posto in cui sei rimasto più a lungo? Per quanti anni?' },
  { id: 'work-first-salary',     type: 'moment',  category: 'work', text: 'Dove eri quando hai ricevuto il tuo primo stipendio? Cosa hai fatto quel giorno?', example: 'Primo stipendio al bar del corso' },
  { id: 'work-best-school',      type: 'period',  category: 'work', text: 'In che città era la scuola in cui hai passato più anni?' },
  { id: 'work-deskmate',         type: 'period',  category: 'work', text: 'In che scuola eri quando avevi quel compagno di banco? Come si chiamava?' },
  { id: 'work-first-boss',       type: 'period',  category: 'work', text: 'Dove lavoravate quando avevi il tuo primo capo? Che lavoro facevate?' },
  { id: 'work-job-switch',       type: 'moment',  category: 'work', text: 'Dove eri il giorno in cui hai cambiato lavoro? Da dove venivi e dove stavi andando?', example: 'Ultimo giorno alla Standa' },
  { id: 'work-last-school-day',  type: 'moment',  category: 'work', text: 'In che scuola eri l’ultimo giorno? Con chi hai festeggiato?', example: 'Ultimo giorno al Liceo Mamiani' },
  { id: 'work-all-jobs',         type: 'cluster', category: 'work', text: 'Ti ricordi tutti i lavori che hai fatto nella tua vita?' },

  // ── Sports / Activities ───────────────────────────────────────────────────
  { id: 'sport-first',           type: 'period',  category: 'sports', text: 'Dove ti allenavi quando hai iniziato il primo sport?' },
  { id: 'sport-match',           type: 'moment',  category: 'sports', text: 'Dove si giocava la partita che ricordi ancora? Chi c’era con te?', example: 'Finale al campo di via Montevideo' },
  { id: 'sport-first-coach',     type: 'period',  category: 'sports', text: 'In che squadra eri quando hai avuto il tuo primo allenatore?' },
  { id: 'sport-missed',          type: 'period',  category: 'sports', text: 'Dove lo praticavi uno sport che poi hai lasciato?' },
  { id: 'sport-first-win',       type: 'moment',  category: 'sports', text: 'Dove eri la prima volta che hai vinto qualcosa? Cosa hai vinto?', example: 'Torneo di nuoto, 11 anni' },
  { id: 'sport-mentor',          type: 'period',  category: 'sports', text: 'Dove vi allenavate quando qualcuno ti ha insegnato il primo sport?' },

  // ── Events ────────────────────────────────────────────────────────────────
  { id: 'event-all-weddings',    type: 'cluster', category: 'events', text: 'A quanti matrimoni sei stato nella tua vita?' },
  { id: 'event-first-concert',   type: 'moment',  category: 'events', text: 'Dove sei andato al tuo primo concerto? Di chi era?', example: 'Coldplay al Forum, giugno 2010' },
  { id: 'event-longest-party',   type: 'moment',  category: 'events', text: 'Dove eravate alla festa più lunga della tua vita? Di chi era?', example: '18 anni di Giulia in campagna' },
  { id: 'event-best-wedding',    type: 'moment',  category: 'events', text: 'Dove si è tenuto un matrimonio che ricordi ancora? Di chi?', example: 'Matrimonio di Marta in Puglia' },
  { id: 'event-memorable-bday',  type: 'moment',  category: 'events', text: 'Dove si festeggiava un compleanno che non hai più dimenticato? Di chi era?', example: '18 anni di Luca al Tropicana' },
  { id: 'event-strange-nye',     type: 'moment',  category: 'events', text: 'Dove eri il capodanno più strano che hai passato? Con chi?', example: 'Capodanno 2018 a Reykjavik' },
  { id: 'event-reunion',         type: 'moment',  category: 'events', text: 'Dove hai rivisto qualcuno dopo anni? Che evento era?', example: 'Rimpatriata del liceo, 10 anni dopo' },
  { id: 'event-all-concerts',    type: 'cluster', category: 'events', text: 'Ti ricordi i concerti importanti che hai visto?' },

  // ── Family ────────────────────────────────────────────────────────────────
  { id: 'family-sunday-lunch',   type: 'cluster', category: 'family', text: 'I pranzi della domenica da bambino — chi c’era sempre?' },
  { id: 'family-first-xmas',     type: 'moment',  category: 'family', text: 'Dove eri il primo Natale che ricordi davvero? Chi c’era con te?', example: 'Natale 1995 a casa dei nonni' },
  { id: 'family-car-trip',       type: 'moment',  category: 'family', text: 'Dove stavate andando in un viaggio in macchina con la famiglia?', example: 'Gita al lago di Bracciano' },
  { id: 'family-with-dad',       type: 'moment',  category: 'family', text: 'Un giorno passato da solo con tuo padre — dove siete andati?', example: 'Allo stadio con papà, prima volta' },
  { id: 'family-with-mom',       type: 'moment',  category: 'family', text: 'Un giorno passato da solo con tua madre — dove eravate?', example: 'Spesa al mercato di Testaccio' },
  { id: 'family-new-life',       type: 'moment',  category: 'family', text: 'Dove eri il giorno in cui è nato qualcuno di importante per te?', example: 'Nascita di Giulia, ospedale San Camillo' },
  { id: 'family-bday',           type: 'moment',  category: 'family', text: 'Dove si festeggiava un compleanno di famiglia che non dimentichi?', example: '70 anni di nonna, pranzo in trattoria' },

  // ── Friends / Social Life ─────────────────────────────────────────────────
  { id: 'friends-first',         type: 'period',  category: 'friends', text: 'Il primo amico della tua vita — dove vi siete conosciuti?' },
  { id: 'friends-night',         type: 'moment',  category: 'friends', text: 'Dove eravate la notte con gli amici che è diventata un ricordo?', example: 'Notte in spiaggia a Formentera' },
  { id: 'friends-social-summer', type: 'period',  category: 'friends', text: 'Dove eri l’estate in cui hai conosciuto più persone nuove?' },
  { id: 'friends-reunion',       type: 'moment',  category: 'friends', text: 'Dove hai rivisto l’ultima volta un amico d’infanzia?', example: 'Caffè con Marco dopo 12 anni' },
  { id: 'friends-lost-group',    type: 'period',  category: 'friends', text: 'Dove vi incontravate quando uscivi sempre con quel gruppo di amici?' },
  { id: 'friends-first-allnight',type: 'moment',  category: 'friends', text: 'Dove sei rimasto la prima volta che hai passato tutta la notte fuori?', example: 'Prima serata fuori con Luca, 16 anni' },
]

/**
 * Look up a prompt by id. Returns null if not found.
 * Used by /memories/new to read the example + full prompt on navigation.
 */
export function getPromptById(id: string | null | undefined): Prompt | null {
  if (!id) return null
  return PROMPTS.find((p) => p.id === id) ?? null
}

/**
 * Pick a prompt avoiding recently shown ones.
 * Pure function — the component manages the localStorage window.
 */
export function pickPromptFromPool(recentIds: string[]): Prompt {
  const pool = PROMPTS.filter((p) => !recentIds.includes(p.id))
  const source = pool.length > 0 ? pool : PROMPTS
  return source[Math.floor(Math.random() * source.length)] ?? PROMPTS[0]
}

/**
 * Build the destination URL for a prompt based on its type.
 * Handles URL-encoding of the prompt text.
 */
export function getPromptHref(prompt: Prompt): string {
  const encoded = encodeURIComponent(prompt.text)
  const idParam = `&promptId=${prompt.id}`
  switch (prompt.type) {
    case 'moment':
      return `/memories/new?prompt=${encoded}&source=prompt${idParam}`
    case 'period':
      return `/periods/new?prompt=${encoded}${idParam}`
    case 'cluster':
      return `/clusters/new?prompt=${encoded}${idParam}`
  }
}
