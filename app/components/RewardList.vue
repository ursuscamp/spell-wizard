<script setup lang="ts">
import type { RewardEvent } from '~~/shared/spelling'
import { getRankArtPath } from '~~/app/utils/rank-art'

defineProps<{
  rewards: RewardEvent[]
}>()
</script>

<template>
  <div class="list">
    <div
      v-for="reward in rewards"
      :key="reward.id"
      class="reward-card"
      :class="{ 'reward-card-rank-up': reward.type === 'rank-up' }"
    >
      <div class="reward-card-main">
        <div>
          <div class="badge" :class="{ 'badge-rank-up': reward.type === 'rank-up' }">{{ reward.type === 'rank-up' ? 'Rank up' : 'Level up' }}</div>
          <strong :class="{ 'reward-value-rank-up': reward.type === 'rank-up' }">{{ reward.robuxAwarded }} Robux</strong>
          <p style="margin: 0.35rem 0 0;">Level {{ reward.levelReached }}<span v-if="reward.rankKey"> • {{ reward.rankKey }}</span></p>
        </div>

        <div v-if="reward.type === 'rank-up' && reward.rankKey" class="reward-rank-art-frame">
          <img
            class="reward-rank-art"
            :src="getRankArtPath(reward.rankKey, 'badge')"
            :alt="`${reward.rankKey} badge art`"
          />
        </div>
      </div>
    </div>
    <div v-if="!rewards.length" class="list-item tiny muted">No rewards yet. The next sparkle is waiting in the next session.</div>
  </div>
</template>
