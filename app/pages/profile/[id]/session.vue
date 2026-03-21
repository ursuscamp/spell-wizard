<script setup lang="ts">
import type { AttemptResponse, Profile, SessionView } from '~~/shared/spelling'
import { WORD_CATALOG } from '~~/shared/word-catalog'

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

const { celebrate } = useFunEffects()
const { speakWord, voiceEnabled, speechSupported } = usePromptVoice()

const currentWord = computed(() => WORD_CATALOG.find(word => word.id === session.value?.currentPrompt.wordId)?.word)
const visiblePrompt = computed(() => {
  if (session.value?.correctionRequired) {
    return session.value.currentPrompt.visibleWord
  }

  if (!voiceEnabled.value || !speechSupported.value) {
    return currentWord.value
  }

  return undefined
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
  nextTick(() => replayWord())
}

async function replayWord() {
  if (!voiceEnabled.value || !currentWord.value) {
    return
  }

  speakWord(currentWord.value)
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

  if (response.status === 'correct' || response.status === 'correction-complete') {
    celebrate('correct')
    answer.value = ''
    handleRewards(response.rewards)
    nextTick(() => replayWord())
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
    await nextTick()
    replayWord()
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
        <button class="button-secondary" type="button" @click="replayWord">Read word aloud</button>
        <button class="button-ghost" type="button" @click="endCurrentSession">Finish session</button>
      </div>
    </section>

    <div v-if="sessionEnded" class="panel">
      <p class="feedback success">Session saved to your household server.</p>
      <NuxtLink class="button-secondary" :to="`/profile/${profileId}`">Return to dashboard</NuxtLink>
    </div>

    <section v-else-if="session" class="session-grid">
      <article class="session-card">
        <div class="badge">{{ session.currentPrompt.hint }}</div>
        <h2 class="prompt-word" style="margin-top: 1rem;">
          {{ visiblePrompt || 'Listen and spell' }}
        </h2>
        <p class="helper-text">{{ session.correctionRequired ? 'Type the correct spelling before moving on.' : (!voiceEnabled || !speechSupported) ? 'Voice playback is off, so the word is shown on screen.' : 'Use the keyboard to spell the word you hear.' }}</p>

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
            <button class="button-ghost" :disabled="loading" type="button" @click="replayWord">Hear it again</button>
          </div>
        </form>

        <div :class="['feedback', feedbackTone]" style="margin-top: 1rem;">{{ feedback }}</div>
      </article>

      <aside class="panel">
        <h2 style="margin-top: 0;">Session sparkle log</h2>
        <div class="list">
          <div class="list-item">
            <strong>Adaptive practice</strong>
            <p class="tiny muted" style="margin: 0.35rem 0 0;">Tough words come back sooner. Easy words drift farther away.</p>
          </div>
          <div class="list-item">
            <strong>Scoring</strong>
            <p class="tiny muted" style="margin: 0.35rem 0 0;">1st try = 3 points, 2nd try = 2, 3rd try = 1, fix-up after misses = 0.</p>
          </div>
        </div>

        <h3>Rewards earned this turn</h3>
        <RewardList :rewards="rewards" />
      </aside>
    </section>

    <section v-else class="panel">
      <p class="feedback info">Starting session...</p>
    </section>
  </main>
</template>
