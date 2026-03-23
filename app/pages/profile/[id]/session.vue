<script setup lang="ts">
import type { AttemptResponse, Profile, SessionView } from '~~/shared/spelling'
import { hasValidEnunciation, WORD_CATALOG } from '~~/shared/word-catalog'

const route = useRoute()
const router = useRouter()
const profileId = computed(() => route.params.id as string)

const { data: profile } = await useFetch<Profile>(() => `/api/profiles/${profileId.value}`)

const session = ref<SessionView | null>(null)
const answer = ref('')
const answerInput = ref<HTMLInputElement | null>(null)
const feedback = ref('')
const feedbackTone = ref<'success' | 'warning' | 'error' | 'info'>('info')
const visualResult = ref<'idle' | 'correct' | 'incorrect' | 'correction-required' | 'correction-complete'>('idle')
const animationKey = ref(0)
const animatedLetters = ref<string[]>([])
const rewards = ref<AttemptResponse['rewards']>([])
const loading = ref(false)
const sessionEnded = ref(false)
const sentenceTooltipVisible = ref(false)
let clearVisualTimer: ReturnType<typeof setTimeout> | null = null

const { celebrate, reducedMotion } = useFunEffects()
const { speakWord, voiceEnabled, speechSupported } = usePromptVoice()
const appConfig = useAppConfig()

const currentEntry = computed(() => WORD_CATALOG.find(word => word.id === session.value?.currentPrompt.wordId))
const currentWord = computed(() => currentEntry.value?.word)
const currentEnunciation = computed(() => currentEntry.value?.enunciationText)
const currentExampleSentence = computed(() => currentEntry.value?.exampleSentence)
const canEnunciate = computed(() => Boolean(currentEntry.value && hasValidEnunciation(currentEntry.value)))

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function maskWordInSentence(sentence?: string, word?: string) {
  if (!sentence || !word) {
    return undefined
  }

  return sentence.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi'), '_____')
}

const maskedExampleSentence = computed(() => maskWordInSentence(currentExampleSentence.value, currentWord.value))
const revealedLetters = ref<string[]>([])
const maskedPrompt = computed(() => {
  if (!currentWord.value) {
    return undefined
  }

  const revealed = new Set(revealedLetters.value)
  return currentWord.value
    .split('')
    .map(letter => revealed.has(letter) ? letter : '_')
    .join(' ')
})
const visiblePrompt = computed(() => {
  if (session.value?.correctionRequired) {
    return session.value.currentPrompt.visibleWord
  }

  return maskedPrompt.value
})
const promptLetters = computed(() => {
  if (!currentWord.value) {
    return []
  }

  const revealed = new Set(revealedLetters.value)
  const pulsing = new Set(animatedLetters.value)
  const correctionRequired = session.value?.correctionRequired ?? false

  return currentWord.value.split('').map((letter, index) => {
    const isVisible = correctionRequired || revealed.has(letter)

    return {
      key: `${index}-${letter}`,
      letter,
      display: isVisible ? letter : '_',
      isRevealed: !correctionRequired && revealed.has(letter),
      shouldPulse: !correctionRequired && pulsing.has(letter)
    }
  })
})
const isSuccessVisual = computed(() => visualResult.value === 'correct' || visualResult.value === 'correction-complete')
const sparkleParticles = computed(() => {
  if (reducedMotion.value || !isSuccessVisual.value) {
    return []
  }

  return [
    { symbol: '✦', style: { '--spark-x': '-4.8rem', '--spark-y': '-3.2rem', '--spark-rotate': '-16deg', '--spark-delay': '0ms' } },
    { symbol: '✧', style: { '--spark-x': '4.6rem', '--spark-y': '-3.4rem', '--spark-rotate': '18deg', '--spark-delay': '40ms' } },
    { symbol: '✦', style: { '--spark-x': '-5.8rem', '--spark-y': '-0.8rem', '--spark-rotate': '-24deg', '--spark-delay': '90ms' } },
    { symbol: '✧', style: { '--spark-x': '5.4rem', '--spark-y': '-0.4rem', '--spark-rotate': '22deg', '--spark-delay': '120ms' } },
    { symbol: '✦', style: { '--spark-x': '-3.8rem', '--spark-y': '2.9rem', '--spark-rotate': '-14deg', '--spark-delay': '150ms' } },
    { symbol: '✧', style: { '--spark-x': '4.1rem', '--spark-y': '2.7rem', '--spark-rotate': '14deg', '--spark-delay': '180ms' } },
    { symbol: '✦', style: { '--spark-x': '0rem', '--spark-y': '-4.1rem', '--spark-rotate': '0deg', '--spark-delay': '70ms' } },
    { symbol: '✧', style: { '--spark-x': '0.4rem', '--spark-y': '3.5rem', '--spark-rotate': '8deg', '--spark-delay': '210ms' } }
  ]
})

