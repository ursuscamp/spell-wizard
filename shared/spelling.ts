export type RewardType = 'level-up' | 'rank-up'

export interface WordCatalogEntry {
  id: string
  word: string
  normalizedWord: string
  enunciationText: string
  ageBandMin: number
  ageBandMax: number
  difficulty: number
  tags: string[]
}

export interface Profile {
  id: string
  name: string
  birthdate: string
  avatarUri?: string
  pointsTotal: number
  level: number
  rankKey: string
  createdAt: string
  updatedAt: string
}

export interface RewardEvent {
  id: string
  profileId: string
  type: RewardType
  levelReached: number
  rankKey?: string
  robuxAwarded: number
  createdAt: string
}

export interface WordProgress {
  profileId: string
  wordId: string
  masteryScore: number
  adaptiveWeight: number
  lastSeenAt?: string
  timesPrompted: number
  timesCorrect: number
  averageAttemptIndex: number
  recentMisses: number
  recentSuccesses: number
}

export interface SessionPromptRecord {
  wordId: string
  attempts: string[]
  completedAt?: string
  wasCorrect: boolean
  awardedPoints: number
  correctionRequired: boolean
  correctionCompleted: boolean
}

export interface ActivePromptState {
  wordId: string
  attempts: string[]
  correctionRequired: boolean
}

export interface SessionRecord {
  id: string
  profileId: string
  startedAt: string
  endedAt?: string
  wordsCompleted: number
  pointsEarned: number
  rewardEvents: RewardEvent[]
  promptHistory: SessionPromptRecord[]
  currentPrompt?: ActivePromptState
}

export interface DatabaseShape {
  version: number
  profiles: Profile[]
  rewards: RewardEvent[]
  wordProgress: WordProgress[]
  sessions: SessionRecord[]
}

export interface RankDefinition {
  key: string
  index: number
}

export interface PromptView {
  wordId: string
  hint: string
  visibleWord?: string
}

export interface SessionView {
  sessionId: string
  profileId: string
  currentPrompt: PromptView
  attemptsUsed: number
  maxAttempts: number
  pointsEarned: number
  wordsCompleted: number
  correctionRequired: boolean
}

export interface AttemptResponse {
  session: SessionView
  status: 'correct' | 'incorrect' | 'correction-required' | 'correction-complete'
  pointsAwarded: number
  feedback: string
  remainingAttempts: number
  correctSpelling?: string
  rewards: RewardEvent[]
}

export interface DashboardView {
  profile: Profile
  recentRewards: RewardEvent[]
  recentSessions: SessionRecord[]
  difficultWords: Array<{ word: string; misses: number; masteryScore: number }>
}

export interface HistoryView {
  profile: Profile
  rewards: RewardEvent[]
  sessions: SessionRecord[]
  difficultWords: Array<{ word: string; misses: number; masteryScore: number }>
}

export interface ProfileInput {
  name: string
  birthdate: string
  avatarUri?: string
}

export interface AppRuleSet {
  levelPointThreshold: number
  levelRewardRobux: number
  rankRewardRobux: number
  maxAttemptsPerWord: number
  rankLadder: string[]
}
