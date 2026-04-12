/**
 * Prompt System V1 — Structured Library
 *
 * Every prompt from the old flat array is now a full PromptEntity with
 * typed targets, emotional weight, and frequency. The library is the
 * single source of truth for all prompt data in the app.
 *
 * Callers should NOT import this directly — use the engine
 * (prompt-engine.ts) for selection, and getPromptEntityById for lookups.
 */

import type { PromptEntity } from './prompt-types'

// Helper to reduce repetition — most prompts target time + place.
const TP: PromptEntity['targets'] = { time: true, place: true }
const TPP: PromptEntity['targets'] = { time: true, place: true, people: true }

export const PROMPT_LIBRARY: PromptEntity[] = [
  // ── Relationships ─────────────────────────────────────────────────────────
  { id: 'rel-first-sight',       kind: 'moment', category: 'relationships', text: 'Dove hai visto per la prima volta la persona che poi è diventata importante per te?', example: 'Festa di Marco, inverno 2014', targets: TPP, emotionalWeight: 5 },
  { id: 'rel-longest-start',     kind: 'period', category: 'relationships', text: 'Dove vi siete conosciuti quando è iniziata la tua relazione più lunga?', targets: TPP, emotionalWeight: 5 },
  { id: 'rel-first-date',        kind: 'moment', category: 'relationships', text: 'Dove sei andato al tuo primo appuntamento vero? Chi era con te?', example: 'Primo aperitivo con Anna a Trastevere', targets: TPP, emotionalWeight: 4 },
  { id: 'rel-first-summer',      kind: 'period', category: 'relationships', text: 'Dove avete passato la prima estate insieme? Che anno era?', targets: TPP, emotionalWeight: 4 },
  { id: 'rel-meeting-parents',   kind: 'moment', category: 'relationships', text: 'Dove siete andati quando hai presentato qualcuno ai tuoi per la prima volta?', example: 'Pranzo di Pasqua a casa dei miei', targets: TPP, emotionalWeight: 4 },
  { id: 'rel-first-shared-home', kind: 'period', category: 'relationships', text: 'In che città era la prima casa che hai condiviso con qualcuno?', targets: TP, emotionalWeight: 5 },
  { id: 'rel-love-moment',       kind: 'moment', category: 'relationships', text: 'Dove eri il giorno in cui hai capito di essere innamorato? Con chi?', example: 'Sera di luglio a Ortigia', targets: TPP, emotionalWeight: 5 },

  // ── Home / Places ─────────────────────────────────────────────────────────
  { id: 'home-all-houses',       kind: 'cluster', category: 'home', text: 'Ti ricordi tutte le case in cui hai vissuto?', targets: { place: true }, emotionalWeight: 4 },
  { id: 'home-first-own',        kind: 'period',  category: 'home', text: 'In che città era la prima casa che hai chiamato "casa tua"? Con chi ci vivevi?', targets: TPP, emotionalWeight: 5 },
  { id: 'home-childhood-room',   kind: 'period',  category: 'home', text: 'In che città vivevi quando avevi la tua prima stanza da bambino?', targets: TP, emotionalWeight: 4 },
  { id: 'home-big-move',         kind: 'moment',  category: 'home', text: 'Da dove a dove è stato il trasloco più importante della tua vita?', example: 'Trasloco da Roma a Milano, 2019', targets: TP, emotionalWeight: 5 },
  { id: 'home-return-spot',      kind: 'cluster', category: 'home', text: "C'è un posto in cui tornavi sempre da bambino?", targets: { place: true }, emotionalWeight: 3 },
  { id: 'home-first-away',       kind: 'period',  category: 'home', text: 'In che città era la prima casa che hai avuto lontano dalla famiglia?', targets: TP, emotionalWeight: 4 },
  { id: 'home-childhood-block',  kind: 'period',  category: 'home', text: 'In che quartiere giocavi da piccolo? Con chi eri sempre insieme?', targets: TPP, emotionalWeight: 3 },
  { id: 'home-last-real',        kind: 'period',  category: 'home', text: "Dove era l'ultima casa in cui hai vissuto a lungo?", targets: TP, emotionalWeight: 3 },

  // ── Travel ────────────────────────────────────────────────────────────────
  { id: 'travel-first-alone',    kind: 'moment',  category: 'travel', text: 'Dove sei andato nel tuo primo viaggio da solo? Che anno era?', example: 'Weekend a Barcellona, 22 anni', targets: TP, emotionalWeight: 5 },
  { id: 'travel-first-sea',      kind: 'moment',  category: 'travel', text: 'Dove sei andato la prima volta che hai visto il mare? Con chi eri?', example: 'Primo giorno al mare a Sabaudia con nonna', targets: TPP, emotionalWeight: 4 },
  { id: 'travel-same-city',      kind: 'cluster', category: 'travel', text: "C'è una città in cui sei tornato più volte nella vita?", targets: { place: true }, emotionalWeight: 3 },
  { id: 'travel-train-trip',     kind: 'moment',  category: 'travel', text: 'Un viaggio in treno che ricordi ancora — dove stavi andando?', example: 'Treno notturno Roma-Parigi', targets: TP, emotionalWeight: 3 },
  { id: 'travel-first-flight',   kind: 'moment',  category: 'travel', text: 'La prima volta che hai preso un aereo — dove stavi andando?', example: 'Primo volo Roma-Londra', targets: TP, emotionalWeight: 4 },
  { id: 'travel-one-night',      kind: 'moment',  category: 'travel', text: 'Un posto dove sei stato solo una notte, ma te lo ricordi ancora?', example: 'Notte da solo a Berlino', targets: TP, emotionalWeight: 3, frequency: 'rare' },
  { id: 'travel-longest',        kind: 'moment',  category: 'travel', text: 'Il viaggio più lungo che hai fatto — dove sei andato e con chi?', example: 'Due settimane in Giappone con Luca', targets: TPP, emotionalWeight: 4 },

  // ── Work / School ─────────────────────────────────────────────────────────
  { id: 'work-first-day',        kind: 'moment',  category: 'work', text: 'Dove eri il tuo primo giorno di lavoro? Con chi?', example: 'Primo giorno in via Torino', targets: TPP, emotionalWeight: 5 },
  { id: 'work-longest-job',      kind: 'period',  category: 'work', text: 'Dove lavoravi nel posto in cui sei rimasto più a lungo? Per quanti anni?', targets: TP, emotionalWeight: 4 },
  { id: 'work-first-salary',     kind: 'moment',  category: 'work', text: 'Dove eri quando hai ricevuto il tuo primo stipendio? Cosa hai fatto quel giorno?', example: 'Primo stipendio al bar del corso', targets: TP, emotionalWeight: 4 },
  { id: 'work-best-school',      kind: 'period',  category: 'work', text: 'In che città era la scuola in cui hai passato più anni?', targets: TP, emotionalWeight: 3 },
  { id: 'work-deskmate',         kind: 'period',  category: 'work', text: 'In che scuola eri quando avevi quel compagno di banco? Come si chiamava?', targets: TPP, emotionalWeight: 3 },
  { id: 'work-first-boss',       kind: 'period',  category: 'work', text: 'Dove lavoravate quando avevi il tuo primo capo? Che lavoro facevate?', targets: TPP, emotionalWeight: 3 },
  { id: 'work-job-switch',       kind: 'moment',  category: 'work', text: 'Dove eri il giorno in cui hai cambiato lavoro? Da dove venivi e dove stavi andando?', example: 'Ultimo giorno alla Standa', targets: TP, emotionalWeight: 4 },
  { id: 'work-last-school-day',  kind: 'moment',  category: 'work', text: "In che scuola eri l'ultimo giorno? Con chi hai festeggiato?", example: 'Ultimo giorno al Liceo Mamiani', targets: TPP, emotionalWeight: 4 },
  { id: 'work-all-jobs',         kind: 'cluster', category: 'work', text: 'Ti ricordi tutti i lavori che hai fatto nella tua vita?', targets: { time: true, theme: true }, emotionalWeight: 3 },

  // ── Sports / Activities ───────────────────────────────────────────────────
  { id: 'sport-first',           kind: 'period',  category: 'sports', text: 'Dove ti allenavi quando hai iniziato il primo sport?', targets: TP, emotionalWeight: 3 },
  { id: 'sport-match',           kind: 'moment',  category: 'sports', text: "Dove si giocava la partita che ricordi ancora? Chi c'era con te?", example: 'Finale al campo di via Montevideo', targets: TPP, emotionalWeight: 3 },
  { id: 'sport-first-coach',     kind: 'period',  category: 'sports', text: 'In che squadra eri quando hai avuto il tuo primo allenatore?', targets: TPP, emotionalWeight: 3 },
  { id: 'sport-missed',          kind: 'period',  category: 'sports', text: 'Dove lo praticavi uno sport che poi hai lasciato?', targets: TP, emotionalWeight: 3, frequency: 'rare' },
  { id: 'sport-first-win',       kind: 'moment',  category: 'sports', text: 'Dove eri la prima volta che hai vinto qualcosa? Cosa hai vinto?', example: 'Torneo di nuoto, 11 anni', targets: TP, emotionalWeight: 4 },
  { id: 'sport-mentor',          kind: 'period',  category: 'sports', text: 'Dove vi allenavate quando qualcuno ti ha insegnato il primo sport?', targets: TPP, emotionalWeight: 3 },

  // ── Events ────────────────────────────────────────────────────────────────
  { id: 'event-all-weddings',    kind: 'cluster', category: 'events', text: 'A quanti matrimoni sei stato nella tua vita?', targets: { time: true, place: true, people: true, theme: true }, emotionalWeight: 4 },
  { id: 'event-first-concert',   kind: 'moment',  category: 'events', text: 'Dove sei andato al tuo primo concerto? Di chi era?', example: 'Coldplay al Forum, giugno 2010', targets: TP, emotionalWeight: 4 },
  { id: 'event-longest-party',   kind: 'moment',  category: 'events', text: 'Dove eravate alla festa più lunga della tua vita? Di chi era?', example: '18 anni di Giulia in campagna', targets: TPP, emotionalWeight: 3 },
  { id: 'event-best-wedding',    kind: 'moment',  category: 'events', text: 'Dove si è tenuto un matrimonio che ricordi ancora? Di chi?', example: 'Matrimonio di Marta in Puglia', targets: TPP, emotionalWeight: 5 },
  { id: 'event-memorable-bday',  kind: 'moment',  category: 'events', text: 'Dove si festeggiava un compleanno che non hai più dimenticato? Di chi era?', example: '18 anni di Luca al Tropicana', targets: TPP, emotionalWeight: 3 },
  { id: 'event-strange-nye',     kind: 'moment',  category: 'events', text: 'Dove eri il capodanno più strano che hai passato? Con chi?', example: 'Capodanno 2018 a Reykjavik', targets: TPP, emotionalWeight: 3, frequency: 'rare' },
  { id: 'event-reunion',         kind: 'moment',  category: 'events', text: 'Dove hai rivisto qualcuno dopo anni? Che evento era?', example: 'Rimpatriata del liceo, 10 anni dopo', targets: TPP, emotionalWeight: 4 },
  { id: 'event-all-concerts',    kind: 'cluster', category: 'events', text: 'Ti ricordi i concerti importanti che hai visto?', targets: { place: true, theme: true }, emotionalWeight: 3 },

  // ── Family ────────────────────────────────────────────────────────────────
  { id: 'family-sunday-lunch',   kind: 'cluster', category: 'family', text: "I pranzi della domenica da bambino — chi c'era sempre?", targets: { people: true, theme: true }, emotionalWeight: 4 },
  { id: 'family-first-xmas',     kind: 'moment',  category: 'family', text: "Dove eri il primo Natale che ricordi davvero? Chi c'era con te?", example: 'Natale 1995 a casa dei nonni', targets: TPP, emotionalWeight: 5 },
  { id: 'family-car-trip',       kind: 'moment',  category: 'family', text: 'Dove stavate andando in un viaggio in macchina con la famiglia?', example: 'Gita al lago di Bracciano', targets: TPP, emotionalWeight: 3 },
  { id: 'family-with-dad',       kind: 'moment',  category: 'family', text: 'Un giorno passato da solo con tuo padre — dove siete andati?', example: 'Allo stadio con papà, prima volta', targets: TPP, emotionalWeight: 5 },
  { id: 'family-with-mom',       kind: 'moment',  category: 'family', text: 'Un giorno passato da solo con tua madre — dove eravate?', example: 'Spesa al mercato di Testaccio', targets: TPP, emotionalWeight: 5 },
  { id: 'family-new-life',       kind: 'moment',  category: 'family', text: 'Dove eri il giorno in cui è nato qualcuno di importante per te?', example: 'Nascita di Giulia, ospedale San Camillo', targets: TPP, emotionalWeight: 5 },
  { id: 'family-bday',           kind: 'moment',  category: 'family', text: 'Dove si festeggiava un compleanno di famiglia che non dimentichi?', example: '70 anni di nonna, pranzo in trattoria', targets: TPP, emotionalWeight: 4 },

  // ── Friends / Social Life ─────────────────────────────────────────────────
  { id: 'friends-first',         kind: 'period',  category: 'friends', text: 'Il primo amico della tua vita — dove vi siete conosciuti?', targets: TPP, emotionalWeight: 4 },
  { id: 'friends-night',         kind: 'moment',  category: 'friends', text: 'Dove eravate la notte con gli amici che è diventata un ricordo?', example: 'Notte in spiaggia a Formentera', targets: TPP, emotionalWeight: 3 },
  { id: 'friends-social-summer', kind: 'period',  category: 'friends', text: "Dove eri l'estate in cui hai conosciuto più persone nuove?", targets: TPP, emotionalWeight: 4 },
  { id: 'friends-reunion',       kind: 'moment',  category: 'friends', text: "Dove hai rivisto l'ultima volta un amico d'infanzia?", example: 'Caffè con Marco dopo 12 anni', targets: TPP, emotionalWeight: 4 },
  { id: 'friends-lost-group',    kind: 'period',  category: 'friends', text: 'Dove vi incontravate quando uscivi sempre con quel gruppo di amici?', targets: TPP, emotionalWeight: 4 },
  { id: 'friends-first-allnight',kind: 'moment',  category: 'friends', text: 'Dove sei rimasto la prima volta che hai passato tutta la notte fuori?', example: 'Prima serata fuori con Luca, 16 anni', targets: TPP, emotionalWeight: 3 },
]

/** Look up a prompt entity by id. Used by creation pages. */
export function getPromptEntityById(id: string | null | undefined): PromptEntity | null {
  if (!id) return null
  return PROMPT_LIBRARY.find((p) => p.id === id) ?? null
}
