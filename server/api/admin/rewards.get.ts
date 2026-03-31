import { sortProfiles, readDatabase } from '../../utils/storage'
import { getRecentRewardDisbursements, buildRewardSummary } from '../../utils/dashboard'

export default defineEventHandler(async () => {
  const db = await readDatabase()

  return {
    profiles: sortProfiles(db.profiles).map(profile => ({
      profile,
      rewardSummary: buildRewardSummary(profile.id, db.rewards, db.rewardDisbursements),
      recentDisbursements: getRecentRewardDisbursements(profile.id, db.rewardDisbursements)
    }))
  }
})
