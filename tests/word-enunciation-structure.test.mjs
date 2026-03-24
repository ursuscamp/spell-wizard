import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const root = process.cwd()

test('word catalog maps raw entries without a separate enunciation field', async () => {
  const source = await readFile(join(root, 'shared/word-catalog.ts'), 'utf8')
  const jsonSource = await readFile(join(root, 'shared/word-catalog.json'), 'utf8')

  assert.match(source, /import rawEntries from '\.\/word-catalog\.json'/)
  assert.match(source, /const entries = rawEntries as RawWordCatalogEntry\[]/)
  assert.match(source, /entry\.word/)
  assert.match(source, /exampleSentence: entry\.exampleSentence,/)
  assert.doesNotMatch(source, /enunciationText/)
  assert.doesNotMatch(jsonSource, /"enunciationText":/)
  assert.match(jsonSource, /"word": "corner"[\s\S]*"exampleSentence": "The lamp is in the corner of the room\."/)
})

test('word catalog entry type keeps example sentence and omits enunciation text', async () => {
  const source = await readFile(join(root, 'shared/spelling.ts'), 'utf8')

  assert.match(source, /export interface WordCatalogEntry \{[\s\S]*exampleSentence: string[\s\S]*\}/)
  assert.doesNotMatch(source, /enunciationText: string/)
})
