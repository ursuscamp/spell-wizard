import type { AttemptResponse } from '../../../../shared/spelling'
import { submitCorrection } from '../../../utils/session-engine'
import { updateDatabase } from '../../../utils/storage'

export default defineEventHandler(async (event): Promise<AttemptResponse> => {
  const sessionId = getRouterParam(event, 'id')
  const body = await readBody<{ answer: string }>(event)

  return updateDatabase((db) => {
    const session = db.sessions.find(item => item.id === sessionId)
    if (!session) {
      throw createError({ statusCode: 404, statusMessage: 'Session not found.' })
    }

    const profile = db.profiles.find(item => item.id === session.profileId)
    if (!profile) {
      throw createError({ statusCode: 404, statusMessage: 'Profile not found.' })
    }

    return submitCorrection({
      answer: body.answer,
      profile,
      session,
      wordProgress: db.wordProgress,
      rewards: db.rewards
    })
  })
})
