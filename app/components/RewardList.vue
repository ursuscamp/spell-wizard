<script setup lang="ts">
import type { RewardEvent } from '~~/shared/spelling'

defineProps<{
  rewards: RewardEvent[]
}>()
</script>

<template>
  <div class="list">
    <div v-for="reward in rewards" :key="reward.id" class="reward-card">
      <div class="badge">{{ reward.type === 'rank-up' ? 'Rank glow' : 'Level up' }}</div>
      <strong>{{ reward.robuxAwarded }} Robux</strong>
      <p style="margin: 0.35rem 0 0;">Level {{ reward.levelReached }}<span v-if="reward.rankKey"> • {{ reward.rankKey }}</span></p>
    </div>
    <div v-if="!rewards.length" class="list-item tiny muted">No rewards yet. The next sparkle is waiting in the next session.</div>
  </div>
</template>
