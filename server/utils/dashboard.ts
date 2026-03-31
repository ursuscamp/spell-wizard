import { WORD_CATALOG } from '../../shared/word-catalog'
import type { DashboardView, HistoryView, Profile, RewardDisbursement, RewardEvent, SessionRecord, WordProgress } from '../../shared/spelling'
import { sortSessions } from './storage'
import { getRecentDisbursements, summarizeRewardBalance } from './reward-balances.mjs'

function getDifficultWords(profile: Profile, wordProgress: WordProgress[]) {
  return wordProgress
    .filter(entry => entry.profileId === profile.id && entry.recentMisses > 0)
    .sort((a, b) => b.recentMisses - a.recentMisses || a.masteryScore - b.masteryScore)
    .slice(0, 6)
    .map(entry => ({
      word: WORD_CATALOG.find(word => word.id === entry.wordId)?.word ?? entry.wordId,
      misses: entry.recentMisses,
      masteryScore: entry.masteryScore
    }))
}

function getRecentRewards(profileId: string, rewards: RewardEvent[]) {
  return rewards
    .filter(reward => reward.profileId === profileId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)
}

function getRewardSummary(profileId: string, rewards: RewardEvent[], disbursements: RewardDisbursement[]) {
  return summarizeRewardBalance(
    rewards.filter(reward => reward.profileId === profileId),
    disbursements.filter(entry => entry.profileId === profileId)
  )
}

function getProfileSessions(profileId: string, sessions: SessionRecord[]) {
  return sortSessions(sessions.filter(session => session.profileId === profileId && session.endedAt)).slice(0, 10)
}

export function buildDashboardView(profile: Profile, rewards: RewardEvent[], disbursements: RewardDisbursement[], sessions: SessionRecord[], wordProgress: WordProgress[]): DashboardView {
  return {
    profile,
    rewardSummary: getRewardSummary(profile.id, rewards, disbursements),
    recentRewards: getRecentRewards(profile.id, rewards),
    recentSessions: getProfileSessions(profile.id, sessions),
    difficultWords: getDifficultWords(profile, wordProgress)
  }
}

export function buildHistoryView(profile: Profile, rewards: RewardEvent[], disbursements: RewardDisbursement[], sessions: SessionRecord[], wordProgress: WordProgress[]): HistoryView {
  return {
    profile,
    rewardSummary: getRewardSummary(profile.id, rewards, disbursements),
    rewards: getRecentRewards(profile.id, rewards),
    sessions: sortSessions(sessions.filter(session => session.profileId === profile.id && session.endedAt)),
    difficultWords: getDifficultWords(profile, wordProgress)
  }
}

export function buildRewardSummary(profileId: string, rewards: RewardEvent[], disbursements: RewardDisbursement[]) {
  return getRewardSummary(profileId, rewards, disbursements)
}

export function getRecentRewardDisbursements(profileId: string, disbursements: RewardDisbursement[]) {
  return getRecentDisbursements(profileId, disbursements)
}
