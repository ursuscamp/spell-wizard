import assert from 'node:assert/strict'
import test from 'node:test'
import { getForcedReboundWordId, getReboundQueue } from '../server/utils/rebound.mjs'

function prompt(wordId, overrides = {}) {
  return {
    wordId,
    attempts: [],
    completedAt: '2026-03-25T00:00:00.000Z',
    wasCorrect: true,
    awardedPoints: 1,
    correctionRequired: false,
    correctionCompleted: false,
    ...overrides
  }
}

test('a total miss stays queued until the word reappears or the five-prompt deadline hits', () => {
  const history = [
    prompt('alpha', {
      wasCorrect: false,
      awardedPoints: 0,
      correctionRequired: true,
      correctionCompleted: true
    }),
    prompt('beta'),
    prompt('gamma'),
    prompt('delta'),
    prompt('epsilon')
  ]

  assert.deepEqual(getReboundQueue(history), [
    {
      wordId: 'alpha',
      dueCompletedCount: 5
    }
  ])
  assert.equal(getForcedReboundWordId(history), 'alpha')
})

test('a rebound entry disappears once the same word is seen again within the window', () => {
  const history = [
    prompt('alpha', {
      wasCorrect: false,
      awardedPoints: 0,
      correctionRequired: true,
      correctionCompleted: true
    }),
    prompt('beta'),
    prompt('gamma'),
    prompt('alpha')
  ]

  assert.deepEqual(getReboundQueue(history), [])
  assert.equal(getForcedReboundWordId(history), null)
})

test('ordinary completed prompts do not enter the rebound path and restored history keeps the same state', () => {
  const history = [
    prompt('alpha'),
    prompt('beta'),
    prompt('gamma', {
      wasCorrect: false,
      awardedPoints: 0,
      correctionRequired: false,
      correctionCompleted: false
    })
  ]
  const restoredHistory = JSON.parse(JSON.stringify(history))

  assert.deepEqual(getReboundQueue(history), [])
  assert.deepEqual(getReboundQueue(restoredHistory), [])
  assert.equal(getForcedReboundWordId(restoredHistory), null)
})
