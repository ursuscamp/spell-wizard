import assert from 'node:assert/strict'
import test from 'node:test'
import { getRecentDisbursements, summarizeRewardBalance } from '../server/utils/reward-balances.mjs'

test('reward balance summary subtracts disbursements and clamps at zero', () => {
  const rewards = [
    { profileId: 'profile-1', robuxAwarded: 100 },
    { profileId: 'profile-1', robuxAwarded: 300 },
    { profileId: 'profile-1', robuxAwarded: 40 }
  ]
  const disbursements = [
    { profileId: 'profile-1', amount: 80, createdAt: '2026-03-31T12:00:00.000Z' },
    { profileId: 'profile-1', amount: 150, createdAt: '2026-03-31T13:00:00.000Z' },
    { profileId: 'profile-2', amount: 12, createdAt: '2026-03-31T14:00:00.000Z' }
  ]

  assert.deepEqual(summarizeRewardBalance(rewards, disbursements), {
    totalRewarded: 440,
    totalDisbursed: 242,
    remainingUndispatched: 198
  })

  assert.deepEqual(summarizeRewardBalance(
    [{ profileId: 'profile-1', robuxAwarded: 40 }],
    [{ profileId: 'profile-1', amount: 50, createdAt: '2026-03-31T13:00:00.000Z' }]
  ), {
    totalRewarded: 40,
    totalDisbursed: 50,
    remainingUndispatched: 0
  })
})

test('recent disbursements are sorted newest first and limited per profile', () => {
  const disbursements = [
    { id: 'a', profileId: 'profile-1', amount: 10, createdAt: '2026-03-31T10:00:00.000Z' },
    { id: 'b', profileId: 'profile-2', amount: 99, createdAt: '2026-03-31T11:00:00.000Z' },
    { id: 'c', profileId: 'profile-1', amount: 20, createdAt: '2026-03-31T12:00:00.000Z' },
    { id: 'd', profileId: 'profile-1', amount: 30, createdAt: '2026-03-31T13:00:00.000Z' }
  ]

  assert.deepEqual(getRecentDisbursements('profile-1', disbursements, 2).map(entry => entry.id), ['d', 'c'])
  assert.deepEqual(getRecentDisbursements('profile-2', disbursements).map(entry => entry.id), ['b'])
})
