/**
 * Memory Prompt Library
 *
 * A structured library of emotional, memory-triggering prompts used by
 * HomeMemoryPrompt to help users reconstruct their life through
 * specific moments (not free journaling).
 *
 * Each prompt is designed to implicitly guide the user toward the four
 * pieces of structured metadata Appnd tracks:
 *   - WHEN  (date or life period)
 *   - WHERE (location)
 *   - WHO   (people)
 *   - TYPE  (category / anchor)
 *
 * Prompts should feel spontaneous and human — not like a questionnaire.
 * This is NOT journaling. The goal is to reconstruct a life, one
 * specific moment at a time.
 *
 * V1 is a hardcoded Italian library. AI / personalization comes later.
 */

export type MemoryPromptCategory =
  | 'relationships'
  | 'home'
  | 'travel'
  | 'work'
  | 'sports'
  | 'events'
  | 'family'
  | 'friends'

export interface MemoryPrompt {
  category: MemoryPromptCategory
  text: string
}

export const MEMORY_PROMPTS: MemoryPrompt[] = [
  // ── Relationships ─────────────────────────────────────────────────────────
  { category: 'relationships', text: 'Ti ricordi la prima volta che hai visto qualcuno che poi è diventato importante per te?' },
  { category: 'relationships', text: 'Quando è iniziata la tua relazione più lunga — dove eravate?' },
  { category: 'relationships', text: 'Il primo appuntamento che ricordi davvero — in che città?' },
  { category: 'relationships', text: 'C’è un addio che non hai mai raccontato a nessuno?' },
  { category: 'relationships', text: 'Qual è stata la prima estate vissuta con qualcuno a cui tenevi?' },
  { category: 'relationships', text: 'Ti ricordi quando hai presentato qualcuno ai tuoi per la prima volta?' },
  { category: 'relationships', text: 'La prima casa che hai condiviso con qualcuno — dove era?' },
  { category: 'relationships', text: 'Qual è stato il momento in cui hai capito che era amore?' },

  // ── Home / Places ─────────────────────────────────────────────────────────
  { category: 'home', text: 'Ti ricordi tutte le case in cui hai vissuto?' },
  { category: 'home', text: 'Qual è stato il primo posto che hai chiamato “casa tua”?' },
  { category: 'home', text: 'La stanza della tua infanzia — come la ricordi?' },
  { category: 'home', text: 'Ti ricordi il giorno del trasloco più importante della tua vita?' },
  { category: 'home', text: 'C’è un posto in cui tornavi sempre da bambino?' },
  { category: 'home', text: 'La prima casa lontano dalla famiglia — in che città?' },
  { category: 'home', text: 'Il quartiere in cui giocavi da piccolo — chi c’era con te?' },
  { category: 'home', text: 'Qual è l’ultima casa che hai davvero sentito tua?' },

  // ── Travel ────────────────────────────────────────────────────────────────
  { category: 'travel', text: 'Ti ricordi il tuo primo viaggio da solo?' },
  { category: 'travel', text: 'Qual è stato il viaggio che ti ha cambiato qualcosa dentro?' },
  { category: 'travel', text: 'La prima volta che hai visto il mare — con chi eri?' },
  { category: 'travel', text: 'C’è una città in cui sei tornato più volte nella vita?' },
  { category: 'travel', text: 'Ti ricordi un viaggio in treno che non dimentichi più?' },
  { category: 'travel', text: 'La prima volta che hai preso un aereo — dove stavi andando?' },
  { category: 'travel', text: 'Un posto in cui hai dormito una notte sola — quale?' },
  { category: 'travel', text: 'Qual è stato il viaggio più lungo che hai mai fatto?' },

  // ── Work / School ─────────────────────────────────────────────────────────
  { category: 'work', text: 'Ti ricordi il tuo primo giorno di lavoro — dove eri?' },
  { category: 'work', text: 'Qual è stato il lavoro che hai fatto più a lungo?' },
  { category: 'work', text: 'Cosa hai fatto con il tuo primo stipendio?' },
  { category: 'work', text: 'La scuola che ricordi meglio — perché proprio quella?' },
  { category: 'work', text: 'Chi era il compagno di banco che ti ha segnato di più?' },
  { category: 'work', text: 'Il primo capo che hai avuto — com’era?' },
  { category: 'work', text: 'Ti ricordi il giorno in cui hai cambiato lavoro?' },
  { category: 'work', text: 'L’ultimo giorno di scuola — come l’hai vissuto?' },

  // ── Sports / Activities ───────────────────────────────────────────────────
  { category: 'sports', text: 'Ti ricordi il primo sport che hai praticato — e con chi?' },
  { category: 'sports', text: 'Una partita che non dimentichi — quando è stata?' },
  { category: 'sports', text: 'Il primo allenatore che ti è rimasto in mente — chi era?' },
  { category: 'sports', text: 'C’è un’attività che hai lasciato e ti manca ancora?' },
  { category: 'sports', text: 'La prima volta che hai vinto qualcosa — cosa?' },
  { category: 'sports', text: 'Chi ti ha insegnato uno sport che ami ancora?' },

  // ── Events ────────────────────────────────────────────────────────────────
  { category: 'events', text: 'A quanti matrimoni sei stato nella tua vita?' },
  { category: 'events', text: 'Il primo concerto a cui sei andato — di chi?' },
  { category: 'events', text: 'Ti ricordi la festa più lunga della tua vita?' },
  { category: 'events', text: 'Qual è stato il matrimonio più bello a cui hai partecipato?' },
  { category: 'events', text: 'Una festa di compleanno che ricordi ancora — di chi?' },
  { category: 'events', text: 'Il capodanno più strano che hai passato — dove?' },
  { category: 'events', text: 'Un evento in cui hai rivisto qualcuno dopo anni — quando?' },

  // ── Family / Children ─────────────────────────────────────────────────────
  { category: 'family', text: 'Ti ricordi i pranzi della domenica da bambino — chi c’era?' },
  { category: 'family', text: 'Il primo Natale che ricordi davvero — dove eri?' },
  { category: 'family', text: 'Un viaggio in macchina con la famiglia — che anno era?' },
  { category: 'family', text: 'La prima volta che hai fatto qualcosa con tuo padre — cosa?' },
  { category: 'family', text: 'Un momento con tua madre che porti ancora dentro — quale?' },
  { category: 'family', text: 'Ti ricordi il giorno in cui è nato qualcuno di importante per te?' },
  { category: 'family', text: 'Un compleanno di famiglia che non dimentichi — di chi?' },

  // ── Friends / Social Life ─────────────────────────────────────────────────
  { category: 'friends', text: 'Ti ricordi il primo amico della tua vita — come vi siete conosciuti?' },
  { category: 'friends', text: 'Una notte con gli amici diventata un ricordo — quando?' },
  { category: 'friends', text: 'L’estate in cui hai conosciuto più persone nuove — che anno?' },
  { category: 'friends', text: 'Ti ricordi l’ultima volta che hai rivisto un amico d’infanzia?' },
  { category: 'friends', text: 'Un gruppo di amici che non esiste più — chi eravate?' },
  { category: 'friends', text: 'La prima volta che sei rimasto fuori tutta la notte — con chi?' },
]

/**
 * Flat list of prompt texts — used by HomeMemoryPrompt for random selection.
 */
export const MEMORY_PROMPT_TEXTS: string[] = MEMORY_PROMPTS.map((p) => p.text)
