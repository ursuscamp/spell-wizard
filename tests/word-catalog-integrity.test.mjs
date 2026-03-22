import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const root = process.cwd()

function parseEntries(source) {
  const entries = []
  const pattern = /\['([^']+)', '([^']+)', (\d+), (\d+), (\d+), \[([^\]]*)\]\]/g

  for (const match of source.matchAll(pattern)) {
    const [, word, enunciationText, ageBandMin, ageBandMax, difficulty, rawTags] = match
    entries.push({
      word,
      enunciationText,
      ageBandMin: Number(ageBandMin),
      ageBandMax: Number(ageBandMax),
      difficulty: Number(difficulty),
      tags: [...rawTags.matchAll(/'([^']+)'/g)].map(tagMatch => tagMatch[1])
    })
  }

  return entries
}

function normalizeLetters(value) {
  return value.toLowerCase().replace(/[^a-z]/g, '')
}

test('word catalog keeps unique ids and expected band counts', async () => {
  const source = await readFile(join(root, 'shared/word-catalog.ts'), 'utf8')
  const entries = parseEntries(source)
  const words = entries.map(entry => entry.word)
  const uniqueWords = new Set(words)
  const bandCounts = entries.reduce((counts, entry) => {
    const key = `${entry.ageBandMin}-${entry.ageBandMax}-${entry.difficulty}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
    return counts
  }, new Map())

  assert.equal(entries.length, 294)
  assert.equal(uniqueWords.size, entries.length)
  assert.equal(bandCounts.get('5-7-1'), 119)
  assert.equal(bandCounts.get('7-9-2'), 116)
  assert.equal(bandCounts.get('9-12-3'), 59)
})

test('new lower-band words use unique entries with valid normalized enunciation text', async () => {
  const source = await readFile(join(root, 'shared/word-catalog.ts'), 'utf8')
  const entries = parseEntries(source)
  const addedWords = [
    'acorn', 'bear', 'bee', 'block', 'bread', 'broom', 'brush', 'bug', 'bus', 'clock',
    'crab', 'crow', 'cup', 'deer', 'dish', 'dog', 'flag', 'fox', 'glove', 'goat',
    'grass', 'horse', 'house', 'jam', 'juice', 'key', 'lion', 'log', 'map', 'mouse',
    'peach', 'pear', 'pen', 'road', 'rope', 'sand', 'scarf', 'shark', 'shell', 'smile',
    'snack', 'spoon', 'stamp', 'stick', 'storm', 'tent', 'toast', 'truck', 'whale', 'worm',
    'across', 'afraid', 'airplane', 'airport', 'backpack', 'balance', 'banana', 'beetle', 'between', 'bicycle',
    'button', 'carrot', 'cobweb', 'cousin', 'dentist', 'dinner', 'dolphin', 'farmer', 'forest', 'goblin',
    'helmet', 'island', 'jumper', 'lantern', 'lemon', 'marble', 'meadow', 'monkey', 'morning', 'muffin',
    'music', 'panda', 'pepper', 'picnic', 'pirate', 'polar', 'puppy', 'river', 'saddle', 'salad',
    'sandbox', 'sunlight', 'tadpole', 'ticket', 'tomato', 'tractor', 'traffic', 'turkey', 'wallet', 'zookeeper'
  ]

  assert.equal(new Set(addedWords).size, 100)

  for (const word of addedWords) {
    const entry = entries.find(candidate => candidate.word === word)

    assert.ok(entry, `expected catalog entry for ${word}`)
    assert.equal(normalizeLetters(entry.enunciationText), word)
    assert.ok(entry.ageBandMax <= 9, `${word} should stay in the lower two bands`)
    assert.ok(entry.tags.length > 0, `${word} should include at least one tag`)
  }
})
