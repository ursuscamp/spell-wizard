export type RewardType = 'level-up' | 'rank-up'
export type WordReviewStatus = 'unreviewed' | 'needs-review' | 'reviewed'

export interface WordCatalogEntry {
  id: string
  word: string
  normalizedWord: string
  exampleSentence: string
  ageBandMin: number
  ageBandMax: number
  difficulty: number
  tags: string[]
}

export interface AdminWordReviewEntry {
  id: string
  word: string
  exampleSentence: string
  difficulty: number
  ageBandMin: number
  ageBandMax: number
  tags: string[]
  reviewStatus: WordReviewStatus
}

export interface WordReviewFlag {
  wordId: string
  status: Exclude<WordReviewStatus, 'unreviewed'>
  updatedAt: string
}

export interface Profile {
  id: string
  name: string
  birthdate: string
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

export interface RewardDisbursement {
  id: string
  profileId: string
  amount: number
  createdAt: string
}

export interface RewardSummary {
  totalRewarded: number
  totalDisbursed: number
  remainingUndispatched: number
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
  wordReviewFlags: WordReviewFlag[]
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
  rewardSummary: RewardSummary
  recentRewards: RewardEvent[]
  recentSessions: SessionRecord[]
  difficultWords: Array<{ word: string; misses: number; masteryScore: number }>
}

export interface HistoryView {
  profile: Profile
  rewardSummary: RewardSummary
  rewards: RewardEvent[]
  sessions: SessionRecord[]
  difficultWords: Array<{ word: string; misses: number; masteryScore: number }>
}

export interface AdminRewardProfileView {
  profile: Profile
  rewardSummary: RewardSummary
  recentDisbursements: RewardDisbursement[]
}

export interface AdminRewardsView {
  profiles: AdminRewardProfileView[]
}

export interface AdminRewardDisbursementResponse {
  profileId: string
  rewardSummary: RewardSummary
  disbursement: RewardDisbursement
}

export interface ProfileInput {
  name: string
  birthdate: string
}

export interface AppRuleSet {
  levelPointThreshold: number
  levelRewardRobux: number
  rankRewardRobux: number
  maxAttemptsPerWord: number
  rankLadder: string[]
}
