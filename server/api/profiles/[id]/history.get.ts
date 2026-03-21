import { buildHistoryView } from '../../../utils/dashboard'
import { readDatabase } from '../../../utils/storage'

export default defineEventHandler(async (event) => {
  const profileId = getRouterParam(event, 'id')
  const db = await readDatabase()
  const profile = db.profiles.find(item => item.id === profileId)

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Profile not found.' })
  }

  return buildHistoryView(profile, db.rewards, db.sessions, db.wordProgress)
})
