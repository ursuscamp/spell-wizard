import { WORD_CATALOG } from '../../shared/word-catalog'
import type { AdminWordReviewEntry, WordCatalogEntry, WordReviewStatus } from '../../shared/spelling'

export function getAgeFromBirthdate(birthdate: string) {
  const now = new Date()
  const birthday = new Date(birthdate)
  let age = now.getFullYear() - birthday.getFullYear()
  const hasHadBirthday = now.getMonth() > birthday.getMonth()
    || (now.getMonth() === birthday.getMonth() && now.getDate() >= birthday.getDate())

  if (!hasHadBirthday) {
    age -= 1
  }

  return Math.max(age, 4)
}

export function getEligibleWords(age: number) {
  return WORD_CATALOG.filter(word => age >= word.ageBandMin - 2 && age <= word.ageBandMax + 2)
}

export function normalizeWord(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z]/g, '')
}

export function buildPromptHint(entry: WordCatalogEntry) {
  return `${entry.tags[0] ?? 'word'} word • difficulty ${entry.difficulty}`
}

export function buildAdminWordReviewEntry(entry: WordCatalogEntry, reviewStatus: WordReviewStatus = 'unreviewed'): AdminWordReviewEntry {
  return {
    id: entry.id,
    word: entry.word,
    exampleSentence: entry.exampleSentence,
    difficulty: entry.difficulty,
    ageBandMin: entry.ageBandMin,
    ageBandMax: entry.ageBandMax,
    tags: [...entry.tags],
    reviewStatus
  }
}
