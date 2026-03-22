import { WORD_CATALOG } from '../../../../../shared/word-catalog'
import type { WordReviewStatus } from '../../../../../shared/spelling'
import { updateDatabase } from '../../../../utils/storage'

export default defineEventHandler(async (event) => {
  const wordId = getRouterParam(event, 'id')
  const body = await readBody<{ reviewStatus?: WordReviewStatus }>(event)
  const reviewStatus = body.reviewStatus ?? 'unreviewed'

  if (!['unreviewed', 'needs-review', 'reviewed'].includes(reviewStatus)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid review status.' })
  }

  if (!wordId || !WORD_CATALOG.some(entry => entry.id === wordId)) {
    throw createError({ statusCode: 404, statusMessage: 'Word not found.' })
  }

  return updateDatabase((db) => {
    const existingIndex = db.wordReviewFlags.findIndex(entry => entry.wordId === wordId)

    if (reviewStatus !== 'unreviewed') {
      const nextEntry = {
        wordId,
        status: reviewStatus,
        updatedAt: new Date().toISOString()
      }

      if (existingIndex >= 0) {
        db.wordReviewFlags[existingIndex] = nextEntry
      }
      else {
        db.wordReviewFlags.push(nextEntry)
      }
    }
    else if (existingIndex >= 0) {
      db.wordReviewFlags.splice(existingIndex, 1)
    }

    return {
      wordId,
      reviewStatus
    }
  })
})
