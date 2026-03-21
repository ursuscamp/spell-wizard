import type { SessionView } from '../../../shared/spelling'
import { createSession } from '../../utils/session-engine'
import { updateDatabase } from '../../utils/storage'

export default defineEventHandler(async (event): Promise<SessionView> => {
  const body = await readBody<{ profileId: string }>(event)

  if (!body.profileId) {
    throw createError({ statusCode: 400, statusMessage: 'Profile id is required.' })
  }

  return updateDatabase((db) => {
    const profile = db.profiles.find(item => item.id === body.profileId)
    if (!profile) {
      throw createError({ statusCode: 404, statusMessage: 'Profile not found.' })
    }

    return createSession(profile, db.sessions, db.wordProgress)
  })
})
