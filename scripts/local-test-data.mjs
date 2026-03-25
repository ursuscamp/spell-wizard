import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { DEFAULT_DATA_DIRECTORY, resolveDatabasePath as resolveConfiguredDatabasePath } from '../server/utils/runtime-paths.mjs'

const DB_VERSION = 4
const LEVEL_POINT_THRESHOLD = 100
const LEVEL_REWARD_ROBUX = 100
const RANK_REWARD_ROBUX = 300
const RANK_LADDER = [
  'Spark',
  'Scroll Keeper',
  'Rune Reader',
  'Spell Scribe',
  'Charm Caster',
  'Enchanter',
  'Wizard'
]

const SEEDED_PROFILE_PREFIX = 'seed_rank_edge_'
const SAMPLE_WORD_IDS = [
  'apple',
  'boat',
  'cloud',
  'friend',
  'garden',
  'planet',
  'rabbit',
  'robot',
  'dragon',
  'science',
  'umbrella',
  'wizard'
]

const PROFILE_BLUEPRINTS = [
  { slug: 'spark', name: 'Ava', birthdate: '2018-05-14' },
  { slug: 'level-two-tester', name: 'Ivy', birthdate: '2018-09-03', targetLevel: 2 },
  { slug: 'scroll-keeper', name: 'Noah', birthdate: '2017-11-02' },
  { slug: 'rune-reader', name: 'Mia', birthdate: '2016-08-21' },
  { slug: 'spell-scribe', name: 'Leo', birthdate: '2015-03-09' },
  { slug: 'charm-caster', name: 'Zoe', birthdate: '2014-12-17' },
  { slug: 'enchanter', name: 'Ethan', birthdate: '2013-06-25' }
]

export function resolveDatabasePath() {
  return resolveDatabasePathFromDataDirectory()
}

function resolveDatabasePathFromDataDirectory() {
  return resolveConfiguredDatabasePath(process.cwd(), process.env.NUXT_STORAGE_DATA_DIRECTORY ?? DEFAULT_DATA_DIRECTORY)
}

export async function resetDatabase(databasePath = resolveDatabasePath()) {
  await mkdir(dirname(databasePath), { recursive: true })

  const db = new DatabaseSync(databasePath)

  try {
    db.exec('PRAGMA foreign_keys = ON')
    applySchema(db)
    clearAllData(db)
  }
  finally {
    db.close()
  }
}

