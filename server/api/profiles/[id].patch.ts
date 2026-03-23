import type { ProfileInput } from '../../../shared/spelling'
import { updateDatabase } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const profileId = getRouterParam(event, 'id')
  const body = await readBody<Partial<ProfileInput>>(event)

  return updateDatabase((db) => {
    const profile = db.profiles.find(item => item.id === profileId)
    if (!profile) {
      throw createError({ statusCode: 404, statusMessage: 'Profile not found.' })
    }

    if (body.name !== undefined) {
      profile.name = body.name.trim()
    }
    if (body.birthdate !== undefined) {
      profile.birthdate = body.birthdate
    }

    profile.updatedAt = new Date().toISOString()
    return profile
  })
})
