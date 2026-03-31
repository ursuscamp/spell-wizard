import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { DatabaseShape, Profile, RewardDisbursement, RewardEvent, SessionPromptRecord, SessionRecord, WordProgress, WordReviewFlag } from '../../shared/spelling'
import { DEFAULT_DATA_DIRECTORY, resolveDatabasePath } from './runtime-paths.mjs'

const DB_VERSION = 5

let connection: DatabaseSync | undefined
let connectionPath: string | undefined
let writeLock: Promise<void> = Promise.resolve()

interface StorageConfig {
  dataDirectory: string
  databasePath: string
  debugLogging: boolean
}

interface SessionRow {
  id: string
  profile_id: string
  started_at: string
  ended_at: string | null
  words_completed: number
  points_earned: number
  reward_events_json: string
  current_prompt_word_id: string | null
  current_prompt_attempts_json: string | null
  current_prompt_correction_required: number
}

interface RewardDisbursementRow {
  id: string
  profile_id: string
  amount: number
  created_at: string
}

interface SessionPromptHistoryRow {
  session_id: string
  sequence: number
  word_id: string
  attempts_json: string
  completed_at: string | null
  was_correct: number
  awarded_points: number
  correction_required: number
  correction_completed: number
}

const defaultDatabase = (): DatabaseShape => ({
  version: DB_VERSION,
  profiles: [],
  rewards: [],
  rewardDisbursements: [],
  wordProgress: [],
  wordReviewFlags: [],
  sessions: []
})

export async function readDatabase() {
  const db = await ensureConnection()
  return loadDatabase(db)
}

export async function writeDatabase(data: DatabaseShape) {
  return withWriteLock(async () => {
    const db = await ensureConnection()
    runInTransaction(db, () => {
      persistDatabase(db, data)
    })
  })
}

