import assert from 'node:assert/strict'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { spawn } from 'node:child_process'

async function createTestContext() {
  const directory = await mkdtemp(join(tmpdir(), 'spell-wizard-tts-'))
  const databasePath = join(directory, 'spell-wizard.sqlite')
  const cacheDirectory = join(directory, 'tts-cache')
  const port = 4200 + Math.floor(Math.random() * 1000)
  const server = spawn('node', ['.output/server/index.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      NUXT_STORAGE_DATABASE_PATH: databasePath,
      NUXT_TTS_CACHE_DIRECTORY: cacheDirectory,
      NUXT_TTS_MOCK_ENABLED: 'true'
    },
    stdio: 'ignore'
  })

  const baseUrl = `http://127.0.0.1:${port}`
  await waitForServer(baseUrl)

  return {
    baseUrl,
    cacheDirectory,
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

test('tts voices endpoint returns english voices only', async () => {
  const context = await createTestContext()

  try {
    const response = await fetch(`${context.baseUrl}/api/tts/voices`)
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.ok(body.length > 0)
    assert.equal(body.every(voice => voice.lang.toLowerCase().startsWith('en')), true)
    assert.equal(body.some(voice => voice.default === true), true)
  }
  finally {
    await context.cleanup()
  }
})

test('tts endpoint caches normal playback on disk and bypasses cache for tester requests', async () => {
  const context = await createTestContext()

  try {
    const requestBody = {
      text: 'robot',
      mode: 'standard'
    }

    const firstResponse = await fetch(`${context.baseUrl}/api/tts`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    const firstAudio = Buffer.from(await firstResponse.arrayBuffer())

    assert.equal(firstResponse.status, 200)
    assert.equal(firstResponse.headers.get('content-type'), 'audio/mpeg')
    assert.equal(firstResponse.headers.get('x-spell-wizard-tts-cache'), 'miss')
    assert.match(firstAudio.toString(), /mock-tts:standard:/)

    const cachedFilesAfterFirstRequest = await readdir(context.cacheDirectory)
    assert.equal(cachedFilesAfterFirstRequest.length, 2)

    const secondResponse = await fetch(`${context.baseUrl}/api/tts`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    const secondAudio = Buffer.from(await secondResponse.arrayBuffer())

    assert.equal(secondResponse.status, 200)
    assert.equal(secondResponse.headers.get('x-spell-wizard-tts-cache'), 'hit')
    assert.deepEqual(secondAudio, firstAudio)

    const bypassResponse = await fetch(`${context.baseUrl}/api/tts`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        ...requestBody,
        bypassCache: true
      })
    })

    assert.equal(bypassResponse.status, 200)
    assert.equal(bypassResponse.headers.get('x-spell-wizard-tts-cache'), 'bypass')

    const cachedFilesAfterBypass = await readdir(context.cacheDirectory)
    assert.equal(cachedFilesAfterBypass.length, 2)
  }
  finally {
    await context.cleanup()
  }
})
