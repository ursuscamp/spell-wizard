export function summarizeRewardBalance(rewards, disbursements) {
  const totalRewarded = rewards.reduce((sum, reward) => sum + Number(reward.robuxAwarded ?? 0), 0)
  const totalDisbursed = disbursements.reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0)

  return {
    totalRewarded,
    totalDisbursed,
    remainingUndispatched: Math.max(totalRewarded - totalDisbursed, 0)
  }
}

export function getRecentDisbursements(profileId, disbursements, limit = 6) {
  return disbursements
    .filter(entry => entry.profileId === profileId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export function buildProfileRewardSnapshot(profileId, rewards, disbursements, limit = 6) {
  const profileRewards = rewards.filter(reward => reward.profileId === profileId)
  const profileDisbursements = getRecentDisbursements(profileId, disbursements, limit)

  return {
    rewardSummary: summarizeRewardBalance(profileRewards, disbursements.filter(entry => entry.profileId === profileId)),
    recentDisbursements: profileDisbursements
  }
}
