import type { RewardDisbursement } from '../../../shared/spelling'
import { buildRewardSummary } from '../../utils/dashboard'
import { generateId, updateDatabase } from '../../utils/storage'

function parseAmount(value: unknown) {
  const amount = typeof value === 'number' ? value : Number(value)

  if (!Number.isInteger(amount) || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Amount must be a positive whole number.' })
  }

  return amount
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ profileId?: string; amount?: unknown }>(event)
  const profileId = typeof body.profileId === 'string' ? body.profileId.trim() : ''
  const amount = parseAmount(body.amount)

  if (!profileId) {
    throw createError({ statusCode: 400, statusMessage: 'Profile is required.' })
  }

  return updateDatabase((db) => {
    const profile = db.profiles.find(item => item.id === profileId)

    if (!profile) {
      throw createError({ statusCode: 404, statusMessage: 'Profile not found.' })
    }

    const rewardSummary = buildRewardSummary(profileId, db.rewards, db.rewardDisbursements)

    if (amount > rewardSummary.remainingUndispatched) {
      throw createError({ statusCode: 400, statusMessage: 'Amount exceeds the remaining undispatched balance.' })
    }

    const disbursement: RewardDisbursement = {
      id: generateId('disbursement'),
      profileId,
      amount,
      createdAt: new Date().toISOString()
    }

    db.rewardDisbursements.push(disbursement)

    return {
      profileId,
      rewardSummary: buildRewardSummary(profileId, db.rewards, db.rewardDisbursements),
      disbursement
    }
  })
})
