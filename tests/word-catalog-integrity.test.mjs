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

  assert.equal(entries.length, 537)
  assert.equal(uniqueWords.size, entries.length)
  assert.equal(bandCounts.get('5-7-1'), 255)
  assert.equal(bandCounts.get('7-9-2'), 213)
  assert.equal(bandCounts.get('9-12-3'), 69)
})

test('word catalog stays alphabetized within each age band and uses valid enunciation text', async () => {
  const source = await readFile(join(root, 'shared/word-catalog.ts'), 'utf8')
  const entries = parseEntries(source)
  const groups = new Map()

  for (const entry of entries) {
    assert.equal(normalizeLetters(entry.enunciationText), entry.word)

    const key = `${entry.ageBandMin}-${entry.ageBandMax}-${entry.difficulty}`
    const group = groups.get(key) ?? []
    group.push(entry.word)
    groups.set(key, group)
  }

  for (const words of groups.values()) {
    assert.deepEqual(words, [...words].sort())
  }
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

test('latest batch adds 100 unique words with only 10 in the upper band', async () => {
  const source = await readFile(join(root, 'shared/word-catalog.ts'), 'utf8')
  const entries = parseEntries(source)
  const addedWords = [
    'ankle', 'apron', 'badge', 'barn', 'berry', 'boots', 'bottle', 'bunny', 'cabin', 'cactus',
    'candy', 'cheese', 'chick', 'chimney', 'clown', 'cookie', 'cottage', 'cow', 'crayon', 'crown',
    'desk', 'donkey', 'eagle', 'earth', 'egg', 'elbow', 'engine', 'fence', 'field', 'fire',
    'flashlight', 'ghost', 'honey', 'igloo', 'insect', 'jelly', 'koala', 'lizard', 'lunch', 'mirror',
    'nail', 'notebook', 'owl', 'pancake', 'parrot', 'artist', 'baboon', 'bedroom', 'birthday', 'blossom',
    'cartoon', 'cheetah', 'chicken', 'cupcake', 'curtain', 'daisy', 'desert', 'doctor', 'drawer', 'drizzle',
    'fairy', 'fever', 'flamingo', 'ginger', 'giraffe', 'guitar', 'harbor', 'holiday', 'jigsaw', 'kangaroo',
    'ketchup', 'ladybug', 'laundry', 'mailbox', 'mascot', 'misty', 'otter', 'pumpkin', 'raincoat', 'rowboat',
    'seesaw', 'shiny', 'teapot', 'teaspoon', 'trombone', 'volcano', 'walrus', 'willow', 'yogurt', 'zipper',
    'astronaut', 'avalanche', 'binoculars', 'dinosaur', 'equation', 'geography', 'horizon', 'microscope', 'president', 'volunteer'
  ]

  assert.equal(new Set(addedWords).size, 100)

  let upperBandCount = 0

  for (const word of addedWords) {
    const entry = entries.find(candidate => candidate.word === word)

    assert.ok(entry, `expected catalog entry for ${word}`)
    assert.equal(normalizeLetters(entry.enunciationText), word)
    assert.ok(entry.tags.length > 0, `${word} should include at least one tag`)

    if (entry.ageBandMax === 12) {
      upperBandCount += 1
    }
    else {
      assert.ok(entry.ageBandMax <= 9, `${word} should stay in the lower two bands unless selected for the upper band`)
    }
  }

  assert.equal(upperBandCount, 10)
})

test('everyday sentence-building words are present in the catalog', async () => {
  const source = await readFile(join(root, 'shared/word-catalog.ts'), 'utf8')
  const entries = parseEntries(source)
  const addedWords = [
    'a', 'all', 'am', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by',
    'can', 'come', 'could', 'did', 'do', 'does', 'get', 'go', 'had', 'has', 'have', 'is',
    'make', 'said', 'say', 'see', 'use', 'was', 'were', 'will', 'would',
    'he', 'her', 'here', 'him', 'his', 'i', 'it', 'its', 'me', 'my', 'she', 'they', 'them', 'we', 'who', 'you', 'your',
    'people', 'children', 'boy', 'man', 'mother',
    'after', 'again', 'around', 'away', 'before', 'down', 'for', 'from', 'if', 'in', 'into', 'of', 'on', 'or', 'out', 'over',
    'than', 'then', 'there', 'through', 'to', 'under', 'up', 'when', 'where',
    'big', 'both', 'first', 'good', 'great', 'little', 'long', 'many', 'more', 'much', 'old', 'only', 'other', 'right', 'same', 'small', 'three', 'two', 'very',
    'ask', 'call', 'eat', 'find', 'found', 'give', 'help', 'home', 'just', 'know', 'look', 'made', 'must', 'name', 'need', 'put', 'read', 'take', 'tell', 'think', 'want', 'well', 'went', 'why', 'work', 'write', 'world',
    'any', 'like', 'no', 'not', 'now', 'one', 'our', 'some', 'that', 'the', 'their', 'these', 'this', 'those', 'what', 'which'
  ]

  assert.equal(new Set(addedWords).size, 142)

  for (const word of addedWords) {
    const entry = entries.find(candidate => candidate.word === word)

    assert.ok(entry, `expected catalog entry for ${word}`)
    assert.equal(normalizeLetters(entry.enunciationText), word)
    assert.ok(entry.ageBandMax <= 9, `${word} should stay in the lower two bands`)
    assert.ok(entry.tags.length > 0, `${word} should include at least one tag`)
  }
})
