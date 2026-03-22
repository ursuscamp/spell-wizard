import { WORD_CATALOG } from '../../../shared/word-catalog'
import { readDatabase } from '../../utils/storage'
import { buildAdminWordReviewEntry } from '../../utils/words'

export default defineEventHandler(async () => {
  const db = await readDatabase()
  const reviewStatuses = new Map(db.wordReviewFlags.map(entry => [entry.wordId, entry.status]))

  return WORD_CATALOG.map(entry => buildAdminWordReviewEntry(entry, reviewStatuses.get(entry.id) ?? 'unreviewed'))
})
