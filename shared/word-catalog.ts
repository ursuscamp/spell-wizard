import rawEntries from './word-catalog.json'
import type { WordCatalogEntry } from './spelling'

interface RawWordCatalogEntry {
  word: string
  exampleSentence: string
  ageBandMin: number
  ageBandMax: number
  difficulty: number
  tags: string[]
}

const entries = rawEntries as RawWordCatalogEntry[]

export const WORD_CATALOG: WordCatalogEntry[] = entries.map((entry) => ({
  id: entry.word,
  word: entry.word,
  normalizedWord: entry.word.toLowerCase(),
  exampleSentence: entry.exampleSentence,
  ageBandMin: entry.ageBandMin,
  ageBandMax: entry.ageBandMax,
  difficulty: entry.difficulty,
  tags: [...entry.tags]
}))
