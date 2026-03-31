<script setup lang="ts">
import type { AdminRewardDisbursementResponse, AdminRewardProfileView, AdminRewardsView } from '~~/shared/spelling'

const { data, pending, error, refresh } = await useFetch<AdminRewardsView>('/api/admin/rewards', {
  default: () => ({ profiles: [] })
})

const selectedProfileId = ref('')
const amount = ref<string | number>('')
const saving = ref(false)
const feedback = ref('')
const feedbackTone = ref<'info' | 'warning' | 'error'>('info')

const profiles = computed(() => data.value?.profiles ?? [])
const selectedProfile = computed<AdminRewardProfileView | null>(() => profiles.value.find(entry => entry.profile.id === selectedProfileId.value) ?? null)

watchEffect(() => {
  const firstProfileId = profiles.value[0]?.profile.id ?? ''

  if (!firstProfileId) {
    selectedProfileId.value = ''
    return
  }

  if (!profiles.value.some(entry => entry.profile.id === selectedProfileId.value)) {
    selectedProfileId.value = firstProfileId
  }
})

const selectedSummary = computed(() => selectedProfile.value?.rewardSummary ?? {
  totalRewarded: 0,
  totalDisbursed: 0,
  remainingUndispatched: 0
})

const amountText = computed(() => String(amount.value ?? ''))

const amountNumber = computed(() => {
  const value = Number(amountText.value)
  return Number.isInteger(value) ? value : null
})

const amountError = computed(() => {
  if (!selectedProfile.value) {
    return 'Select a child profile first.'
  }

  if (!amountText.value.trim()) {
    return ''
  }

  if (amountNumber.value === null || amountNumber.value <= 0) {
    return 'Enter a positive whole-number Robux amount.'
  }

  if (amountNumber.value > selectedProfile.value.rewardSummary.remainingUndispatched) {
    return `Only ${selectedProfile.value.rewardSummary.remainingUndispatched} Robux remain undispatched.`
  }

  return ''
})

function formatRobux(amountValue: number) {
  return `${amountValue} Robux`
}

function selectProfile(profileId: string) {
  selectedProfileId.value = profileId
  amount.value = ''
  feedback.value = ''
}

async function submitDisbursement() {
  feedback.value = ''

  if (!selectedProfile.value) {
    feedbackTone.value = 'warning'
    feedback.value = 'Choose a child profile before recording a disbursement.'
    return
  }

  if (amountError.value) {
    feedbackTone.value = 'warning'
    feedback.value = amountError.value
    return
  }

  const parsedAmount = amountNumber.value
  if (parsedAmount === null) {
    feedbackTone.value = 'warning'
    feedback.value = 'Enter a positive whole-number Robux amount.'
    return
  }

  saving.value = true

  try {
    const response = await $fetch<AdminRewardDisbursementResponse>('/api/admin/rewards', {
      method: 'POST',
      body: {
        profileId: selectedProfile.value.profile.id,
        amount: parsedAmount
      }
    })

    feedbackTone.value = 'info'
    feedback.value = `Recorded ${formatRobux(response.disbursement.amount)} for ${selectedProfile.value.profile.name}.`
    amount.value = ''
    await refresh()
  }
  catch (caught) {
    feedbackTone.value = 'error'
    feedback.value = caught instanceof Error ? caught.message : 'Could not record that disbursement.'
  }
  finally {
    saving.value = false
  }
}

function toneClass() {
  return {
    error: feedbackTone.value === 'error',
    info: feedbackTone.value === 'info',
    warning: feedbackTone.value === 'warning'
  }
}
</script>

