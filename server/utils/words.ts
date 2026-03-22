import { hasValidEnunciation, WORD_CATALOG } from '../../shared/word-catalog'
import type { AdminWordReviewEntry, WordCatalogEntry, WordProgress } from '../../shared/spelling'

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

export function canEnunciateWord(entry?: WordCatalogEntry | null) {
  return Boolean(entry && entry.enunciationText && hasValidEnunciation(entry))
}

export function buildAdminWordReviewEntry(entry: WordCatalogEntry): AdminWordReviewEntry {
  return {
    id: entry.id,
    word: entry.word,
    enunciationText: entry.enunciationText,
    exampleSentence: entry.exampleSentence,
    difficulty: entry.difficulty,
    ageBandMin: entry.ageBandMin,
    ageBandMax: entry.ageBandMax,
    tags: [...entry.tags]
  }
}

export function calculateAdaptiveWeight(entry: WordCatalogEntry, age: number, progress?: WordProgress, recentlyUsedIds: string[] = []) {
  const ageMidpoint = (entry.ageBandMin + entry.ageBandMax) / 2
  const ageDistance = Math.abs(age - ageMidpoint)
  const agePenalty = ageDistance * 1.1
  const masteryPenalty = (progress?.masteryScore ?? 0) * 1.8
  const struggleBoost = (progress?.recentMisses ?? 0) * 2.4 + Math.max((progress?.averageAttemptIndex ?? 1) - 1, 0) * 1.25
  const recencyPenalty = recentlyUsedIds.includes(entry.id) ? 4 : 0
  const baseWeight = 8 - entry.difficulty * 0.4

  return Math.max(0.35, Number((baseWeight - agePenalty - masteryPenalty + struggleBoost - recencyPenalty).toFixed(2)))
}

export function pickWeightedWord(candidates: Array<{ word: WordCatalogEntry; weight: number }>) {
  const total = candidates.reduce((sum, entry) => sum + entry.weight, 0)
  let cursor = Math.random() * total

  for (const candidate of candidates) {
    cursor -= candidate.weight
    if (cursor <= 0) {
      return candidate.word
    }
  }

  return candidates[candidates.length - 1]?.word ?? WORD_CATALOG[0]
}
