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

test('session page reveals matching letters inside a masked prompt', async () => {
  const source = await readFile(join(root, 'app/pages/profile/[id]/session.vue'), 'utf8')

  assert.match(source, /const revealedLetters = ref<string\[]>\(\[\]\)/)
  assert.match(source, /const maskedPrompt = computed\(\(\) => \{[\s\S]*\.map\(letter => revealed\.has\(letter\) \? letter : '_'\)[\s\S]*\.join\(' '\)/)
  assert.match(source, /const wasCorrectionSubmission = session\.value\.correctionRequired/)
  assert.match(source, /if \(!wasCorrectionSubmission && matchedLetters\.length\) \{[\s\S]*revealedLetters\.value = \[\.\.\.new Set\(\[\.\.\.revealedLetters\.value, \.\.\.matchedLetters\]\)\]/)
  assert.match(source, /watch\(\(\) => session\.value\?\.currentPrompt\.wordId,[\s\S]*revealedLetters\.value = \[\]/)
  assert.match(source, /\{\{ visiblePrompt \|\| '_ _ _' \}\}/)
})

test('prompt voice composable only cancels speech for explicit replays', async () => {
  const source = await readFile(join(root, 'app/composables/usePromptVoice.ts'), 'utf8')

  assert.match(source, /function speakWord\(word\?: string, options: SpeakWordOptions = \{\}\)/)
  assert.match(source, /const \{ interrupt = false, mode = 'standard', fallbackWord \} = options/)
  assert.match(source, /const voices = await waitForVoices\(\)/)
  assert.match(source, /const config = buildVoiceConfig\(mode\)/)
  assert.match(source, /speech\.resume\(\)/)
  assert.match(source, /if \(interrupt && \(speech\.speaking \|\| speech\.pending\)\) \{\s+speech\.cancel\(\)/)
})

test('prompt voice composable waits for async voice loading before selecting a voice', async () => {
  const source = await readFile(join(root, 'app/composables/usePromptVoice.ts'), 'utf8')

  assert.match(source, /async function waitForVoices\(\)/)
  assert.match(source, /speech\.addEventListener\('voiceschanged', handleVoicesChanged, \{ once: true \}\)/)
  assert.match(source, /const voice = voices\.find\(item => item\.lang\.startsWith\('en'\)\)\s+\?\? voices\.find\(item => item\.default\)\s+\?\? voices\[0\]/)
})

test('prompt voice composable exposes separate standard and enunciate voice settings', async () => {
  const source = await readFile(join(root, 'app/composables/usePromptVoice.ts'), 'utf8')

  assert.match(source, /function buildVoiceConfig\(mode: 'standard' \| 'enunciate' = 'standard'\)/)
  assert.match(source, /return mode === 'enunciate'\s+\? speechConfig\.enunciate\s+: speechConfig\.standard/)
  assert.match(source, /utterance\.rate = config\.rate/)
  assert.match(source, /utterance\.pitch = config\.pitch/)
})

test('session page offers a separate enunciate action', async () => {
  const source = await readFile(join(root, 'app/pages/profile/[id]/session.vue'), 'utf8')

  assert.match(source, /const canEnunciate = computed\(\(\) => Boolean\(currentEntry\.value && hasValidEnunciation\(currentEntry\.value\)\)\)/)
  assert.match(source, /async function enunciateWord\(\)/)
  assert.match(source, /mode: 'enunciate'/)
  assert.match(source, /@click="enunciateWord"/)
  assert.match(source, />Enunciate</)
})
