import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type { DatabaseShape, Profile, SessionRecord, WordProgress } from '../../shared/spelling'

const DATA_PATH = resolve(process.cwd(), '.data/spelling-wizard-db.json')
const DB_VERSION = 1

const defaultDatabase = (): DatabaseShape => ({
  version: DB_VERSION,
  profiles: [],
  rewards: [],
  wordProgress: [],
  sessions: []
})

export async function readDatabase() {
  try {
    const raw = await readFile(DATA_PATH, 'utf8')
    const parsed = JSON.parse(raw) as DatabaseShape
    return migrateDatabase(parsed)
  }
  catch {
    const empty = defaultDatabase()
    await writeDatabase(empty)
    return empty
  }
}

export async function writeDatabase(db: DatabaseShape) {
  await mkdir(dirname(DATA_PATH), { recursive: true })
  await writeFile(DATA_PATH, JSON.stringify(db, null, 2), 'utf8')
}

export async function updateDatabase<T>(callback: (db: DatabaseShape) => T | Promise<T>) {
  const db = await readDatabase()
  const result = await callback(db)
  await writeDatabase(db)
  return result
}

function migrateDatabase(parsed: DatabaseShape): DatabaseShape {
  const db = { ...defaultDatabase(), ...parsed }
  db.version = DB_VERSION
  db.profiles = db.profiles ?? []
  db.rewards = db.rewards ?? []
  db.wordProgress = db.wordProgress ?? []
  db.sessions = (db.sessions ?? []).map(session => ({
    wordsCompleted: 0,
    pointsEarned: 0,
    rewardEvents: [],
    promptHistory: [],
    ...session
  }))
  return db
}

export function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function sortProfiles(profiles: Profile[]) {
  return [...profiles].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function sortSessions(sessions: SessionRecord[]) {
  return [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

export function getWordProgress(profileId: string, wordId: string, wordProgress: WordProgress[]) {
  return wordProgress.find(entry => entry.profileId === profileId && entry.wordId === wordId)
}

export function upsertWordProgress(entry: WordProgress, wordProgress: WordProgress[]) {
  const index = wordProgress.findIndex(item => item.profileId === entry.profileId && item.wordId === entry.wordId)

  if (index >= 0) {
    wordProgress[index] = entry
  }
  else {
    wordProgress.push(entry)
  }
}
