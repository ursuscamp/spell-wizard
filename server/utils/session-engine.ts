import type { AttemptResponse, Profile, RewardEvent, SessionRecord, SessionView, WordCatalogEntry, WordProgress } from '../../shared/spelling'
import { WORD_CATALOG } from '../../shared/word-catalog'
import { getForcedReboundWordId } from './rebound.mjs'
import { calculateAdaptiveWeight, getFullyMissedWordIds, pickWeightedWord } from './word-selection.mjs'
import { appRules, getLevelFromPoints, getRankForLevel } from './rules'
import { generateId, getWordProgress, upsertWordProgress } from './storage'
import { buildPromptHint, getAgeFromBirthdate, getEligibleWords, normalizeWord } from './words'

export function createSession(profile: Profile, sessions: SessionRecord[], wordProgress: WordProgress[]) {
  const session: SessionRecord = {
    id: generateId('session'),
    profileId: profile.id,
    startedAt: new Date().toISOString(),
    wordsCompleted: 0,
    pointsEarned: 0,
    rewardEvents: [],
    promptHistory: [],
    currentPrompt: undefined
  }

  session.currentPrompt = makeNextPrompt(profile, session, wordProgress)
  sessions.push(session)
  return toSessionView(session)
}

export function submitAttempt({
  answer,
  profile,
  session,
  wordProgress,
  rewards
}: {
  answer: string
  profile: Profile
  session: SessionRecord
  wordProgress: WordProgress[]
  rewards: RewardEvent[]
}): AttemptResponse {
  if (!session.currentPrompt) {
    session.currentPrompt = makeNextPrompt(profile, session, wordProgress)
  }

  const prompt = session.currentPrompt!
  const entry = WORD_CATALOG.find(word => word.id === prompt.wordId)
  if (!entry) {
    throw createError({ statusCode: 500, statusMessage: 'Prompt word not found' })
  }

  const normalizedAnswer = normalizeWord(answer)
  prompt.attempts.push(normalizedAnswer)
  const isCorrect = normalizedAnswer === entry.normalizedWord

  if (isCorrect) {
    const pointsAwarded = Math.max(appRules.maxAttemptsPerWord - prompt.attempts.length + 1, 1)
    return finishPrompt({
      entry,
      profile,
      session,
      wordProgress,
      rewards,
      wasCorrect: true,
      pointsAwarded,
      feedback: `Great spelling! You earned ${pointsAwarded} point${pointsAwarded === 1 ? '' : 's'}.`,
      status: 'correct'
    })
  }

  const remainingAttempts = appRules.maxAttemptsPerWord - prompt.attempts.length
  if (remainingAttempts > 0) {
    return {
      session: toSessionView(session),
      status: 'incorrect',
      pointsAwarded: 0,
      feedback: `Nice try! You have ${remainingAttempts} chance${remainingAttempts === 1 ? '' : 's'} left.`,
      remainingAttempts,
      rewards: []
    }
  }

  prompt.correctionRequired = true
  return {
    session: toSessionView(session, entry.word),
    status: 'correction-required',
    pointsAwarded: 0,
    feedback: `The correct spelling is ${entry.word}. Type it once to lock it in.`,
    remainingAttempts: 0,
    correctSpelling: entry.word,
    rewards: []
  }
}

export function submitCorrection({
  answer,
  profile,
  session,
  wordProgress,
  rewards
}: {
  answer: string
  profile: Profile
  session: SessionRecord
  wordProgress: WordProgress[]
  rewards: RewardEvent[]
}): AttemptResponse {
  const prompt = session.currentPrompt
  if (!prompt?.correctionRequired) {
    throw createError({ statusCode: 400, statusMessage: 'Correction is not required for this prompt' })
  }

  const entry = WORD_CATALOG.find(word => word.id === prompt.wordId)
  if (!entry) {
    throw createError({ statusCode: 500, statusMessage: 'Prompt word not found' })
  }

  if (normalizeWord(answer) !== entry.normalizedWord) {
    return {
      session: toSessionView(session, entry.word),
      status: 'correction-required',
      pointsAwarded: 0,
      feedback: `Almost there. Type ${entry.word} exactly to continue.`,
      remainingAttempts: 0,
      correctSpelling: entry.word,
      rewards: []
    }
  }

  return finishPrompt({
    entry,
    profile,
    session,
    wordProgress,
    rewards,
    wasCorrect: false,
    pointsAwarded: 0,
    feedback: 'Nice job fixing that spelling. A new word is ready!',
    status: 'correction-complete',
    correctionCompleted: true
  })
}

export function endSession(session: SessionRecord) {
  session.endedAt = new Date().toISOString()
  return {
    sessionId: session.id,
    wordsCompleted: session.wordsCompleted,
    pointsEarned: session.pointsEarned,
    rewards: session.rewardEvents
  }
}