export async function seedRankEdgeProfiles(databasePath = resolveDatabasePath()) {
  await mkdir(dirname(databasePath), { recursive: true })

  const db = new DatabaseSync(databasePath)

  try {
    db.exec('PRAGMA foreign_keys = ON')
    applySchema(db)
    clearExistingSeedData(db)

    db.exec('BEGIN IMMEDIATE')

    try {
      const profileInsert = db.prepare(`
        INSERT INTO profiles (id, name, birthdate, points_total, level, rank_key, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      const rewardInsert = db.prepare(`
        INSERT INTO rewards (id, profile_id, type, level_reached, rank_key, robux_awarded, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      const wordProgressInsert = db.prepare(`
        INSERT INTO word_progress (profile_id, word_id, mastery_score, adaptive_weight, last_seen_at, times_prompted, times_correct, average_attempt_index, recent_misses, recent_successes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      const sessionInsert = db.prepare(`
        INSERT INTO sessions (id, profile_id, started_at, ended_at, words_completed, points_earned, reward_events_json, current_prompt_word_id, current_prompt_attempts_json, current_prompt_correction_required)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      const sessionPromptInsert = db.prepare(`
        INSERT INTO session_prompt_history (session_id, sequence, word_id, attempts_json, completed_at, was_correct, awarded_points, correction_required, correction_completed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      PROFILE_BLUEPRINTS.forEach((blueprint, index) => {
        const profile = buildProfileSeed(blueprint, index)

        profileInsert.run(
          profile.profileRow.id,
          profile.profileRow.name,
          profile.profileRow.birthdate,
          profile.profileRow.pointsTotal,
          profile.profileRow.level,
          profile.profileRow.rankKey,
          profile.profileRow.createdAt,
          profile.profileRow.updatedAt
        )

        for (const reward of profile.rewards) {
          rewardInsert.run(
            reward.id,
            reward.profileId,
            reward.type,
            reward.levelReached,
            reward.rankKey ?? null,
            reward.robuxAwarded,
            reward.createdAt
          )
        }

        for (const progress of profile.wordProgress) {
          wordProgressInsert.run(
            progress.profileId,
            progress.wordId,
            progress.masteryScore,
            progress.adaptiveWeight,
            progress.lastSeenAt,
            progress.timesPrompted,
            progress.timesCorrect,
            progress.averageAttemptIndex,
            progress.recentMisses,
            progress.recentSuccesses
          )
        }

        for (const session of profile.sessions) {
          sessionInsert.run(
            session.id,
            session.profileId,
            session.startedAt,
            session.endedAt,
            session.wordsCompleted,
            session.pointsEarned,
            JSON.stringify(session.rewardEvents),
            null,
            null,
            0
          )

          session.promptHistory.forEach((prompt, promptIndex) => {
            sessionPromptInsert.run(
              session.id,
              promptIndex,
              prompt.wordId,
              JSON.stringify(prompt.attempts),
              prompt.completedAt,
              prompt.wasCorrect ? 1 : 0,
              prompt.awardedPoints,
              prompt.correctionRequired ? 1 : 0,
              prompt.correctionCompleted ? 1 : 0
            )
          })
        }
      })

      db.exec('COMMIT')
    }
    catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
  }
  finally {
    db.close()
  }

  return {
    databasePath,
    profileCount: PROFILE_BLUEPRINTS.length
  }
}

function applySchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS storage_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

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

    CREATE TABLE IF NOT EXISTS word_review_flags (
      word_id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL
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
    CREATE INDEX IF NOT EXISTS idx_sessions_profile_started_at ON sessions(profile_id, started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_word_progress_profile_misses ON word_progress(profile_id, recent_misses DESC, mastery_score ASC);
  `)

  db.prepare(`
    INSERT INTO storage_meta (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run('schema_version', String(DB_VERSION))
}

function clearExistingSeedData(db) {
  db.prepare('DELETE FROM profiles WHERE id LIKE ?').run(`${SEEDED_PROFILE_PREFIX}%`)
}

function clearAllData(db) {
  db.exec('BEGIN IMMEDIATE')

  try {
    db.exec(`
      DELETE FROM session_prompt_history;
      DELETE FROM sessions;
      DELETE FROM word_review_flags;
      DELETE FROM rewards;
      DELETE FROM word_progress;
      DELETE FROM profiles;
    `)

    db.exec('COMMIT')
  }
  catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function buildProfileSeed(blueprint, index) {
  const targetLevel = blueprint.targetLevel ?? ((index + 1) * 3)
  const currentLevel = targetLevel - 1
  const pointsTotal = (targetLevel * LEVEL_POINT_THRESHOLD) - 1
  const currentRank = getRankForLevel(currentLevel)
  const createdAt = isoAt(-28 + (index * 3), 9)
  const updatedAt = isoAt(-1, 16 + index)
  const profileId = `${SEEDED_PROFILE_PREFIX}${blueprint.slug}`
  const sessionPointTotals = splitPoints(pointsTotal, [0.18, 0.22, 0.27, 0.33])
  const rewardEvents = []
  let pointsBeforeSession = 0

  const sessions = sessionPointTotals.map((sessionPoints, sessionIndex) => {
    const startedAt = isoAt(-10 + sessionIndex + index, 10 + sessionIndex)
    const endedAt = isoAt(-10 + sessionIndex + index, 10 + sessionIndex, 35)
    const sessionRewards = buildRewardEventsForRange({
      profileId,
      startPoints: pointsBeforeSession,
      endPoints: pointsBeforeSession + sessionPoints,
      sessionIndex,
      profileIndex: index
    })

    rewardEvents.push(...sessionRewards)

    const promptHistory = buildPromptHistory({
      totalPoints: sessionPoints,
      profileIndex: index,
      sessionIndex,
      startedAt,
      endedAt
    })

    pointsBeforeSession += sessionPoints

    return {
      id: `${profileId}_session_${sessionIndex + 1}`,
      profileId,
      startedAt,
      endedAt,
      wordsCompleted: promptHistory.length,
      pointsEarned: sessionPoints,
      rewardEvents: sessionRewards,
      promptHistory
    }
  })

  const difficultWordOffset = index * 2
  const wordProgress = [0, 1, 2, 3].map((offset) => ({
    profileId,
    wordId: SAMPLE_WORD_IDS[(difficultWordOffset + offset) % SAMPLE_WORD_IDS.length],
    masteryScore: Number((1.2 + (offset * 0.45)).toFixed(2)),
    adaptiveWeight: Number((2.8 - (offset * 0.2)).toFixed(2)),
    lastSeenAt: isoAt(-offset - 1, 15),
    timesPrompted: 6 + offset,
    timesCorrect: 3 + offset,
    averageAttemptIndex: Number((2.2 + (offset * 0.15)).toFixed(2)),
    recentMisses: Math.max(4 - offset, 1),
    recentSuccesses: 2 + offset
  }))

  return {
    profileRow: {
      id: profileId,
      name: blueprint.name,
      birthdate: blueprint.birthdate,
      pointsTotal,
      level: currentLevel,
      rankKey: currentRank.key,
      createdAt,
      updatedAt
    },
    rewards: rewardEvents,
    wordProgress,
    sessions
  }
}

function splitPoints(totalPoints, weights) {
  const raw = weights.map(weight => Math.floor(totalPoints * weight))
  const assigned = raw.reduce((sum, value) => sum + value, 0)
  raw[raw.length - 1] += totalPoints - assigned
  return raw
}

function buildRewardEventsForRange({ profileId, startPoints, endPoints, sessionIndex, profileIndex }) {
  const events = []
  const startingLevel = getLevelFromPoints(startPoints)
  const endingLevel = getLevelFromPoints(endPoints)

  for (let level = startingLevel + 1; level <= endingLevel; level += 1) {
    const rank = getRankForLevel(level)
    const isRankLevel = level > 0 && level % 3 === 0

    events.push({
      id: `${profileId}_reward_${level}`,
      profileId,
      type: isRankLevel ? 'rank-up' : 'level-up',
      levelReached: level,
      rankKey: isRankLevel ? rank.key : undefined,
      robuxAwarded: isRankLevel ? RANK_REWARD_ROBUX : LEVEL_REWARD_ROBUX,
      createdAt: isoAt(-10 + sessionIndex + profileIndex, 10 + sessionIndex, Math.min(10 + level, 55))
    })
  }

  return events
}

function buildPromptHistory({ totalPoints, profileIndex, sessionIndex, startedAt, endedAt }) {
  const awardedPoints = []
  let remaining = totalPoints

  while (remaining > 0) {
    const nextAward = remaining % 2 === 0 ? 2 : Math.min(3, remaining)
    awardedPoints.push(nextAward)
    remaining -= nextAward
  }

  const sessionStart = new Date(startedAt).getTime()
  const sessionEnd = new Date(endedAt).getTime()
  const step = awardedPoints.length > 1
    ? Math.max(Math.floor((sessionEnd - sessionStart) / awardedPoints.length), 1)
    : 1

  return awardedPoints.map((points, promptIndex) => {
    const wordId = SAMPLE_WORD_IDS[(profileIndex + sessionIndex + promptIndex) % SAMPLE_WORD_IDS.length]
    const completedAt = new Date(sessionStart + (step * promptIndex)).toISOString()

    return {
      wordId,
      attempts: buildAttempts(wordId, points),
      completedAt,
      wasCorrect: true,
      awardedPoints: points,
      correctionRequired: false,
      correctionCompleted: false
    }
  })
}

function buildAttempts(wordId, pointsAwarded) {
  const attemptsNeeded = Math.max(4 - pointsAwarded, 1)
  const attempts = []

  for (let index = 1; index < attemptsNeeded; index += 1) {
    attempts.push(`${wordId}-${index}`)
  }

  attempts.push(wordId)
  return attempts
}

function getLevelFromPoints(pointsTotal) {
  return Math.floor(pointsTotal / LEVEL_POINT_THRESHOLD)
}

function getRankForLevel(level) {
  const index = Math.min(Math.floor(level / 3), RANK_LADDER.length - 1)
  return { index, key: RANK_LADDER[index] }
}

function isoAt(dayOffset, hour, minute = 0) {
  const value = new Date()
  value.setUTCHours(hour, minute, 0, 0)
  value.setUTCDate(value.getUTCDate() + dayOffset)
  return value.toISOString()
}
