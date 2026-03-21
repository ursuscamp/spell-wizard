import { sortProfiles, readDatabase } from '../../utils/storage'

export default defineEventHandler(async () => {
  const db = await readDatabase()
  return sortProfiles(db.profiles)
})