<template>
  <main class="page-shell grid admin-rewards-page">
    <section class="hero-card hero-layout">
      <div>
        <NuxtLink class="badge" to="/">← Home</NuxtLink>
        <h1 class="hero-title" style="margin-top: 1rem;">Robux disbursement tracking</h1>
        <p class="hero-subtitle" style="max-width: 42rem;">
          Record the Robux you actually hand to a child, then keep the remaining undispatched balance visible on their profile.
        </p>
        <div class="button-row" style="margin-top: 1rem;">
          <NuxtLink class="button-ghost" to="/admin/words">Review words</NuxtLink>
          <button class="button-secondary" type="button" @click="refresh">Refresh balances</button>
        </div>
      </div>

      <div class="admin-overview">
        <div class="stat-card">
          <span class="tiny muted">Children</span>
          <strong>{{ profiles.length }}</strong>
        </div>
        <div class="stat-card">
          <span class="tiny muted">Rewarded</span>
          <strong>{{ formatRobux(selectedSummary.totalRewarded) }}</strong>
        </div>
        <div class="stat-card">
          <span class="tiny muted">Given</span>
          <strong>{{ formatRobux(selectedSummary.totalDisbursed) }}</strong>
        </div>
        <div class="stat-card">
          <span class="tiny muted">Remaining</span>
          <strong>{{ formatRobux(selectedSummary.remainingUndispatched) }}</strong>
        </div>
      </div>
    </section>

    <section class="history-grid">
      <article class="panel">
        <div class="header-layout" style="margin-bottom: 1rem;">
          <div>
            <h2 style="margin: 0;">Choose a child</h2>
            <p class="helper-text" style="margin: 0.35rem 0 0;">Select the profile you want to update, then record how much Robux was actually given.</p>
          </div>
        </div>

        <p v-if="pending" class="feedback info">Loading reward balances...</p>
        <p v-else-if="error" class="feedback error">{{ error.message }}</p>

        <div v-if="profiles.length" class="list">
          <article
            v-for="entry in profiles"
            :key="entry.profile.id"
            class="profile-card"
            :class="{ active: entry.profile.id === selectedProfileId }"
          >
            <div class="header-layout" style="gap: 1rem; align-items: flex-start;">
              <div>
                <h3 style="margin: 0;">{{ entry.profile.name }}</h3>
                <p class="tiny muted" style="margin: 0.35rem 0 0;">Level {{ entry.profile.level }} • {{ entry.profile.rankKey }}</p>
              </div>
              <button class="button-ghost" type="button" @click="selectProfile(entry.profile.id)">Select</button>
            </div>

            <div class="stats-grid" style="margin-top: 1rem;">
              <div class="stat-card">
                <span class="tiny muted">Rewarded</span>
                <strong>{{ formatRobux(entry.rewardSummary.totalRewarded) }}</strong>
              </div>
              <div class="stat-card">
                <span class="tiny muted">Given</span>
                <strong>{{ formatRobux(entry.rewardSummary.totalDisbursed) }}</strong>
              </div>
              <div class="stat-card">
                <span class="tiny muted">Remaining</span>
                <strong>{{ formatRobux(entry.rewardSummary.remainingUndispatched) }}</strong>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="list-item tiny muted">
          No child profiles exist yet. Create one from the home screen before recording disbursements.
        </div>
      </article>

      <article v-if="selectedProfile" class="panel">
        <div class="header-layout" style="margin-bottom: 1rem;">
          <div>
            <h2 style="margin: 0;">{{ selectedProfile.profile.name }}'s balance</h2>
            <p class="helper-text" style="margin: 0.35rem 0 0;">Current reward totals are calculated from earned rewards and recorded payouts.</p>
          </div>
          <NuxtLink class="button-ghost" :to="`/profile/${selectedProfile.profile.id}`">Open profile</NuxtLink>
        </div>

        <section class="stats-grid">
          <div class="stat-card">
            <span class="tiny muted">Total rewarded</span>
            <strong>{{ formatRobux(selectedProfile.rewardSummary.totalRewarded) }}</strong>
          </div>
          <div class="stat-card">
            <span class="tiny muted">Total given</span>
            <strong>{{ formatRobux(selectedProfile.rewardSummary.totalDisbursed) }}</strong>
          </div>
          <div class="stat-card">
            <span class="tiny muted">Remaining undispatched</span>
            <strong>{{ formatRobux(selectedProfile.rewardSummary.remainingUndispatched) }}</strong>
          </div>
        </section>

        <form style="margin-top: 1.25rem;" @submit.prevent="submitDisbursement">
          <div class="form-grid">
            <label class="field">
              <span>Robux actually given</span>
              <input
                v-model="amount"
                type="number"
                min="1"
                step="1"
                placeholder="80"
              >
            </label>

            <p class="tiny muted" style="margin: 0;">
              You can give part of the reward now and leave the rest for later.
            </p>

            <p v-if="amountError" class="feedback warning">{{ amountError }}</p>
            <p v-if="feedback" class="feedback" :class="toneClass()">{{ feedback }}</p>

            <div class="button-row">
              <button class="button-secondary" type="submit" :disabled="saving || !selectedProfile || !amountText.trim() || amountNumber === null || !!amountError">
                {{ saving ? 'Recording...' : 'Record disbursement' }}
              </button>
              <button class="button-ghost" type="button" :disabled="saving || !amount" @click="amount = ''">
                Clear
              </button>
            </div>
          </div>
        </form>

        <div style="margin-top: 1.25rem;">
          <div class="header-layout" style="margin-bottom: 0.75rem;">
            <h3 style="margin: 0;">Recent disbursements</h3>
            <span class="tiny muted">{{ selectedProfile.recentDisbursements.length }} shown</span>
          </div>

          <div class="list">
            <div
              v-for="entry in selectedProfile.recentDisbursements"
              :key="entry.id"
              class="list-item"
            >
              <strong>{{ formatRobux(entry.amount) }}</strong>
              <p class="tiny muted" style="margin: 0.35rem 0 0;">Recorded {{ new Date(entry.createdAt).toLocaleString() }}</p>
            </div>
            <div v-if="!selectedProfile.recentDisbursements.length" class="list-item tiny muted">
              No disbursements have been recorded for this child yet.
            </div>
          </div>
        </div>
      </article>
    </section>

    <section v-if="!selectedProfile && !pending" class="panel">
      <p class="feedback info">Add a child profile first, then return here to record Robux disbursements.</p>
    </section>
  </main>
</template>
