export function getFullyMissedWordIds(promptHistory) {
  const fullyMissedWordIds = new Set()

  for (const prompt of promptHistory) {
    if (prompt.correctionRequired) {
      fullyMissedWordIds.add(prompt.wordId)
    }
  }

  return fullyMissedWordIds
}

export function calculateAdaptiveWeight(entry, age, progress, recentlyUsedIds = [], fullyMissedWordIds = new Set()) {
  const ageMidpoint = (entry.ageBandMin + entry.ageBandMax) / 2
  const ageDistance = Math.abs(age - ageMidpoint)
  const agePenalty = ageDistance * 1.1
  const masteryPenalty = (progress?.masteryScore ?? 0) * 1.8
  const struggleBoost = (progress?.recentMisses ?? 0) * 2.4 + Math.max((progress?.averageAttemptIndex ?? 1) - 1, 0) * 1.25
  const fullMissBoost = fullyMissedWordIds.has(entry.id) ? 8 : 0
  const recencyPenalty = recentlyUsedIds.includes(entry.id) ? 4 : 0
  const baseWeight = 8 - entry.difficulty * 0.4

  return Math.max(0.35, Number((baseWeight - agePenalty - masteryPenalty + struggleBoost + fullMissBoost - recencyPenalty).toFixed(2)))
}

export function pickWeightedWord(candidates, random = Math.random) {
  const total = candidates.reduce((sum, entry) => sum + entry.weight, 0)
  let cursor = random() * total

  for (const candidate of candidates) {
    cursor -= candidate.weight
    if (cursor <= 0) {
      return candidate.word
    }
  }

  return candidates[candidates.length - 1]?.word
}
