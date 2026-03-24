import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { spawn } from 'node:child_process'

async function createTestContext() {
  const directory = await mkdtemp(join(tmpdir(), 'spell-wizard-'))
  const databasePath = join(directory, 'spell-wizard.sqlite')
  const port = 3200 + Math.floor(Math.random() * 1000)
  const server = spawn('node', ['.output/server/index.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      NUXT_STORAGE_DATABASE_PATH: databasePath
    },
    stdio: 'ignore'
  })

  const baseUrl = `http://127.0.0.1:${port}`
  await waitForServer(baseUrl)

  return {
    baseUrl,
    databasePath,
    async cleanup() {
      server.kill('SIGTERM')
      await new Promise((resolve) => {
        server.once('exit', () => resolve())
      })
      await rm(directory, { recursive: true, force: true })
    }
  }
}

async function waitForServer(baseUrl) {
  const deadline = Date.now() + 15000

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/profiles`)
      if (response.ok) {
        return
      }
    }
    catch {
    }

    await new Promise(resolve => setTimeout(resolve, 150))
  }

  throw new Error(`Timed out waiting for server at ${baseUrl}`)
}

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers ?? {})
    }
  })

  const text = await response.text()
  const body = text ? JSON.parse(text) : null

  return { response, body }
}

test('bootstraps sqlite schema on first server access', async () => {
  const context = await createTestContext()

  try {
    const { response, body } = await requestJson(context.baseUrl, '/api/profiles')
    assert.equal(response.status, 200)
    assert.deepEqual(body, [])

    const db = new DatabaseSync(context.databasePath)
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all().map(row => row.name)
    const version = db.prepare('SELECT value FROM storage_meta WHERE key = ?').get('schema_version')
    const profileColumns = db.prepare('PRAGMA table_info(profiles)').all().map(row => row.name)

    assert.deepEqual(tables, [
      'profiles',
      'rewards',
      'session_prompt_history',
      'sessions',
      'storage_meta',
      'word_progress',
      'word_review_flags'
    ])
    assert.equal(version.value, '4')
    assert.equal(profileColumns.includes('avatar_uri'), false)
    db.close()
  }
  finally {
    await context.cleanup()
  }
})

test('persists profile and session flows in sqlite', async () => {
  const context = await createTestContext()

  try {
    const created = await requestJson(context.baseUrl, '/api/profiles', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Luna',
        birthdate: '2017-04-12'
      })
    })

    assert.equal(created.response.status, 200)
    assert.equal(created.body.name, 'Luna')

    const updated = await requestJson(context.baseUrl, `/api/profiles/${created.body.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Luna Star'
      })
    })

    assert.equal(updated.response.status, 200)
    assert.equal(updated.body.name, 'Luna Star')

    const session = await requestJson(context.baseUrl, '/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ profileId: created.body.id })
    })

    assert.equal(session.response.status, 200)
    assert.equal(session.body.profileId, created.body.id)

    const promptWord = session.body.currentPrompt.wordId
    assert.ok(promptWord)

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await requestJson(context.baseUrl, `/api/sessions/${session.body.sessionId}/attempts`, {
        method: 'POST',
        body: JSON.stringify({ answer: 'wrong-answer' })
      })

      assert.equal(result.response.status, 200)
      if (attempt < 2) {
        assert.equal(result.body.status, 'incorrect')
      }
      else {
        assert.equal(result.body.status, 'correction-required')
        assert.equal(result.body.correctSpelling, promptWord)
      }
    }

    const correction = await requestJson(context.baseUrl, `/api/sessions/${session.body.sessionId}/correction`, {
      method: 'POST',
      body: JSON.stringify({ answer: promptWord })
    })

    assert.equal(correction.response.status, 200)
    assert.equal(correction.body.status, 'correction-complete')

    const ended = await requestJson(context.baseUrl, `/api/sessions/${session.body.sessionId}/end`, {
      method: 'POST',
      body: JSON.stringify({})
    })

    assert.equal(ended.response.status, 200)
    assert.equal(ended.body.wordsCompleted, 1)

    const dashboard = await requestJson(context.baseUrl, `/api/profiles/${created.body.id}/dashboard`)
    assert.equal(dashboard.response.status, 200)
    assert.equal(dashboard.body.profile.name, 'Luna Star')
    assert.equal(dashboard.body.recentSessions.length, 1)
    assert.equal(dashboard.body.difficultWords[0].word, promptWord)

    const history = await requestJson(context.baseUrl, `/api/profiles/${created.body.id}/history`)
    assert.equal(history.response.status, 200)
    assert.equal(history.body.sessions.length, 1)

    const listed = await requestJson(context.baseUrl, '/api/profiles')
    assert.equal(listed.response.status, 200)
    assert.equal(listed.body.length, 1)

    const deleted = await requestJson(context.baseUrl, `/api/profiles/${created.body.id}`, {
      method: 'DELETE'
    })
    assert.equal(deleted.response.status, 200)
    assert.deepEqual(deleted.body, { success: true })

    const afterDelete = await requestJson(context.baseUrl, '/api/profiles')
    assert.equal(afterDelete.response.status, 200)
    assert.deepEqual(afterDelete.body, [])
  }
  finally {
    await context.cleanup()
  }
})

