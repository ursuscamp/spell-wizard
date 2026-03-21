import { endSession } from '../../../utils/session-engine'
import { updateDatabase } from '../../../utils/storage'

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'id')

  return updateDatabase((db) => {
    const session = db.sessions.find(item => item.id === sessionId)
    if (!session) {
      throw createError({ statusCode: 404, statusMessage: 'Session not found.' })
    }

    return endSession(session)
  })
})
