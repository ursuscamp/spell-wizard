import { readDatabase } from '../../utils/storage'
import { WORD_CATALOG } from '../../../shared/word-catalog'

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'id')
  const db = await readDatabase()
  const session = db.sessions.find(item => item.id === sessionId)

  if (!session) {
    throw createError({ statusCode: 404, statusMessage: 'Session not found.' })
  }

  const word = WORD_CATALOG.find(entry => entry.id === session.currentPrompt?.wordId)

  return {
    sessionId: session.id,
    profileId: session.profileId,
    currentPrompt: {
      wordId: session.currentPrompt?.wordId ?? '',
      hint: word ? `${word.tags[0] ?? 'word'} word • difficulty ${word.difficulty}` : 'spelling word',
      visibleWord: session.currentPrompt?.correctionRequired ? word?.word : undefined
    },
    attemptsUsed: session.currentPrompt?.attempts.length ?? 0,
    maxAttempts: 3,
    pointsEarned: session.pointsEarned,
    wordsCompleted: session.wordsCompleted,
    correctionRequired: session.currentPrompt?.correctionRequired ?? false
  }
})
