import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const root = process.cwd()

test('shared types and server utilities define admin word review data', async () => {
  const sharedSource = await readFile(join(root, 'shared/spelling.ts'), 'utf8')
  const wordsSource = await readFile(join(root, 'server/utils/words.ts'), 'utf8')
  const apiSource = await readFile(join(root, 'server/api/admin/words.get.ts'), 'utf8')

  assert.match(sharedSource, /export interface AdminWordReviewEntry \{[\s\S]*enunciationText: string[\s\S]*tags: string\[\][\s\S]*\}/)
  assert.doesNotMatch(sharedSource, /canEnunciate: boolean/)
  assert.match(wordsSource, /export function buildAdminWordReviewEntry\(entry: WordCatalogEntry\): AdminWordReviewEntry \{[\s\S]*tags: \[\.\.\.entry\.tags\][\s\S]*\}/)
  assert.match(apiSource, /export default defineEventHandler\(\(\) => WORD_CATALOG\.map\(buildAdminWordReviewEntry\)\)/)
})

test('admin words page supports filtering and separate playback controls', async () => {
  const pageSource = await readFile(join(root, 'app/pages/admin/words.vue'), 'utf8')

  assert.match(pageSource, /function filterAdminWords\(entries: AdminWordReviewEntry\[], query: string\)/)
  assert.match(pageSource, /const \{ data: words, pending, error, refresh \} = await useFetch<AdminWordReviewEntry\[]>\('\/api\/admin\/words'/)
  assert.match(pageSource, /@click="playAdminWord\(entry, 'standard'\)"/)
  assert.match(pageSource, /@click="playAdminWord\(entry, 'enunciate'\)"/)
  assert.match(pageSource, /const wordToSpeak = mode === 'enunciate' \? entry\.enunciationText : entry\.word/)
  assert.match(pageSource, /:disabled="!playbackEnabled \|\| activePlaybackKey === `\$\{entry\.id\}:enunciate`"/)
  assert.match(pageSource, />\s*Pronounce\s*</)
  assert.match(pageSource, />\s*Enunciate\s*</)
})
