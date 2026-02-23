<template>
  <UForm :state="form" @submit="onSubmit" class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Prénom" name="firstName" required>
        <UInput
          v-model="form.firstName"
          placeholder="Jean"
          icon="i-heroicons-user"
          size="md"
        />
      </UFormField>

      <UFormField label="Nom" name="lastName" required>
        <UInput
          v-model="form.lastName"
          placeholder="Dupont"
          icon="i-heroicons-user"
          size="md"
        />
      </UFormField>
    </div>

    <UFormField label="Adresse email" name="email" required>
      <UInput
        v-model="form.email"
        type="email"
        placeholder="jean@email.com"
        icon="i-heroicons-envelope"
        size="md"
      />
    </UFormField>

    <UAlert
      v-if="error"
      color="red"
      variant="soft"
      :description="error"
      icon="i-heroicons-exclamation-triangle"
    />

    <UButton
      type="submit"
      :loading="loading"
      block
      size="lg"
      color="primary"
      class="mt-2"
    >
      Confirmer ma demande de rendez-vous
    </UButton>
  </UForm>
</template>

<script setup lang="ts">
const props = defineProps<{ date: string }>()
const emit = defineEmits<{ success: [] }>()
const { createAppointment } = useAppointments()

const loading = ref(false)
const error = ref('')
const form = reactive({ firstName: '', lastName: '', email: '' })

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await createAppointment({ ...form, date: props.date })
    emit('success')
  } catch (e: any) {
    error.value = e?.data?.message || 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}
</script>
