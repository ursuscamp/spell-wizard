import rawEntries from './word-catalog.json'
import type { WordCatalogEntry } from './spelling'

interface RawWordCatalogEntry {
  word: string
  enunciationText: string
  ageBandMin: number
  ageBandMax: number
  difficulty: number
  tags: string[]
}

export function normalizeEnunciationText(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, '')
}

export function estimateSyllableCount(word: string) {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '')

  if (!normalized) {
    return 0
  }

  if (normalized.length <= 3) {
    return 1
  }

  const silentEAdjusted = normalized.endsWith('e') && !normalized.endsWith('le')
    ? normalized.slice(0, -1)
    : normalized
  const vowelGroups = silentEAdjusted.match(/[aeiouy]+/g) ?? []

  return Math.max(1, vowelGroups.length)
}

export function shouldUseCanonicalEnunciation(word: string) {
  return estimateSyllableCount(word) === 1
}

export function hasValidEnunciation(entry: Pick<WordCatalogEntry, 'word' | 'normalizedWord' | 'enunciationText'>) {
  return normalizeEnunciationText(entry.enunciationText) === entry.normalizedWord
}

const entries = rawEntries as RawWordCatalogEntry[]

export const WORD_CATALOG: WordCatalogEntry[] = entries.map((entry) => ({
  id: entry.word,
  word: entry.word,
  normalizedWord: entry.word.toLowerCase(),
  enunciationText: shouldUseCanonicalEnunciation(entry.word) ? entry.word : entry.enunciationText,
  ageBandMin: entry.ageBandMin,
  ageBandMax: entry.ageBandMax,
  difficulty: entry.difficulty,
  tags: [...entry.tags]
}))