export async function updateDatabase<T>(callback: (db: DatabaseShape) => T | Promise<T>) {
  return withWriteLock(async () => {
    const db = await ensureConnection()

    return runInTransaction(db, async () => {
      const state = loadDatabase(db)
      const result = await callback(state)
      persistDatabase(db, state)
      return result
    })
  })
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

async function ensureConnection() {
  const config = getStorageConfig()
  await mkdir(dirname(config.databasePath), { recursive: true })

  if (!connection || connectionPath !== config.databasePath) {
    connection?.close()
    connection = new DatabaseSync(config.databasePath)
    connectionPath = config.databasePath
    connection.exec('PRAGMA foreign_keys = ON')
    applyMigrations(connection, config)
  }

  return connection
}

function getStorageConfig(): StorageConfig {
  const runtimeConfig = useRuntimeConfig()
  const storageConfig = runtimeConfig.storage ?? {}
  const dataDirectory = storageConfig.dataDirectory ?? DEFAULT_DATA_DIRECTORY

  return {
    dataDirectory: resolve(process.cwd(), dataDirectory),
    databasePath: resolveDatabasePath(process.cwd(), dataDirectory),
    debugLogging: Boolean(storageConfig.debugLogging)
  }
}

function applyMigrations(db: DatabaseSync, config: StorageConfig) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS storage_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  const version = Number(db.prepare('SELECT value FROM storage_meta WHERE key = ?').get('schema_version')?.value ?? '0')

  if (version > DB_VERSION) {
    throw createStorageError(`Database schema version ${version} is newer than supported version ${DB_VERSION}.`)
  }

  if (version < 1) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        birthdate TEXT NOT NULL,
        points_total INTEGER NOT NULL,
        level INTEGER NOT NULL,
        rank_key TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS rewards (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        type TEXT NOT NULL,
        level_reached INTEGER NOT NULL,
        rank_key TEXT,
        robux_awarded INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reward_disbursements (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS word_progress (
        profile_id TEXT NOT NULL,
        word_id TEXT NOT NULL,
        mastery_score REAL NOT NULL,
        adaptive_weight REAL NOT NULL,
        last_seen_at TEXT,
        times_prompted INTEGER NOT NULL,
        times_correct INTEGER NOT NULL,
        average_attempt_index REAL NOT NULL,
        recent_misses INTEGER NOT NULL,
        recent_successes INTEGER NOT NULL,
        PRIMARY KEY (profile_id, word_id),
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        words_completed INTEGER NOT NULL,
        points_earned INTEGER NOT NULL,
        reward_events_json TEXT NOT NULL,
        current_prompt_word_id TEXT,
        current_prompt_attempts_json TEXT,
        current_prompt_correction_required INTEGER NOT NULL,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS session_prompt_history (
        session_id TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        word_id TEXT NOT NULL,
        attempts_json TEXT NOT NULL,
        completed_at TEXT,
        was_correct INTEGER NOT NULL,
        awarded_points INTEGER NOT NULL,
        correction_required INTEGER NOT NULL,
        correction_completed INTEGER NOT NULL,
        PRIMARY KEY (session_id, sequence),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
      CREATE INDEX IF NOT EXISTS idx_rewards_profile_created_at ON rewards(profile_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_reward_disbursements_profile_created_at ON reward_disbursements(profile_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sessions_profile_started_at ON sessions(profile_id, started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_word_progress_profile_misses ON word_progress(profile_id, recent_misses DESC, mastery_score ASC);
    `)

    db.prepare(`
      INSERT INTO storage_meta (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run('schema_version', String(DB_VERSION))

    if (config.debugLogging) {
      console.info(`[storage] initialized sqlite schema v${DB_VERSION} at ${config.databasePath}`)
    }
  }

  if (version < 2) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS word_review_flags (
        word_id TEXT PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'needs-review',
        updated_at TEXT NOT NULL
      );
    `)

    db.prepare(`
      INSERT INTO storage_meta (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run('schema_version', String(DB_VERSION))

    if (config.debugLogging) {
      console.info(`[storage] migrated sqlite schema v${DB_VERSION} at ${config.databasePath}`)
    }
  }

  if (version < 3) {
    const columns = db.prepare('PRAGMA table_info(word_review_flags)').all() as Array<Record<string, unknown>>
    const hasStatusColumn = columns.some(column => String(column.name) === 'status')

    if (!hasStatusColumn) {
      db.exec(`
        ALTER TABLE word_review_flags RENAME TO word_review_flags_legacy;

        CREATE TABLE word_review_flags (
          word_id TEXT PRIMARY KEY,
          status TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        INSERT INTO word_review_flags (word_id, status, updated_at)
        SELECT word_id, 'needs-review', updated_at
        FROM word_review_flags_legacy;

        DROP TABLE word_review_flags_legacy;
      `)
    }

    db.prepare(`
      INSERT INTO storage_meta (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run('schema_version', String(DB_VERSION))

    if (config.debugLogging) {
      console.info(`[storage] migrated sqlite schema v${DB_VERSION} at ${config.databasePath}`)
    }
  }

  if (version < 4) {
    const profileColumns = db.prepare('PRAGMA table_info(profiles)').all() as Array<Record<string, unknown>>
    const hasAvatarColumn = profileColumns.some(column => String(column.name) === 'avatar_uri')

    if (hasAvatarColumn) {
      db.exec(`
        ALTER TABLE profiles RENAME TO profiles_legacy;

        CREATE TABLE profiles (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          birthdate TEXT NOT NULL,
          points_total INTEGER NOT NULL,
          level INTEGER NOT NULL,
          rank_key TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        INSERT INTO profiles (id, name, birthdate, points_total, level, rank_key, created_at, updated_at)
        SELECT id, name, birthdate, points_total, level, rank_key, created_at, updated_at
        FROM profiles_legacy;

        DROP TABLE profiles_legacy;

        CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
      `)
    }

    db.prepare(`
      INSERT INTO storage_meta (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run('schema_version', String(DB_VERSION))

    if (config.debugLogging) {
      console.info(`[storage] migrated sqlite schema v${DB_VERSION} at ${config.databasePath}`)
    }
  }

  if (version < 5) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS reward_disbursements (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_reward_disbursements_profile_created_at ON reward_disbursements(profile_id, created_at DESC);
    `)

    db.prepare(`
      INSERT INTO storage_meta (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run('schema_version', String(DB_VERSION))

    if (config.debugLogging) {
      console.info(`[storage] migrated sqlite schema v${DB_VERSION} at ${config.databasePath}`)
    }
  }
}

function loadDatabase(db: DatabaseSync): DatabaseShape {
  const state = defaultDatabase()

  state.profiles = sortProfiles(db.prepare(`
    SELECT id, name, birthdate, points_total, level, rank_key, created_at, updated_at
    FROM profiles
    ORDER BY created_at ASC
  `).all().map((row: unknown) => mapProfileRow(row as Record<string, unknown>)))

  state.rewards = db.prepare(`
    SELECT id, profile_id, type, level_reached, rank_key, robux_awarded, created_at
    FROM rewards
    ORDER BY created_at ASC
  `).all().map((row: unknown) => mapRewardRow(row as Record<string, unknown>))

  state.rewardDisbursements = db.prepare(`
    SELECT id, profile_id, amount, created_at
    FROM reward_disbursements
    ORDER BY created_at ASC
  `).all().map((row: unknown) => mapRewardDisbursementRow(row as Record<string, unknown>))

  state.wordProgress = db.prepare(`
    SELECT profile_id, word_id, mastery_score, adaptive_weight, last_seen_at, times_prompted, times_correct, average_attempt_index, recent_misses, recent_successes
    FROM word_progress
  `).all().map((row: unknown) => mapWordProgressRow(row as Record<string, unknown>))

  state.wordReviewFlags = db.prepare(`
    SELECT word_id, status, updated_at
    FROM word_review_flags
    ORDER BY updated_at DESC
  `).all().map((row: unknown) => mapWordReviewFlagRow(row as Record<string, unknown>))

  const promptHistoryRows = db.prepare(`
    SELECT session_id, sequence, word_id, attempts_json, completed_at, was_correct, awarded_points, correction_required, correction_completed
    FROM session_prompt_history
    ORDER BY session_id ASC, sequence ASC
  `).all() as SessionPromptHistoryRow[]

  const promptHistoryBySession = new Map<string, SessionPromptRecord[]>()
  for (const row of promptHistoryRows) {
    const promptHistory = promptHistoryBySession.get(row.session_id) ?? []
    promptHistory.push({
      wordId: row.word_id,
      attempts: parseJsonArray(row.attempts_json),
      completedAt: row.completed_at ?? undefined,
      wasCorrect: Boolean(row.was_correct),
      awardedPoints: row.awarded_points,
      correctionRequired: Boolean(row.correction_required),
      correctionCompleted: Boolean(row.correction_completed)
    })
    promptHistoryBySession.set(row.session_id, promptHistory)
  }

  const sessionRows = db.prepare(`
    SELECT id, profile_id, started_at, ended_at, words_completed, points_earned, reward_events_json, current_prompt_word_id, current_prompt_attempts_json, current_prompt_correction_required
    FROM sessions
  `).all() as SessionRow[]

  state.sessions = sessionRows.map((row) => {
    const attempts = row.current_prompt_attempts_json ? parseJsonArray(row.current_prompt_attempts_json) : []
    return {
      id: row.id,
      profileId: row.profile_id,
      startedAt: row.started_at,
      endedAt: row.ended_at ?? undefined,
      wordsCompleted: row.words_completed,
      pointsEarned: row.points_earned,
      rewardEvents: parseRewardEvents(row.reward_events_json),
      promptHistory: promptHistoryBySession.get(row.id) ?? [],
      currentPrompt: row.current_prompt_word_id
        ? {
            wordId: row.current_prompt_word_id,
            attempts,
            correctionRequired: Boolean(row.current_prompt_correction_required)
          }
        : undefined
    }
  })

  return state
}

function persistDatabase(db: DatabaseSync, state: DatabaseShape) {
  db.exec(`
    DELETE FROM word_review_flags;
    DELETE FROM session_prompt_history;
    DELETE FROM sessions;
    DELETE FROM rewards;
    DELETE FROM reward_disbursements;
    DELETE FROM word_progress;
    DELETE FROM profiles;
  `)

  const insertProfile = db.prepare(`
    INSERT INTO profiles (id, name, birthdate, points_total, level, rank_key, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const profile of state.profiles) {
    insertProfile.run(
      profile.id,
      profile.name,
      profile.birthdate,
      profile.pointsTotal,
      profile.level,
      profile.rankKey,
      profile.createdAt,
      profile.updatedAt
    )
  }

  const insertReward = db.prepare(`
    INSERT INTO rewards (id, profile_id, type, level_reached, rank_key, robux_awarded, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  for (const reward of state.rewards) {
    insertReward.run(
      reward.id,
      reward.profileId,
      reward.type,
      reward.levelReached,
      reward.rankKey ?? null,
      reward.robuxAwarded,
      reward.createdAt
    )
  }

  const insertRewardDisbursement = db.prepare(`
    INSERT INTO reward_disbursements (id, profile_id, amount, created_at)
    VALUES (?, ?, ?, ?)
  `)
  for (const entry of state.rewardDisbursements) {
    insertRewardDisbursement.run(
      entry.id,
      entry.profileId,
      entry.amount,
      entry.createdAt
    )
  }

  const insertWordProgress = db.prepare(`
    INSERT INTO word_progress (profile_id, word_id, mastery_score, adaptive_weight, last_seen_at, times_prompted, times_correct, average_attempt_index, recent_misses, recent_successes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const entry of state.wordProgress) {
    insertWordProgress.run(
      entry.profileId,
      entry.wordId,
      entry.masteryScore,
      entry.adaptiveWeight,
      entry.lastSeenAt ?? null,
      entry.timesPrompted,
      entry.timesCorrect,
      entry.averageAttemptIndex,
      entry.recentMisses,
      entry.recentSuccesses
    )
  }

  const insertWordReviewFlag = db.prepare(`
    INSERT INTO word_review_flags (word_id, status, updated_at)
    VALUES (?, ?, ?)
  `)
  for (const entry of state.wordReviewFlags) {
    insertWordReviewFlag.run(
      entry.wordId,
      entry.status,
      entry.updatedAt
    )
  }

  const insertSession = db.prepare(`
    INSERT INTO sessions (id, profile_id, started_at, ended_at, words_completed, points_earned, reward_events_json, current_prompt_word_id, current_prompt_attempts_json, current_prompt_correction_required)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertSessionPrompt = db.prepare(`
    INSERT INTO session_prompt_history (session_id, sequence, word_id, attempts_json, completed_at, was_correct, awarded_points, correction_required, correction_completed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const session of state.sessions) {
    insertSession.run(
      session.id,
      session.profileId,
      session.startedAt,
      session.endedAt ?? null,
      session.wordsCompleted,
      session.pointsEarned,
      JSON.stringify(session.rewardEvents),
      session.currentPrompt?.wordId ?? null,
      session.currentPrompt ? JSON.stringify(session.currentPrompt.attempts) : null,
      session.currentPrompt?.correctionRequired ? 1 : 0
    )

    session.promptHistory.forEach((prompt, index) => {
      insertSessionPrompt.run(
        session.id,
        index,
        prompt.wordId,
        JSON.stringify(prompt.attempts),
        prompt.completedAt ?? null,
        prompt.wasCorrect ? 1 : 0,
        prompt.awardedPoints,
        prompt.correctionRequired ? 1 : 0,
        prompt.correctionCompleted ? 1 : 0
      )
    })
  }

  db.prepare(`
    INSERT INTO storage_meta (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run('schema_version', String(DB_VERSION))
}

async function withWriteLock<T>(callback: () => Promise<T>) {
  const previousLock = writeLock
  let releaseLock = () => {}
  writeLock = new Promise<void>((resolve) => {
    releaseLock = resolve
  })

  await previousLock

  try {
    return await callback()
  }
  finally {
    releaseLock()
  }
}

function runInTransaction<T>(db: DatabaseSync, callback: () => T): T {
  db.exec('BEGIN IMMEDIATE')

  try {
    const result = callback()

    if (result instanceof Promise) {
      return result.then((value) => {
        db.exec('COMMIT')
        return value
      }).catch((error) => {
        db.exec('ROLLBACK')
        throw error
      }) as T
    }

    db.exec('COMMIT')
    return result
  }
  catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function mapProfileRow(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    name: String(row.name),
    birthdate: String(row.birthdate),
    pointsTotal: Number(row.points_total),
    level: Number(row.level),
    rankKey: String(row.rank_key),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  }
}

function mapRewardRow(row: Record<string, unknown>): RewardEvent {
  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    type: row.type as RewardEvent['type'],
    levelReached: Number(row.level_reached),
    rankKey: row.rank_key ? String(row.rank_key) : undefined,
    robuxAwarded: Number(row.robux_awarded),
    createdAt: String(row.created_at)
  }
}

function mapRewardDisbursementRow(row: Record<string, unknown>): RewardDisbursement {
  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    amount: Number(row.amount),
    createdAt: String(row.created_at)
  }
}

function mapWordProgressRow(row: Record<string, unknown>): WordProgress {
  return {
    profileId: String(row.profile_id),
    wordId: String(row.word_id),
    masteryScore: Number(row.mastery_score),
    adaptiveWeight: Number(row.adaptive_weight),
    lastSeenAt: row.last_seen_at ? String(row.last_seen_at) : undefined,
    timesPrompted: Number(row.times_prompted),
    timesCorrect: Number(row.times_correct),
    averageAttemptIndex: Number(row.average_attempt_index),
    recentMisses: Number(row.recent_misses),
    recentSuccesses: Number(row.recent_successes)
  }
}

function mapWordReviewFlagRow(row: Record<string, unknown>): WordReviewFlag {
  return {
    wordId: String(row.word_id),
    status: row.status === 'reviewed' ? 'reviewed' : 'needs-review',
    updatedAt: String(row.updated_at)
  }
}

function parseJsonArray(value: string) {
  const parsed = JSON.parse(value) as unknown
  return Array.isArray(parsed) ? parsed.map(item => String(item)) : []
}

function parseRewardEvents(value: string) {
  const parsed = JSON.parse(value) as RewardEvent[]
  return Array.isArray(parsed) ? parsed : []
}

function createStorageError(message: string) {
  return createError({ statusCode: 500, statusMessage: message })
}
