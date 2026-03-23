<script setup lang="ts">
import type { DashboardView } from '~~/shared/spelling'
import { getRankArtPath } from '~~/app/utils/rank-art'

const route = useRoute()
const profileId = computed(() => route.params.id as string)
const { data, refresh, error } = await useFetch<DashboardView>(() => `/api/profiles/${profileId.value}/dashboard`)

const { soundEnabled, reducedMotion } = useFunEffects()
const {
  availableVoices,
  loadVoices,
  selectedVoiceUri,
  setSelectedVoiceUri,
  speechReady,
  speechSupported,
  speakWord,
  voiceEnabled
} = usePromptVoice()

function formatRewardLabel(amount: number) {
  return `${amount} Robux`
}

function updateSelectedVoice(event: Event) {
  setSelectedVoiceUri((event.target as HTMLSelectElement).value)
}

async function testSelectedVoice() {
  await speakWord('Welcome to Spell Wizard!', {
    interrupt: true,
    mode: 'standard'
  })
}

watch(profileId, () => refresh())

onMounted(() => {
  loadVoices()
})
</script>

<template>
  <main class="page-shell grid" v-if="data">
    <section class="hero-card hero-layout">
      <div>
        <NuxtLink class="badge" to="/">← Back to profiles</NuxtLink>
        <h1 class="hero-title" style="margin-top: 1rem;">{{ data.profile.name }}'s wizard dashboard</h1>
        <p class="hero-subtitle">Age-aware practice, adaptive review, and rewards that stay in sync.</p>

        <div class="button-row" style="margin-top: 1rem;">
          <NuxtLink class="button-secondary" :to="`/profile/${data.profile.id}/session`">Start spelling session</NuxtLink>
          <NuxtLink class="button-ghost" :to="`/profile/${data.profile.id}/history`">Open history</NuxtLink>
        </div>
      </div>

      <div class="rank-hero-art">
        <img :src="getRankArtPath(data.profile.rankKey, 'portrait')" :alt="`${data.profile.rankKey} portrait art`" />
      </div>
    </section>

    <section class="stats-grid">
      <div class="stat-card">
        <span class="tiny muted">Points</span>
        <strong>{{ data.profile.pointsTotal }}</strong>
      </div>
      <div class="stat-card">
        <span class="tiny muted">Level</span>
        <strong>{{ data.profile.level }}</strong>
      </div>
      <div class="stat-card">
        <span class="tiny muted">Rank</span>
        <div class="rank-stat-badge-frame">
          <img class="rank-stat-badge" :src="getRankArtPath(data.profile.rankKey, 'badge')" :alt="`${data.profile.rankKey} badge art`" />
        </div>
        <strong>{{ data.profile.rankKey }}</strong>
      </div>
      <div class="stat-card">
        <span class="tiny muted">Recent sessions</span>
        <strong>{{ data.recentSessions.length }}</strong>
      </div>
    </section>

    <section class="history-grid">
      <article class="panel">
        <div class="header-layout" style="margin-bottom: 1rem;">
          <div>
            <h2 style="margin: 0;">Recent rewards</h2>
            <p class="helper-text" style="margin: 0.35rem 0 0;">Every 100 points earns 100 Robux. Every third level is a rank up worth 300 Robux.</p>
          </div>
        </div>

        <RewardList :rewards="data.recentRewards" />
      </article>

      <article class="panel">
        <h2 style="margin-top: 0;">Sound and comfort</h2>
        <div class="button-row" style="margin-top: 1rem;">
          <button class="button-ghost" type="button" @click="soundEnabled = !soundEnabled">{{ soundEnabled ? 'Mute sparkle sounds' : 'Enable sparkle sounds' }}</button>
          <button class="button-ghost" type="button" @click="voiceEnabled = !voiceEnabled">{{ voiceEnabled ? 'Mute spoken words' : 'Enable spoken words' }}</button>
          <button class="button-ghost" type="button" @click="reducedMotion = !reducedMotion">{{ reducedMotion ? 'Enable motion' : 'Reduce motion' }}</button>
        </div>

        <label class="field" style="margin-top: 1rem; max-width: 24rem;">
          <span>Spoken voice</span>
          <select
            :disabled="!voiceEnabled || !speechSupported || !availableVoices.length"
            :value="selectedVoiceUri ?? ''"
            @change="updateSelectedVoice"
          >
            <option value="">Default browser voice</option>
            <option v-for="voice in availableVoices" :key="voice.id" :value="voice.id">
              {{ `${voice.name} (${voice.lang})${voice.default ? ' - default' : ''}` }}
            </option>
          </select>
          <p class="tiny muted" style="margin: 0;">
              {{ !voiceEnabled
                ? 'Turn on spoken words to choose a voice.'
                : !speechSupported
                  ? 'The Edge TTS voice service is unavailable right now.'
                  : !speechReady && !availableVoices.length
                  ? 'Loading available English Edge voices from the server...'
                  : 'Voices come from the Edge TTS service, so every device uses the same English voice list.' }}
           </p>
         </label>

        <div class="button-row" style="margin-top: 0.75rem;">
          <button
            class="button-ghost"
            type="button"
            :disabled="!voiceEnabled || !speechSupported || !availableVoices.length"
            @click="testSelectedVoice"
          >
            Test voice
          </button>
        </div>

        <div class="list" style="margin-top: 1rem;">
          <div class="list-item">
            <strong>Reward tracking</strong>
            <p class="tiny muted" style="margin: 0.35rem 0 0;">Latest reward: {{ data.recentRewards[0] ? formatRewardLabel(data.recentRewards[0].robuxAwarded) : 'No reward yet' }}</p>
          </div>
          <div class="list-item">
            <strong>Tricky word shelf</strong>
            <p class="tiny muted" style="margin: 0.35rem 0 0;">The app quietly repeats hard words more often and mastered words less often.</p>
          </div>
        </div>
      </article>
    </section>

    <section class="history-grid">
      <article class="panel">
        <h2 style="margin-top: 0;">Recent spelling sessions</h2>
        <SessionHistoryList :sessions="data.recentSessions" />
      </article>

      <article class="panel">
        <h2 style="margin-top: 0;">Words that need extra practice</h2>
        <DifficultWordList :words="data.difficultWords" />
      </article>
    </section>
  </main>

  <main v-else class="page-shell">
    <div class="panel">
      <p v-if="error" class="feedback error">{{ error.message }}</p>
      <p v-else class="feedback info">Loading wizard dashboard...</p>
    </div>
  </main>
</template>
