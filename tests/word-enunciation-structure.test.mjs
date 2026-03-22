import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const root = process.cwd()

test('word catalog entries store explicit enunciation text and validation helpers', async () => {
  const source = await readFile(join(root, 'shared/word-catalog.ts'), 'utf8')
  const jsonSource = await readFile(join(root, 'shared/word-catalog.json'), 'utf8')

  assert.match(source, /export function normalizeEnunciationText\(value: string\)/)
  assert.match(source, /export function estimateSyllableCount\(word: string\)/)
  assert.match(source, /export function shouldUseCanonicalEnunciation\(word: string\)/)
  assert.match(source, /export function hasValidEnunciation\(entry: Pick<WordCatalogEntry, 'word' \| 'normalizedWord' \| 'enunciationText'>\)/)
  assert.match(source, /import rawEntries from '\.\/word-catalog\.json'/)
  assert.match(source, /const entries = rawEntries as RawWordCatalogEntry\[]/)
  assert.match(source, /entry\.word/)
  assert.match(source, /enunciationText: shouldUseCanonicalEnunciation\(entry\.word\) \? entry\.word : entry\.enunciationText,/)
  assert.match(source, /exampleSentence: entry\.exampleSentence,/) 
  assert.match(jsonSource, /"word": "corner"[\s\S]*"enunciationText": "cor\.\.\.ner"/)
  assert.match(jsonSource, /"word": "corner"[\s\S]*"exampleSentence": "The lamp is in the corner of the room\."/)
  assert.match(jsonSource, /"word": "robot"[\s\S]*"enunciationText": "ro\.\.\.bot"/)
})

test('word catalog entry type includes enunciation text and example sentence', async () => {
  const source = await readFile(join(root, 'shared/spelling.ts'), 'utf8')

  assert.match(source, /export interface WordCatalogEntry \{[\s\S]*enunciationText: string[\s\S]*\}/)
  assert.match(source, /export interface WordCatalogEntry \{[\s\S]*exampleSentence: string[\s\S]*\}/)
})
