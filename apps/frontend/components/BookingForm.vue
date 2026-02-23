<template>
  <div class="rounded-2xl overflow-hidden border border-zinc-200 shadow-sm">

    <!-- Header billet — fond indigo foncé -->
    <div class="bg-indigo-950 px-6 py-5 relative">
      <!-- Pattern points subtil -->
      <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle, #fff 1px, transparent 1px); background-size: 16px 16px;" />

      <div class="relative flex items-start justify-between gap-4">
        <div>
          <p class="text-indigo-400 text-xs font-mono uppercase tracking-widest mb-1">Nm.D.Barber — Réservation</p>
          <p class="text-white text-lg font-semibold capitalize leading-tight">{{ formatDate(date) }}</p>
        </div>
        <div class="flex flex-col items-end shrink-0">
          <span class="text-indigo-400 text-xs font-mono uppercase tracking-widest mb-1">Prix</span>
          <span class="text-white text-2xl font-bold font-mono">10 €</span>
        </div>
      </div>

      <!-- Bande de coupe ticket -->
      <div class="absolute -bottom-px left-0 right-0 flex">
        <div class="h-3 w-4 bg-zinc-50 rounded-tr-full" />
        <div class="flex-1 border-b-2 border-dashed border-indigo-800/60" />
        <div class="h-3 w-4 bg-zinc-50 rounded-tl-full" />
      </div>
    </div>

    <!-- Encoche gauche + droite -->
    <div class="relative bg-white px-6 pt-6 pb-6">
      <div class="absolute -top-3.5 -left-3.5 w-7 h-7 rounded-full bg-zinc-50 border border-zinc-200" />
      <div class="absolute -top-3.5 -right-3.5 w-7 h-7 rounded-full bg-zinc-50 border border-zinc-200" />

      <UForm :state="form" @submit="onSubmit" class="space-y-4">

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Prénom" name="firstName" required>
            <UInput
              v-model="form.firstName"
              placeholder="Jean"
              icon="i-heroicons-user"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Nom" name="lastName" required>
            <UInput
              v-model="form.lastName"
              placeholder="Dupont"
              icon="i-heroicons-identification"
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
          class="cursor-pointer mt-2"
        >
          <span class="flex items-center gap-2">
            Réserver pour 10 €
            <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
          </span>
        </UButton>

        <p class="text-center text-xs text-zinc-400 font-mono">
          Un email de confirmation vous sera envoyé
        </p>

      </UForm>
    </div>

  </div>
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