test('admin words endpoint is read-only and exposes review metadata', async () => {
  const context = await createTestContext()

  try {
    const before = await requestJson(context.baseUrl, '/api/profiles')
    assert.equal(before.response.status, 200)
    assert.deepEqual(before.body, [])

    const words = await requestJson(context.baseUrl, '/api/admin/words')
    assert.equal(words.response.status, 200)
    assert.ok(words.body.length > 0)
    assert.equal(words.body[0].id, words.body[0].word)
    assert.equal(typeof words.body[0].difficulty, 'number')
    assert.equal(Array.isArray(words.body[0].tags), true)
    assert.equal(words.body[0].reviewStatus, 'unreviewed')
    assert.equal('canEnunciate' in words.body[0], false)

    const oneSyllableWord = words.body.find(entry => entry.word === 'blue')
    const multiSyllableWord = words.body.find(entry => entry.word === 'robot')

    assert.ok(oneSyllableWord)
    assert.ok(multiSyllableWord)

    const flagged = await requestJson(context.baseUrl, `/api/admin/words/${multiSyllableWord.id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewStatus: 'needs-review' })
    })
    assert.equal(flagged.response.status, 200)
    assert.deepEqual(flagged.body, { wordId: multiSyllableWord.id, reviewStatus: 'needs-review' })

    const afterFlag = await requestJson(context.baseUrl, '/api/admin/words')
    const flaggedWord = afterFlag.body.find(entry => entry.id === multiSyllableWord.id)
    assert.equal(flaggedWord.reviewStatus, 'needs-review')

    const cleared = await requestJson(context.baseUrl, '/api/admin/words/reviewed', {
      method: 'POST',
      body: JSON.stringify({})
    })
    assert.equal(cleared.response.status, 200)
    assert.deepEqual(cleared.body, { updatedCount: 1 })

    const afterClear = await requestJson(context.baseUrl, '/api/admin/words')
    const clearedWord = afterClear.body.find(entry => entry.id === multiSyllableWord.id)
    assert.equal(clearedWord.reviewStatus, 'reviewed')

    const reviewed = await requestJson(context.baseUrl, `/api/admin/words/${oneSyllableWord.id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewStatus: 'reviewed' })
    })
    assert.equal(reviewed.response.status, 200)
    assert.deepEqual(reviewed.body, { wordId: oneSyllableWord.id, reviewStatus: 'reviewed' })

    const afterReviewed = await requestJson(context.baseUrl, '/api/admin/words')
    const reviewedWord = afterReviewed.body.find(entry => entry.id === oneSyllableWord.id)
    assert.equal(reviewedWord.reviewStatus, 'reviewed')

    const after = await requestJson(context.baseUrl, '/api/profiles')
    assert.equal(after.response.status, 200)
    assert.deepEqual(after.body, [])

    const db = new DatabaseSync(context.databasePath)
    const profileCount = db.prepare('SELECT COUNT(*) AS count FROM profiles').get().count
    const sessionCount = db.prepare('SELECT COUNT(*) AS count FROM sessions').get().count
    const rewardCount = db.prepare('SELECT COUNT(*) AS count FROM rewards').get().count
    const progressCount = db.prepare('SELECT COUNT(*) AS count FROM word_progress').get().count
    const reviewFlagCount = db.prepare('SELECT COUNT(*) AS count FROM word_review_flags').get().count
    const reviewedStatusCount = db.prepare("SELECT COUNT(*) AS count FROM word_review_flags WHERE status = 'reviewed'").get().count

    assert.equal(profileCount, 0)
    assert.equal(sessionCount, 0)
    assert.equal(rewardCount, 0)
    assert.equal(progressCount, 0)
    assert.equal(reviewFlagCount, 2)
    assert.equal(reviewedStatusCount, 2)
    db.close()
  }
  finally {
    await context.cleanup()
  }
})
