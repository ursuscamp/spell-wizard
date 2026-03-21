<script setup lang="ts">
import type { Profile } from '~~/shared/spelling'

const props = defineProps<{
  open: boolean
  profile?: Profile | null
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: { name: string; birthdate: string; avatarUri?: string }]
}>()

const name = ref('')
const birthdate = ref('')
const avatarUri = ref('')
const error = ref('')

watch(() => props.open, (value) => {
  if (value) {
    name.value = props.profile?.name ?? ''
    birthdate.value = props.profile?.birthdate ?? ''
    avatarUri.value = props.profile?.avatarUri ?? ''
    error.value = ''
  }
})

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    error.value = 'Choose a picture file for the profile avatar.'
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    avatarUri.value = String(reader.result ?? '')
  }
  reader.readAsDataURL(file)
}

function submit() {
  if (!name.value.trim() || !birthdate.value) {
    error.value = 'Please add a child name and birthdate.'
    return
  }

  emit('submit', {
    name: name.value.trim(),
    birthdate: birthdate.value,
    avatarUri: avatarUri.value || undefined
  })
}
</script>

<template>
  <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card">
      <div class="header-layout" style="margin-bottom: 1rem;">
        <div>
          <div class="badge">{{ profile ? 'Edit wizard' : 'New wizard' }}</div>
          <h2 style="margin: 0.7rem 0 0;">{{ profile ? `Update ${profile.name}` : 'Create a child profile' }}</h2>
        </div>
        <button class="button-ghost" type="button" @click="emit('close')">Close</button>
      </div>

      <div class="form-grid">
        <label class="field">
          <span>Child name</span>
          <input v-model="name" type="text" maxlength="40" placeholder="Luna" />
        </label>

        <label class="field">
          <span>Birthdate</span>
          <input v-model="birthdate" type="date" />
        </label>

        <label class="field">
          <span>Profile picture</span>
          <input type="file" accept="image/*" @change="handleFileChange" />
        </label>

        <div class="button-row" style="align-items: center;">
          <div class="avatar-preview">
            <img v-if="avatarUri" :src="avatarUri" alt="Profile preview" />
            <span v-else>✨</span>
          </div>
          <p class="helper-text tiny" style="margin: 0; max-width: 16rem;">Pick any fun picture your child likes. It stays on your household server with the profile.</p>
        </div>

        <p v-if="error" class="feedback error">{{ error }}</p>

        <div class="button-row">
          <button class="button-secondary" type="button" @click="submit">{{ profile ? 'Save profile' : 'Create profile' }}</button>
          <button class="button-ghost" type="button" @click="emit('close')">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
