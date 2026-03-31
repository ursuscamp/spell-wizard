import { updateDatabase } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const profileId = getRouterParam(event, 'id')

  return updateDatabase((db) => {
    db.profiles = db.profiles.filter(profile => profile.id !== profileId)
    db.rewards = db.rewards.filter(reward => reward.profileId !== profileId)
    db.rewardDisbursements = db.rewardDisbursements.filter(entry => entry.profileId !== profileId)
    db.wordProgress = db.wordProgress.filter(progress => progress.profileId !== profileId)
    db.sessions = db.sessions.filter(session => session.profileId !== profileId)
    return { success: true }
  })
})
