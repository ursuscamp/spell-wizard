<script setup lang="ts">
import type { AttemptResponse, Profile, SessionView } from '~~/shared/spelling'
import { hasValidEnunciation, WORD_CATALOG } from '~~/shared/word-catalog'

const route = useRoute()
const router = useRouter()
const profileId = computed(() => route.params.id as string)

const { data: profile } = await useFetch<Profile>(() => `/api/profiles/${profileId.value}`)

const session = ref<SessionView | null>(null)
const answer = ref('')
const feedback = ref('')
const feedbackTone = ref<'success' | 'warning' | 'error' | 'info'>('info')
const rewards = ref<AttemptResponse['rewards']>([])
const loading = ref(false)
const sessionEnded = ref(false)
const sentenceTooltipVisible = ref(false)

const { celebrate } = useFunEffects()
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

async function startSession() {
  loading.value = true
  const created = await $fetch<SessionView>('/api/sessions', {
    method: 'POST',
    body: { profileId: profileId.value }
  })
  session.value = created
  feedback.value = 'Listen for the word, then type your best spelling.'
  feedbackTone.value = 'info'
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
    celebrate('correct')
    answer.value = ''
    handleRewards(response.rewards)
  }
  else if (response.status === 'incorrect') {
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
    await nextTick()
    replayWord({ interrupt: false })
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
          <button class="button-secondary" type="button" @click="replayWord({ interrupt: true })">Read word aloud</button>
          <button class="button-secondary" type="button" :disabled="loading || !voiceEnabled || !speechSupported" @click="enunciateWord">Enunciate word</button>
          <button class="button-secondary" type="button" :disabled="loading || !voiceEnabled || !speechSupported || !currentExampleSentence" @click="playExampleSentence">Read sentence aloud</button>
          <button class="button-ghost" type="button" @click="endCurrentSession">Finish session</button>
        </div>
      </section>

    <div v-if="sessionEnded" class="panel">
      <p class="feedback success">Session saved to your household server.</p>
      <NuxtLink class="button-secondary" :to="`/profile/${profileId}`">Return to dashboard</NuxtLink>
    </div>

    <section v-else-if="session" class="session-flow">
      <article class="session-card">
        <div class="badge">{{ session.currentPrompt.hint }}</div>
        <h2 class="prompt-word" style="margin-top: 1rem;">
          {{ visiblePrompt || '_ _ _' }}
        </h2>
        <div v-if="maskedExampleSentence" class="sentence-hint-row">
          <div :class="['sentence-tooltip', { 'sentence-tooltip-visible': sentenceTooltipVisible }]">
            <div class="sentence-tooltip-panel tiny" role="status" aria-live="polite">
              {{ maskedExampleSentence }}
            </div>
          </div>
        </div>
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
            <input v-model="answer" class="session-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" />
          </label>

          <div class="button-row">
            <button class="button-secondary" :disabled="loading" type="submit">{{ session.correctionRequired ? 'Lock in correction' : 'Submit spelling' }}</button>
            <button class="button-ghost" :disabled="loading" type="button" @click="replayWord({ interrupt: true })">Hear it again</button>
            <button class="button-ghost" :disabled="loading || !voiceEnabled || !speechSupported" type="button" @click="enunciateWord">Enunciate</button>
            <button class="button-ghost" :disabled="loading || !voiceEnabled || !speechSupported || !currentExampleSentence" type="button" @click="playExampleSentence">Read sentence</button>
          </div>
        </form>

        <div :class="['feedback', feedbackTone]" style="margin-top: 1rem;">{{ feedback }}</div>
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
