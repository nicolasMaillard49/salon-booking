<template>
  <div
    class="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-200 hover:shadow-sm hover:border-zinc-300"
  >
    <!-- Avatar + infos -->
    <div class="flex items-center gap-3 min-w-0">
      <!-- Avatar initiales avec gradient -->
      <div
        class="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-semibold text-white shrink-0 select-none"
        :class="avatarGradient"
      >
        {{ appointment.firstName[0] }}{{ appointment.lastName[0] }}
      </div>

      <div class="min-w-0">
        <p class="font-semibold text-zinc-900 truncate leading-tight">
          {{ appointment.firstName }} {{ appointment.lastName }}
        </p>
        <p class="text-xs font-mono text-zinc-500 capitalize mt-0.5">
          {{ formatDate(appointment.date) }}
        </p>
        <p class="text-xs text-zinc-400 truncate">{{ appointment.email }}</p>
      </div>
    </div>

    <!-- Status + actions -->
    <div class="flex items-center gap-2 shrink-0">
      <!-- Statut avec dot animé pour PENDING -->
      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" :class="statusBadgeClass">
        <span
          class="w-1.5 h-1.5 rounded-full shrink-0"
          :class="[statusDotClass, appointment.status === 'PENDING' ? 'animate-pulse' : '']"
        />
        {{ statusLabel }}
      </div>

      <!-- Actions (uniquement si EN ATTENTE) -->
      <template v-if="appointment.status === 'PENDING'">
        <UButton
          icon="i-heroicons-check"
          color="emerald"
          variant="soft"
          size="xs"
          :loading="loadingConfirm"
          class="cursor-pointer"
          @click="handleConfirm"
        />
        <UButton
          icon="i-heroicons-x-mark"
          color="red"
          variant="soft"
          size="xs"
          :loading="loadingCancel"
          class="cursor-pointer"
          @click="handleCancel"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Appointment } from '~/composables/useAppointments'

const props = defineProps<{ appointment: Appointment }>()
const emit = defineEmits<{
  confirm: [id: string]
  cancel: [id: string]
}>()

const loadingConfirm = ref(false)
const loadingCancel = ref(false)

const avatarGradient = computed(() => ({
  PENDING: 'bg-gradient-to-br from-amber-400 to-orange-500',
  CONFIRMED: 'bg-gradient-to-br from-emerald-400 to-teal-600',
  CANCELLED: 'bg-gradient-to-br from-zinc-300 to-zinc-400',
}[props.appointment.status]))

const statusLabel = computed(() => ({
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  CANCELLED: 'Annulé',
}[props.appointment.status]))

const statusBadgeClass = computed(() => ({
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CANCELLED: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
}[props.appointment.status]))

const statusDotClass = computed(() => ({
  PENDING: 'bg-amber-500',
  CONFIRMED: 'bg-emerald-500',
  CANCELLED: 'bg-zinc-400',
}[props.appointment.status]))

function formatDate(date: string) {
  return format(new Date(date), 'EEEE d MMMM', { locale: fr })
}

function handleConfirm() {
  loadingConfirm.value = true
  emit('confirm', props.appointment.id)
}

function handleCancel() {
  loadingCancel.value = true
  emit('cancel', props.appointment.id)
}
</script>
