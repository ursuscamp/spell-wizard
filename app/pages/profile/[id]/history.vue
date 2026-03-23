<script setup lang="ts">
import type { HistoryView } from '~~/shared/spelling'
import { getRankArtPath } from '~~/app/utils/rank-art'

const route = useRoute()
const profileId = computed(() => route.params.id as string)
const { data, error } = await useFetch<HistoryView>(() => `/api/profiles/${profileId.value}/history`)
</script>

<template>
  <main class="page-shell grid" v-if="data">
    <section class="hero-card">
      <div class="hero-layout">
        <div>
          <NuxtLink class="badge" :to="`/profile/${data.profile.id}`">← Back to dashboard</NuxtLink>
          <h1 class="hero-title" style="margin-top: 1rem;">{{ data.profile.name }}'s spelling history</h1>
          <p class="hero-subtitle">Review recent sessions, reward bursts, and words that need another magical pass.</p>
        </div>
        <div class="rank-history-art">
          <img :src="getRankArtPath(data.profile.rankKey, 'portrait')" :alt="`${data.profile.rankKey} portrait art`" />
        </div>
      </div>
    </section>

    <section class="history-grid">
      <article class="panel">
        <h2 style="margin-top: 0;">All finished sessions</h2>
        <SessionHistoryList :sessions="data.sessions" />
      </article>

      <article class="panel">
        <h2 style="margin-top: 0;">Recent rewards</h2>
        <RewardList :rewards="data.rewards" />
      </article>
    </section>

    <section class="panel">
      <h2 style="margin-top: 0;">Practice again soon</h2>
      <DifficultWordList :words="data.difficultWords" />
    </section>
  </main>

  <main v-else class="page-shell">
    <div class="panel">
      <p v-if="error" class="feedback error">{{ error.message }}</p>
      <p v-else class="feedback info">Loading history...</p>
    </div>
  </main>
</template>
