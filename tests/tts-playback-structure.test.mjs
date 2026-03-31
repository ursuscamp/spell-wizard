import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const root = process.cwd()

test('session page uses a single automatic TTS trigger path', async () => {
  const source = await readFile(join(root, 'app/pages/profile/[id]/session.vue'), 'utf8')

  assert.equal(source.includes('nextTick(() => replayWord())'), false)
  assert.match(source, /watch\(\(\) => session\.value\?\.currentPrompt\.wordId,[\s\S]*replayWord\(\{ interrupt: false \}\)/)
  assert.match(source, /@click="replayWord\(\{ interrupt: true \}\)\.then\(\(\) => focusAnswerInput\(\)\)"/)
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

test('session page shows a live points-to-next-level indicator', async () => {
  const source = await readFile(join(root, 'app/pages/profile/[id]/session.vue'), 'utf8')

  assert.match(source, /const appConfig = useAppConfig\(\)/)
  assert.match(source, /const levelPointThreshold = computed\(\(\) => appConfig\.spellingWizard\.levelPointThreshold \?\? 100\)/)
  assert.match(source, /const currentPointsTotal = computed\(\(\) => \(profile\.value\?\.pointsTotal \?\? 0\) \+ \(session\.value\?\.pointsEarned \?\? 0\)\)/)
  assert.match(source, /const pointsToNextLevel = computed\(\(\) => \{[\s\S]*return threshold - \(currentPointsTotal\.value % threshold\)/)
  assert.match(source, /<span class="tiny muted">To next level<\/span>/)
  assert.match(source, /\{\{ pointsToNextLevel \}\} point\{\{ pointsToNextLevel === 1 \? '' : 's' \}\}/)
})

test('prompt voice composable only cancels speech for explicit replays', async () => {
  const source = await readFile(join(root, 'app/composables/usePromptVoice.ts'), 'utf8')

  assert.match(source, /function speakWord\(word\?: string, options: SpeakWordOptions = \{\}\)/)
  assert.match(source, /const \{ interrupt = false, mode = 'standard', fallbackWord, bypassCache = false, voiceId \} = options/)
  assert.match(source, /if \(interrupt\) \{\s+releaseActiveAudio\(\)/)
  assert.match(source, /const response = await fetch\('\/api\/tts'/)
  assert.match(source, /body: JSON\.stringify\(\{[\s\S]*voiceId: voiceId \?\? selectedVoiceUri\.value,[\s\S]*bypassCache[\s\S]*\}\)/)
  assert.match(source, /activeAudio = new Audio\(activeAudioUrl\)/)
  assert.match(source, /const finished = new Promise<boolean>\(\(resolve\) => \{/)
  assert.match(source, /activeAudio\.onended = \(\) => \{[\s\S]*resolve\(true\)/)
  assert.match(source, /activeAudio\.onerror = \(\) => \{[\s\S]*resolve\(false\)/)
})

test('prompt voice composable loads voice options from the server', async () => {
  const source = await readFile(join(root, 'app/composables/usePromptVoice.ts'), 'utf8')

  assert.match(source, /function getVoiceLocalePriority\(locale: string\)/)
  assert.match(source, /async function waitForVoices\(\)/)
  assert.match(source, /if \(!import\.meta\.client\) \{\s+return \[\]/)
  assert.match(source, /const voices = await \$fetch<VoiceOption\[]>\('\/api\/tts\/voices'\)/)
  assert.match(source, /syncAvailableVoices\(sortedVoices\)/)
  assert.match(source, /const localePriorityDifference = getVoiceLocalePriority\(left\.lang\) - getVoiceLocalePriority\(right\.lang\)/)
  assert.doesNotMatch(source, /speechSupported\.value = false/)
})

test('prompt voice composable exposes separate standard and enunciate voice settings', async () => {
  const source = await readFile(join(root, 'app/composables/usePromptVoice.ts'), 'utf8')

  assert.match(source, /function buildVoiceConfig\(mode: 'standard' \| 'enunciate' = 'standard'\)/)
  assert.match(source, /return mode === 'enunciate'\s+\? speechConfig\.enunciate\s+: speechConfig\.standard/)
  assert.match(source, /mode,/)
  assert.match(source, /voiceId \?\? selectedVoiceUri\.value/)
})

test('session page offers a separate slower playback action', async () => {
  const source = await readFile(join(root, 'app/pages/profile/[id]/session.vue'), 'utf8')

  assert.match(source, /async function enunciateWord\(\)/)
  assert.match(source, /await speakWord\(currentWord\.value, \{[\s\S]*mode: 'enunciate'/)
  assert.match(source, /mode: 'enunciate'/)
  assert.match(source, /@click="enunciateWord"/)
  assert.match(source, />Slower</)
})

test('session page exposes masked example sentence hints during sentence playback', async () => {
  const source = await readFile(join(root, 'app/pages/profile/[id]/session.vue'), 'utf8')

  assert.match(source, /const currentExampleSentence = computed\(\(\) => currentEntry\.value\?\.exampleSentence\)/)
  assert.match(source, /function maskWordInSentence\(sentence\?: string, word\?: string\)/)
  assert.match(source, /const maskedExampleSentence = computed\(\(\) => maskWordInSentence\(currentExampleSentence\.value, currentWord\.value\)\)/)
  assert.match(source, /const sentenceTooltipVisible = ref\(false\)/)
  assert.match(source, /async function playExampleSentence\(\)/)
  assert.match(source, /sentenceTooltipVisible\.value = true/)
  assert.match(source, /await speakWord\(currentExampleSentence\.value, \{[\s\S]*mode: 'standard'/)
  assert.match(source, /sentenceTooltipVisible\.value = false/)
  assert.match(source, /v-if="maskedExampleSentence"/)
  assert.match(source, /'sentence-tooltip-visible': sentenceTooltipVisible/)
  assert.match(source, /\{\{ maskedExampleSentence \}\}/)
  assert.match(source, /@click="playExampleSentence"/)
  assert.match(source, />Read sentence</)
})