function setVisualState(state: 'correct' | 'incorrect' | 'correction-required' | 'correction-complete', lettersToPulse: string[] = []) {
  animationKey.value += 1
  visualResult.value = state
  animatedLetters.value = lettersToPulse

  if (clearVisualTimer) {
    clearTimeout(clearVisualTimer)
  }

  clearVisualTimer = window.setTimeout(() => {
    visualResult.value = 'idle'
    animatedLetters.value = []
    clearVisualTimer = null
  }, state === 'incorrect' ? 520 : 700)
}

async function focusAnswerInput() {
  await nextTick()

  if (!answerInput.value) {
    return
  }

  answerInput.value.focus()

  setTimeout(() => {
    answerInput.value?.focus()
  }, 0)
}

async function startSession() {
  loading.value = true
  const created = await $fetch<SessionView>('/api/sessions', {
    method: 'POST',
    body: { profileId: profileId.value }
  })
  session.value = created
  feedback.value = 'Listen for the word, then type your best spelling.'
  feedbackTone.value = 'info'
  visualResult.value = 'idle'
  animationKey.value = 0
  animatedLetters.value = []
  rewards.value = []
  answer.value = ''
  loading.value = false
}

async function replayWord(options: { interrupt?: boolean } = {}) {
  if (!voiceEnabled.value || !currentWord.value) {
    return
  }

  await speakWord(currentWord.value, {
    ...options,
    mode: 'standard'
  })
}

async function enunciateWord() {
  if (!voiceEnabled.value || !currentWord.value) {
    return
  }

  const canFallbackToStandard = appConfig.spellingWizard.speech.enunciate.fallbackToStandard
  const wordToSpeak = canEnunciate.value
    ? currentEnunciation.value
    : canFallbackToStandard
      ? currentWord.value
      : undefined

  await speakWord(wordToSpeak, {
    interrupt: true,
    mode: 'enunciate',
    fallbackWord: canFallbackToStandard ? currentWord.value : undefined
  })

  await focusAnswerInput()
}

async function playExampleSentence() {
  if (!voiceEnabled.value || !currentExampleSentence.value) {
    return
  }

  sentenceTooltipVisible.value = true

  try {
    await speakWord(currentExampleSentence.value, {
      interrupt: true,
      mode: 'standard'
    })
  }
  finally {
    sentenceTooltipVisible.value = false
    await focusAnswerInput()
  }
}

function handleRewards(emittedRewards: AttemptResponse['rewards']) {
  rewards.value = emittedRewards
  for (const reward of emittedRewards) {
    celebrate(reward.type === 'rank-up' ? 'rank' : 'level')
  }
}

async function submitAnswer() {
  if (!session.value || !answer.value.trim()) {
    return
  }

  const wasCorrectionSubmission = session.value.correctionRequired
  const submittedAnswer = answer.value
  const guessedLetters = new Set(submittedAnswer.trim().toLowerCase().replace(/[^a-z]/g, '').split(''))
  const matchedLetters = currentWord.value
    ?.split('')
    .filter(letter => guessedLetters.has(letter))
    ?? []

  loading.value = true
  const endpoint = session.value.correctionRequired
    ? `/api/sessions/${session.value.sessionId}/correction`
    : `/api/sessions/${session.value.sessionId}/attempts`

  const response = await $fetch<AttemptResponse>(endpoint, {
    method: 'POST',
    body: { answer: answer.value }
  })

  session.value = response.session
  feedback.value = response.feedback
  feedbackTone.value = response.status === 'correct' || response.status === 'correction-complete'
    ? 'success'
    : response.status === 'correction-required'
      ? 'error'
      : 'warning'

  if (!wasCorrectionSubmission && matchedLetters.length) {
    revealedLetters.value = [...new Set([...revealedLetters.value, ...matchedLetters])]
  }

  if (response.status === 'correct' || response.status === 'correction-complete') {
    setVisualState(response.status)
    celebrate('correct')
    answer.value = ''
    handleRewards(response.rewards)
  }
  else if (response.status === 'incorrect' || response.status === 'correction-required') {
    setVisualState(response.status, !wasCorrectionSubmission ? matchedLetters : [])
    celebrate('retry')
    answer.value = ''
  }
  else {
    answer.value = ''
  }

  loading.value = false
}

async function endCurrentSession() {
  if (!session.value) {
    return router.push(`/profile/${profileId.value}`)
  }

  loading.value = true
  await $fetch(`/api/sessions/${session.value.sessionId}/end`, { method: 'POST' })
  loading.value = false
  sessionEnded.value = true
}

watch(() => session.value?.currentPrompt.wordId, async (wordId) => {
  if (wordId) {
    revealedLetters.value = []
    animatedLetters.value = []
    await nextTick()
    replayWord({ interrupt: false })
    await focusAnswerInput()
  }
})

watch(session, async (value) => {
  if (value && !sessionEnded.value) {
    await focusAnswerInput()
  }
})

onMounted(() => {
  if (!session.value || sessionEnded.value) {
    return
  }

  setTimeout(() => {
    focusAnswerInput()
  }, 50)
})

onBeforeUnmount(() => {
  if (clearVisualTimer) {
    clearTimeout(clearVisualTimer)
  }
})

await startSession()
</script>

