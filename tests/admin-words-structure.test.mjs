import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const root = process.cwd()

test('shared types and server utilities define admin word review data', async () => {
  const sharedSource = await readFile(join(root, 'shared/spelling.ts'), 'utf8')
  const wordsSource = await readFile(join(root, 'server/utils/words.ts'), 'utf8')
  const apiSource = await readFile(join(root, 'server/api/admin/words.get.ts'), 'utf8')
  const storageSource = await readFile(join(root, 'server/utils/storage.ts'), 'utf8')
  const reviewPatchSource = await readFile(join(root, 'server/api/admin/words/[id]/review.patch.ts'), 'utf8')
  const reviewClearSource = await readFile(join(root, 'server/api/admin/words/reviewed.post.ts'), 'utf8')

  assert.match(sharedSource, /export type WordReviewStatus = 'unreviewed' \| 'needs-review' \| 'reviewed'/)
  assert.match(sharedSource, /export interface AdminWordReviewEntry \{[\s\S]*enunciationText: string[\s\S]*exampleSentence: string[\s\S]*tags: string\[\][\s\S]*reviewStatus: WordReviewStatus[\s\S]*\}/)
  assert.match(sharedSource, /export interface WordReviewFlag \{[\s\S]*wordId: string[\s\S]*status: Exclude<WordReviewStatus, 'unreviewed'>[\s\S]*updatedAt: string[\s\S]*\}/)
  assert.doesNotMatch(sharedSource, /canEnunciate: boolean/)
  assert.match(wordsSource, /export function buildAdminWordReviewEntry\(entry: WordCatalogEntry, reviewStatus: WordReviewStatus = 'unreviewed'\): AdminWordReviewEntry \{[\s\S]*exampleSentence: entry\.exampleSentence,[\s\S]*tags: \[\.\.\.entry\.tags\],[\s\S]*reviewStatus[\s\S]*\}/)
  assert.match(apiSource, /const reviewStatuses = new Map\(db\.wordReviewFlags\.map\(entry => \[entry\.wordId, entry\.status\]\)\)/)
  assert.match(apiSource, /return WORD_CATALOG\.map\(entry => buildAdminWordReviewEntry\(entry, reviewStatuses\.get\(entry\.id\) \?\? 'unreviewed'\)\)/)
  assert.match(storageSource, /CREATE TABLE IF NOT EXISTS word_review_flags \([\s\S]*word_id TEXT PRIMARY KEY,[\s\S]*status TEXT NOT NULL[\s\S]*updated_at TEXT NOT NULL/)
  assert.match(storageSource, /state\.wordReviewFlags = db\.prepare\([\s\S]*FROM word_review_flags/)
  assert.match(reviewPatchSource, /const body = await readBody<\{ reviewStatus\?: WordReviewStatus \}>\(event\)/)
  assert.match(reviewPatchSource, /if \(!\['unreviewed', 'needs-review', 'reviewed'\]\.includes\(reviewStatus\)\)/)
  assert.match(reviewPatchSource, /db\.wordReviewFlags\.push\(nextEntry\)/)
  assert.match(reviewClearSource, /entry\.status !== 'needs-review'/)
  assert.match(reviewClearSource, /status: 'reviewed'/)
})

test('admin words page supports filtering, review actions, and tts testing', async () => {
  const pageSource = await readFile(join(root, 'app/pages/admin/words.vue'), 'utf8')

  assert.match(pageSource, /type ReviewFilter = 'all' \| WordReviewStatus/)
  assert.match(pageSource, /function filterAdminWords\(entries: AdminWordReviewEntry\[], query: string, reviewFilter: ReviewFilter\)/)
  assert.match(pageSource, /const \{ data: words, pending, error, refresh \} = await useFetch<AdminWordReviewEntry\[]>\('\/api\/admin\/words'/)
  assert.match(pageSource, /entry\.exampleSentence/)
  assert.match(pageSource, /getReviewStatusLabel\(reviewStatus: WordReviewStatus\)/)
  assert.match(pageSource, /@click="setReviewStatus\(entry, 'needs-review'\)"/)
  assert.match(pageSource, /@click="setReviewStatus\(entry, 'reviewed'\)"/)
  assert.match(pageSource, /@click="markAllReviewed"/)
  assert.match(pageSource, /v-model="reviewFilter"/)
  assert.match(pageSource, /@click="playAdminWord\(entry, 'standard'\)"/)
  assert.match(pageSource, /@click="playAdminWord\(entry, 'enunciate'\)"/)
  assert.match(pageSource, /const wordToSpeak = mode === 'enunciate' \? entry\.enunciationText : entry\.word/)
  assert.match(pageSource, /:disabled="!playbackEnabled \|\| activePlaybackKey === `\$\{entry\.id\}:enunciate`"/)
  assert.match(pageSource, /<option value="unreviewed">Unreviewed<\/option>/)
  assert.match(pageSource, /v-model="ttsInput"/)
  assert.match(pageSource, /v-model="ttsMode"/)
  assert.match(pageSource, /@click="testTts"/)
  assert.match(pageSource, />\s*Pronounce\s*</)
  assert.match(pageSource, />\s*Enunciate\s*</)
  assert.match(pageSource, />\s*Mark all as reviewed\s*</)
  assert.match(pageSource, />\s*Mark reviewed\s*</)
  assert.match(pageSource, />\s*Test TTS\s*</)
})
