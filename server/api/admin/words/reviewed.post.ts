import { updateDatabase } from '../../../utils/storage'

export default defineEventHandler(() => {
  return updateDatabase((db) => {
    let updatedCount = 0

    db.wordReviewFlags = db.wordReviewFlags.map((entry) => {
      if (entry.status !== 'needs-review') {
        return entry
      }

      updatedCount += 1
      return {
        ...entry,
        status: 'reviewed',
        updatedAt: new Date().toISOString()
      }
    })

    return {
      updatedCount
    }
  })
})