<template>
  <main class="page-shell grid">
    <section class="hero-card header-layout" v-if="profile">
      <div>
        <NuxtLink class="badge" :to="`/profile/${profile.id}`">← Dashboard</NuxtLink>
        <h1 class="hero-title" style="margin-top: 1rem;">{{ profile.name }}'s spelling session</h1>
        <p class="hero-subtitle">Hear the word, type your answer, and keep going for as many words as you want.</p>
      </div>
      <div class="button-row">
        <button class="button-ghost" type="button" @click="endCurrentSession">Finish session</button>
      </div>
    </section>

    <div v-if="sessionEnded" class="panel">
      <p class="feedback success">Session saved.</p>
      <NuxtLink class="button-secondary" :to="`/profile/${profileId}`">Return to dashboard</NuxtLink>
    </div>

    <section v-else-if="session" class="session-flow">
      <article
        :class="[
          'session-card',
          'session-card-animated',
          `session-card-${visualResult}`,
          { 'session-card-reduced-motion': reducedMotion }
        ]"
      >
        <div class="badge">{{ session.currentPrompt.hint }}</div>
        <h2
          :class="[
            'prompt-word',
            `prompt-word-${visualResult}`,
            { 'prompt-word-reduced-motion': reducedMotion }
          ]"
          :data-animation-key="animationKey"
          style="margin-top: 1rem;"
        >
          <span
            v-for="item in sparkleParticles"
            :key="`${animationKey}-${item.symbol}-${item.style['--spark-x']}`"
            class="prompt-word-sparkle"
            :style="item.style"
            aria-hidden="true"
          >
            {{ item.symbol }}
          </span>
          <template v-if="promptLetters.length">
            <span
              v-for="entry in promptLetters"
              :key="entry.key"
              :class="[
                'prompt-letter',
                {
                  'prompt-letter-revealed': entry.isRevealed,
                  'prompt-letter-pulse': entry.shouldPulse && animationKey > 0
                }
              ]"
            >
              {{ entry.display }}
            </span>
          </template>
          <template v-else>
            {{ visiblePrompt || '_ _ _' }}
          </template>
        </h2>
        <p class="helper-text">{{ session.correctionRequired ? 'Type the correct spelling before moving on.' : canEnunciate ? 'Each guess reveals any matching letters in the word, even if they are not in the right place yet. You can also tap enunciate for extra-clear speech.' : 'Each guess reveals any matching letters in the word, even if they are not in the right place yet.' }}</p>

        <div class="stats-grid" style="margin: 1rem 0;">
          <div class="stat-card">
            <span class="tiny muted">Attempts used</span>
            <strong>{{ session.attemptsUsed }} / {{ session.maxAttempts }}</strong>
          </div>
          <div class="stat-card">
            <span class="tiny muted">Session points</span>
            <strong>{{ session.pointsEarned }}</strong>
          </div>
          <div class="stat-card">
            <span class="tiny muted">Words completed</span>
            <strong>{{ session.wordsCompleted }}</strong>
          </div>
        </div>

        <form class="form-grid" @submit.prevent="submitAnswer">
          <label class="field">
            <span>{{ session.correctionRequired ? 'Type the revealed word' : 'Type your spelling' }}</span>
            <input
              ref="answerInput"
              v-model="answer"
              :class="[
                'session-input',
                `session-input-${visualResult}`,
                { 'session-input-reduced-motion': reducedMotion }
              ]"
              type="text"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              autofocus
            />
          </label>

          <div class="button-row">
            <button class="button-secondary" :disabled="loading" type="submit">{{ session.correctionRequired ? 'Lock in correction' : 'Submit spelling' }}</button>
            <button class="button-ghost" :disabled="loading" type="button" @click="replayWord({ interrupt: true }).then(() => focusAnswerInput())">Hear it again</button>
            <button class="button-ghost" :disabled="loading || !voiceEnabled || !speechSupported" type="button" @click="enunciateWord">Enunciate</button>
            <div
              v-if="maskedExampleSentence"
              :class="['sentence-tooltip-anchor', { 'sentence-tooltip-visible': sentenceTooltipVisible }]"
            >
              <div class="sentence-tooltip-panel tiny" role="status" aria-live="polite">
                {{ maskedExampleSentence }}
              </div>
              <button class="button-ghost" :disabled="loading || !voiceEnabled || !speechSupported || !currentExampleSentence" type="button" @click="playExampleSentence">Read sentence</button>
            </div>
            <button v-else class="button-ghost" :disabled="loading || !voiceEnabled || !speechSupported || !currentExampleSentence" type="button" @click="playExampleSentence">Read sentence</button>
          </div>
        </form>

        <div :key="animationKey" :class="['feedback', feedbackTone, 'feedback-animated', `feedback-${visualResult}`]" style="margin-top: 1rem;">{{ feedback }}</div>
        <section v-if="rewards.length" class="session-rewards">
          <h3 style="margin-bottom: 0.75rem;">Rewards earned this turn</h3>
          <RewardList :rewards="rewards" />
        </section>
      </article>
    </section>

    <section v-else class="panel">
      <p class="feedback info">Starting session...</p>
    </section>
  </main>
</template>
