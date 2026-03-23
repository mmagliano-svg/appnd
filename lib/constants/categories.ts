export const CATEGORIES = [
  { value: 'famiglia', label: 'Famiglia', emoji: '👨‍👩‍👧' },
  { value: 'viaggi', label: 'Viaggi', emoji: '✈️' },
  { value: 'amici', label: 'Amici', emoji: '👫' },
  { value: 'eventi', label: 'Eventi', emoji: '🎉' },
  { value: 'lavoro', label: 'Lavoro', emoji: '💼' },
  { value: 'sport', label: 'Sport', emoji: '⚽' },
  { value: 'scuola', label: 'Scuola', emoji: '📚' },
  { value: 'altro', label: 'Altro', emoji: '✨' },
] as const

export type CategoryValue = typeof CATEGORIES[number]['value']

export function getCategoryByValue(value: string | null | undefined) {
  if (!value) return null
  return CATEGORIES.find((c) => c.value === value) ?? null
}
