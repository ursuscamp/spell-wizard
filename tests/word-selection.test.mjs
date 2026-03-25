import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateAdaptiveWeight, getFullyMissedWordIds, pickWeightedWord } from '../server/utils/word-selection.mjs'

function makeEntry(overrides = {}) {
  return {
    id: 'alpha',
    word: 'alpha',
    ageBandMin: 5,
    ageBandMax: 7,
    difficulty: 2,
    tags: ['sample'],
    ...overrides
  }
}

function makeProgress(overrides = {}) {
  return {
    profileId: 'profile-1',
    wordId: 'alpha',
    masteryScore: 0,
    adaptiveWeight: 1,
    timesPrompted: 1,
    timesCorrect: 0,
    averageAttemptIndex: 1,
    recentMisses: 0,
    recentSuccesses: 0,
    ...overrides
  }
}

function makeRandom(seed = 7) {
  let state = seed
  return () => {
    state = (state * 48271) % 2147483647
    return (state - 1) / 2147483646
  }
}

test('fully missed words get a stronger weight boost than ordinary misses', () => {
  const entry = makeEntry()
  const age = 6
  const recentlyUsedIds = []
  const fullyMissedWordIds = getFullyMissedWordIds([
    {
      wordId: entry.id,
      attempts: ['a', 'b', 'c'],
      wasCorrect: false,
      awardedPoints: 0,
      correctionRequired: true,
      correctionCompleted: true
    }
  ])

  const masteredWeight = calculateAdaptiveWeight(entry, age, makeProgress({
    masteryScore: 4.4,
    recentMisses: 0,
    averageAttemptIndex: 1
  }), recentlyUsedIds)

  const missedOnceWeight = calculateAdaptiveWeight(entry, age, makeProgress({
    masteryScore: 0.4,
    recentMisses: 1,
    averageAttemptIndex: 2
  }), recentlyUsedIds)

  const fullyMissedWeight = calculateAdaptiveWeight(entry, age, makeProgress({
    masteryScore: 0.4,
    recentMisses: 1,
    averageAttemptIndex: 2
  }), recentlyUsedIds, fullyMissedWordIds)

  assert.ok(fullyMissedWeight > missedOnceWeight)
  assert.ok(missedOnceWeight > masteredWeight)
  assert.ok(fullyMissedWeight - missedOnceWeight >= 7.5)
})

test('weighted selection favors a fully missed word over comparable alternatives', () => {
  const age = 6
  const recentWord = makeEntry({ id: 'recent', word: 'recent' })
  const missedWord = makeEntry({ id: 'missed', word: 'missed' })
  const masteredWord = makeEntry({ id: 'mastered', word: 'mastered' })
  const fullyMissedWordIds = new Set(['recent'])
  const recentlyUsedIds = ['recent']

  const candidates = [
    {
      word: recentWord,
      weight: calculateAdaptiveWeight(recentWord, age, makeProgress({
        profileId: 'profile-1',
        wordId: 'recent',
        masteryScore: 0.4,
        recentMisses: 1,
        averageAttemptIndex: 2
      }), recentlyUsedIds, fullyMissedWordIds)
    },
    {
      word: missedWord,
      weight: calculateAdaptiveWeight(missedWord, age, makeProgress({
        profileId: 'profile-1',
        wordId: 'missed',
        masteryScore: 0.4,
        recentMisses: 1,
        averageAttemptIndex: 2
      }), [])
    },
    {
      word: masteredWord,
      weight: calculateAdaptiveWeight(masteredWord, age, makeProgress({
        profileId: 'profile-1',
        wordId: 'mastered',
        masteryScore: 4.4,
        recentMisses: 0,
        averageAttemptIndex: 1
      }), [])
    }
  ]

  const random = makeRandom(13)
  const counts = new Map(candidates.map(candidate => [candidate.word.id, 0]))

  for (let index = 0; index < 250; index += 1) {
    const picked = pickWeightedWord(candidates, random)
    counts.set(picked.id, (counts.get(picked.id) ?? 0) + 1)
  }

  assert.ok((counts.get('recent') ?? 0) > (counts.get('missed') ?? 0))
  assert.ok((counts.get('missed') ?? 0) > (counts.get('mastered') ?? 0))
})

test('recent repeat penalty still lowers the chance of back-to-back repetition', () => {
  const age = 6
  const repeatedWord = makeEntry({ id: 'repeat', word: 'repeat' })
  const freshWord = makeEntry({ id: 'fresh', word: 'fresh' })
  const repeatedWeight = calculateAdaptiveWeight(repeatedWord, age, makeProgress({
    profileId: 'profile-1',
    wordId: 'repeat',
    masteryScore: 0.5,
    recentMisses: 1,
    averageAttemptIndex: 2
  }), ['repeat'])
  const freshWeight = calculateAdaptiveWeight(freshWord, age, makeProgress({
    profileId: 'profile-1',
    wordId: 'fresh',
    masteryScore: 0.5,
    recentMisses: 1,
    averageAttemptIndex: 2
  }), [])

  assert.ok(freshWeight > repeatedWeight)

  const candidates = [
    { word: repeatedWord, weight: repeatedWeight },
    { word: freshWord, weight: freshWeight }
  ]
  const random = makeRandom(29)
  let repeatedCount = 0
  let freshCount = 0

  for (let index = 0; index < 200; index += 1) {
    const picked = pickWeightedWord(candidates, random)
    if (picked.id === 'repeat') {
      repeatedCount += 1
    }
    else {
      freshCount += 1
    }
  }

  assert.ok(freshCount > repeatedCount)
})
