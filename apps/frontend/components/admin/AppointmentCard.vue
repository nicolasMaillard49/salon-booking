<template>
  <UCard
    class="transition-shadow duration-200 hover:shadow-md cursor-default"
    :ui="{ body: { padding: 'p-4' } }"
  >
    <div class="flex items-center justify-between gap-4">
      <!-- Infos client -->
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
          <span class="text-primary-700 font-semibold text-sm">
            {{ appointment.firstName[0] }}{{ appointment.lastName[0] }}
          </span>
        </div>
        <div class="min-w-0">
          <p class="font-semibold text-slate-800 truncate">
            {{ appointment.firstName }} {{ appointment.lastName }}
          </p>
          <p class="text-sm text-slate-500 capitalize">{{ formatDate(appointment.date) }}</p>
          <p class="text-xs text-slate-400 truncate">{{ appointment.email }}</p>
        </div>
      </div>

      <!-- Statut + Actions -->
      <div class="flex items-center gap-2 shrink-0">
        <UBadge :color="statusColor" variant="soft" size="sm">
          {{ statusLabel }}
        </UBadge>

        <template v-if="appointment.status === 'PENDING'">
          <UButton
            icon="i-heroicons-check"
            color="green"
            variant="soft"
            size="sm"
            :loading="loadingConfirm"
            @click="handleConfirm"
          />
          <UButton
            icon="i-heroicons-x-mark"
            color="red"
            variant="soft"
            size="sm"
            :loading="loadingCancel"
            @click="handleCancel"
          />
        </template>
      </div>
    </div>
  </UCard>
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

const statusLabel = computed(() => ({
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  CANCELLED: 'Annulé',
}[props.appointment.status]))

const statusColor = computed(() => ({
  PENDING: 'yellow' as const,
  CONFIRMED: 'green' as const,
  CANCELLED: 'red' as const,
}[props.appointment.status]))

function formatDate(date: string) {
  return format(new Date(date), 'EEEE d MMMM', { locale: fr })
}

async function handleConfirm() {
  loadingConfirm.value = true
  emit('confirm', props.appointment.id)
}

async function handleCancel() {
  loadingCancel.value = true
  emit('cancel', props.appointment.id)
}
</script>