function finishPrompt({
  entry,
  profile,
  session,
  wordProgress,
  rewards,
  wasCorrect,
  pointsAwarded,
  feedback,
  status,
  correctionCompleted = false
}: {
  entry: WordCatalogEntry
  profile: Profile
  session: SessionRecord
  wordProgress: WordProgress[]
  rewards: RewardEvent[]
  wasCorrect: boolean
  pointsAwarded: number
  feedback: string
  status: AttemptResponse['status']
  correctionCompleted?: boolean
}): AttemptResponse {
  const prompt = session.currentPrompt!
  const now = new Date().toISOString()

  session.promptHistory.push({
    wordId: entry.id,
    attempts: [...prompt.attempts],
    completedAt: now,
    wasCorrect,
    awardedPoints: pointsAwarded,
    correctionRequired: prompt.correctionRequired,
    correctionCompleted
  })

  session.wordsCompleted += 1
  session.pointsEarned += pointsAwarded

  const emittedRewards = applyProgress(profile, pointsAwarded, rewards)
  session.rewardEvents.push(...emittedRewards)

  applyWordProgress(profile, entry, prompt.attempts, wasCorrect, wordProgress)
  session.currentPrompt = makeNextPrompt(profile, session, wordProgress)

  return {
    session: toSessionView(session),
    status,
    pointsAwarded,
    feedback,
    remainingAttempts: appRules.maxAttemptsPerWord,
    rewards: emittedRewards
  }
}

function applyProgress(profile: Profile, pointsAwarded: number, rewards: RewardEvent[]) {
  if (pointsAwarded <= 0) {
    return []
  }

  const previousPoints = profile.pointsTotal
  const nextPoints = previousPoints + pointsAwarded
  profile.pointsTotal = nextPoints
  profile.level = getLevelFromPoints(nextPoints)
  profile.rankKey = getRankForLevel(profile.level).key
  profile.updatedAt = new Date().toISOString()

  const previousLevel = getLevelFromPoints(previousPoints)
  const events: RewardEvent[] = []
  for (let level = previousLevel + 1; level <= profile.level; level += 1) {
    const rank = getRankForLevel(level)
    const isRankLevel = level > 0 && level % 3 === 0
    const event: RewardEvent = {
      id: generateId('reward'),
      profileId: profile.id,
      type: isRankLevel ? 'rank-up' : 'level-up',
      levelReached: level,
      rankKey: isRankLevel ? rank.key : undefined,
      robuxAwarded: isRankLevel ? appRules.rankRewardRobux : appRules.levelRewardRobux,
      createdAt: new Date().toISOString()
    }
    rewards.push(event)
    events.push(event)
  }

  return events
}

function applyWordProgress(profile: Profile, entry: WordCatalogEntry, attempts: string[], wasCorrect: boolean, wordProgress: WordProgress[]) {
  const current = getWordProgress(profile.id, entry.id, wordProgress) ?? {
    profileId: profile.id,
    wordId: entry.id,
    masteryScore: 0,
    adaptiveWeight: 1,
    timesPrompted: 0,
    timesCorrect: 0,
    averageAttemptIndex: 1,
    recentMisses: 0,
    recentSuccesses: 0
  }

  current.timesPrompted += 1
  current.lastSeenAt = new Date().toISOString()
  current.averageAttemptIndex = Number((((current.averageAttemptIndex * (current.timesPrompted - 1)) + attempts.length) / current.timesPrompted).toFixed(2))

  if (wasCorrect) {
    current.timesCorrect += 1
    current.recentSuccesses = Math.min(current.recentSuccesses + 1, 6)
    current.recentMisses = Math.max(current.recentMisses - 1, 0)
    current.masteryScore = Number(Math.min(current.masteryScore + (attempts.length === 1 ? 0.8 : 0.3), 5).toFixed(2))
  }
  else {
    current.recentMisses = Math.min(current.recentMisses + 2, 8)
    current.recentSuccesses = Math.max(current.recentSuccesses - 1, 0)
    current.masteryScore = Number(Math.max(current.masteryScore - 0.65, 0).toFixed(2))
  }

  const age = getAgeFromBirthdate(profile.birthdate)
  current.adaptiveWeight = calculateAdaptiveWeight(entry, age, current)
  upsertWordProgress(current, wordProgress)
}

function makeNextPrompt(profile: Profile, session: SessionRecord, wordProgress: WordProgress[]) {
  const age = getAgeFromBirthdate(profile.birthdate)
  const candidates = getEligibleWords(age)
  const forcedReboundWordId = getForcedReboundWordId(session.promptHistory)
  if (forcedReboundWordId) {
    const forcedWord = WORD_CATALOG.find(word => word.id === forcedReboundWordId)
    if (forcedWord) {
      return {
        wordId: forcedWord.id,
        attempts: [],
        correctionRequired: false
      }
    }
  }

  const recentlyUsedIds = session.promptHistory.slice(-4).map(item => item.wordId)
  const fullyMissedWordIds = getFullyMissedWordIds(session.promptHistory)
  const weightedCandidates = candidates.map(word => ({
    word,
    weight: calculateAdaptiveWeight(
      word,
      age,
      getWordProgress(profile.id, word.id, wordProgress),
      recentlyUsedIds,
      fullyMissedWordIds
    )
  }))
  const nextWord = pickWeightedWord(weightedCandidates) ?? WORD_CATALOG[0]

  return {
    wordId: nextWord.id,
    attempts: [],
    correctionRequired: false
  }
}

function toSessionView(session: SessionRecord, visibleWord?: string): SessionView {
  const prompt = session.currentPrompt
  const entry = prompt ? WORD_CATALOG.find(word => word.id === prompt.wordId) : undefined

  return {
    sessionId: session.id,
    profileId: session.profileId,
    currentPrompt: {
      wordId: prompt?.wordId ?? '',
      hint: entry ? buildPromptHint(entry) : 'spelling word',
      visibleWord
    },
    attemptsUsed: prompt?.attempts.length ?? 0,
    maxAttempts: appRules.maxAttemptsPerWord,
    pointsEarned: session.pointsEarned,
    wordsCompleted: session.wordsCompleted,
    correctionRequired: prompt?.correctionRequired ?? false
  }
}
