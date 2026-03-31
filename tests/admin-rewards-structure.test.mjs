import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const root = process.cwd()

test('admin rewards routes and dashboard expose reward balance data', async () => {
  const adminGetSource = await readFile(join(root, 'server/api/admin/rewards.get.ts'), 'utf8')
  const adminPostSource = await readFile(join(root, 'server/api/admin/rewards.post.ts'), 'utf8')
  const dashboardSource = await readFile(join(root, 'server/utils/dashboard.ts'), 'utf8')
  const profileSource = await readFile(join(root, 'app/pages/profile/[id]/index.vue'), 'utf8')
  const adminPageSource = await readFile(join(root, 'app/pages/admin/rewards.vue'), 'utf8')
  const storageSource = await readFile(join(root, 'server/utils/storage.ts'), 'utf8')

  assert.match(adminGetSource, /return \{\s*profiles: sortProfiles\(db\.profiles\)\.map\(profile => \(\{[\s\S]*rewardSummary:[\s\S]*recentDisbursements:[\s\S]*\}\)\)\s*\}/)
  assert.match(adminPostSource, /Amount must be a positive whole number/)
  assert.match(adminPostSource, /Amount exceeds the remaining undispatched balance/)
  assert.match(dashboardSource, /rewardSummary: getRewardSummary\(profile\.id, rewards, disbursements\)/)
  assert.match(profileSource, /data\.rewardSummary\.totalRewarded/)
  assert.match(profileSource, /data\.rewardSummary\.remainingUndispatched/)
  assert.match(adminPageSource, /\/api\/admin\/rewards/)
  assert.match(adminPageSource, /recentDisbursements/)
  assert.match(storageSource, /CREATE TABLE IF NOT EXISTS reward_disbursements/)
  assert.match(storageSource, /rewardDisbursements/)
})
