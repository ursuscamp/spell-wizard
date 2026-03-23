<script setup lang="ts">
import type { SessionRecord } from '~~/shared/spelling'

defineProps<{
  sessions: SessionRecord[]
}>()
</script>

<template>
  <div class="list">
    <div v-for="session in sessions" :key="session.id" class="list-item">
      <strong>{{ session.wordsCompleted }} words • {{ session.pointsEarned }} points</strong>
      <p class="tiny muted" style="margin: 0.35rem 0 0;">
        {{ new Date(session.startedAt).toLocaleString() }}
        <span v-if="session.rewardEvents.length"> • {{ session.rewardEvents.length }} reward{{ session.rewardEvents.length === 1 ? '' : 's' }}</span>
      </p>
    </div>
    <div v-if="!sessions.length" class="list-item tiny muted">No sessions yet. Start a Spell Wizard adventure to fill this shelf.</div>
  </div>
</template>
