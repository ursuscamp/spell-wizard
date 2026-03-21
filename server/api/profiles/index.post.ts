import type { Profile, ProfileInput } from '../../../shared/spelling'
import { getRankForLevel } from '../../utils/rules'
import { generateId, updateDatabase } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody<ProfileInput>(event)

  if (!body.name?.trim() || !body.birthdate) {
    throw createError({ statusCode: 400, statusMessage: 'Name and birthdate are required.' })
  }

  return updateDatabase((db) => {
    const now = new Date().toISOString()
    const profile: Profile = {
      id: generateId('profile'),
      name: body.name.trim(),
      birthdate: body.birthdate,
      avatarUri: body.avatarUri,
      pointsTotal: 0,
      level: 0,
      rankKey: getRankForLevel(0).key,
      createdAt: now,
      updatedAt: now
    }

    db.profiles.push(profile)
    return profile
  })
})
