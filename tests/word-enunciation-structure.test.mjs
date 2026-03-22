import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const root = process.cwd()

test('word catalog entries store explicit enunciation text and validation helpers', async () => {
  const source = await readFile(join(root, 'shared/word-catalog.ts'), 'utf8')

  assert.match(source, /export function normalizeEnunciationText\(value: string\)/)
  assert.match(source, /export function estimateSyllableCount\(word: string\)/)
  assert.match(source, /export function shouldUseCanonicalEnunciation\(word: string\)/)
  assert.match(source, /export function hasValidEnunciation\(entry: Pick<WordCatalogEntry, 'word' \| 'normalizedWord' \| 'enunciationText'>\)/)
  assert.match(source, /\['corner', 'cor\.\.\.ner', 7, 9, 2, \['position'\]\]/)
  assert.match(source, /\['robot', 'ro\.\.\.bot', 5, 7, 1, \['play'\]\]/)
  assert.match(source, /entries\.map\(\(\[word, enunciationText, ageBandMin, ageBandMax, difficulty, tags\]\) => \(\{/)
  assert.match(source, /enunciationText: shouldUseCanonicalEnunciation\(word\) \? word : enunciationText,/)
})

test('word catalog entry type includes enunciation text', async () => {
  const source = await readFile(join(root, 'shared/spelling.ts'), 'utf8')

  assert.match(source, /export interface WordCatalogEntry \{[\s\S]*enunciationText: string[\s\S]*\}/)
})
