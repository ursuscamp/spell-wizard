import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const root = process.cwd()

test('session page uses a single automatic TTS trigger path', async () => {
  const source = await readFile(join(root, 'app/pages/profile/[id]/session.vue'), 'utf8')

  assert.equal(source.includes('nextTick(() => replayWord())'), false)
  assert.match(source, /watch\(\(\) => session\.value\?\.currentPrompt\.wordId,[\s\S]*replayWord\(\{ interrupt: false \}\)/)
  assert.match(source, /@click="replayWord\(\{ interrupt: true \}\)"/)
})

test('prompt voice composable only cancels speech for explicit replays', async () => {
  const source = await readFile(join(root, 'app/composables/usePromptVoice.ts'), 'utf8')

  assert.match(source, /function speakWord\(word\?: string, options: SpeakWordOptions = \{\}\)/)
  assert.match(source, /const \{ interrupt = false \} = options/)
  assert.match(source, /if \(interrupt && \(speech\.speaking \|\| speech\.pending\)\) \{\s+speech\.cancel\(\)/)
})
