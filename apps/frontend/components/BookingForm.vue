<template>
  <UForm :state="form" @submit="onSubmit" class="space-y-5">

    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Prénom" name="firstName" required>
        <UInput
          v-model="form.firstName"
          placeholder="Jean"
          icon="i-heroicons-user"
          size="lg"
          class="w-full"
          :ui="{ icon: { trailing: { pointer: '' } } }"
        />
      </UFormField>

      <UFormField label="Nom" name="lastName" required>
        <UInput
          v-model="form.lastName"
          placeholder="Dupont"
          icon="i-heroicons-user"
          size="lg"
          class="w-full"
        />
      </UFormField>
    </div>

    <UFormField label="Adresse email" name="email" required>
      <UInput
        v-model="form.email"
        type="email"
        placeholder="jean@email.com"
        icon="i-heroicons-envelope"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <!-- Info date sélectionnée -->
    <div class="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
      <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-indigo-500 shrink-0" />
      <div>
        <p class="text-xs text-indigo-500 font-medium uppercase tracking-wider">Rendez-vous sélectionné</p>
        <p class="text-sm font-mono font-medium text-indigo-800 capitalize">{{ formatDate(date) }}</p>
      </div>
    </div>

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
      :disabled="!form.firstName || !form.lastName || !form.email"
      block
      size="lg"
      color="primary"
      icon="i-heroicons-arrow-right"
      trailing
    >
      Confirmer la demande
    </UButton>
  </UForm>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const props = defineProps<{ date: string }>()
const emit = defineEmits<{ success: [] }>()
const { createAppointment } = useAppointments()

const loading = ref(false)
const error = ref('')
const form = reactive({ firstName: '', lastName: '', email: '' })

function formatDate(date: string) {
  return format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr })
}

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
