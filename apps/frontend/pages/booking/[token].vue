<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full">

      <!-- Brand -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 mb-4">
          <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-scissors" class="w-4 h-4 text-white" />
          </div>
          <span class="font-semibold text-zinc-900 tracking-tight">Nm.D.Barber</span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="bg-white border border-zinc-200 rounded-2xl p-10 text-center">
        <UIcon name="i-heroicons-arrow-path" class="w-7 h-7 text-indigo-400 mx-auto animate-spin mb-3" />
        <p class="text-sm text-zinc-500 font-mono">Chargement du rendez-vous...</p>
      </div>

      <!-- Erreur -->
      <div v-else-if="error" class="bg-white border border-zinc-200 rounded-2xl p-10 text-center">
        <div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-heroicons-link-slash" class="w-7 h-7 text-red-400" />
        </div>
        <h2 class="text-xl font-bold text-zinc-900 mb-2">Lien invalide</h2>
        <p class="text-sm text-zinc-500 mb-6">Ce rendez-vous est introuvable ou le lien a expiré.</p>
        <UButton to="/" variant="outline" color="gray" size="sm">Retour à l'accueil</UButton>
      </div>

      <!-- RDV trouvé -->
      <div v-else-if="appointment" class="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">

        <!-- Header statut -->
        <div class="p-6 text-center border-b border-zinc-100" :class="statusHeaderBg">
          <div
            class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
            :class="statusIconBg"
          >
            <UIcon :name="statusIcon" class="w-8 h-8" :class="statusIconColor" />
          </div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border" :class="statusBadgeClass">
            <span class="w-1.5 h-1.5 rounded-full" :class="[statusDot, appointment.status === 'PENDING' ? 'animate-pulse' : '']" />
            {{ statusLabel }}
          </div>
        </div>

        <!-- Détails -->
        <div class="p-6 space-y-3">
          <div class="flex justify-between items-center py-2.5 border-b border-zinc-50">
            <span class="text-xs font-mono text-zinc-400 uppercase tracking-wider">Client</span>
            <span class="text-sm font-semibold text-zinc-800">
              {{ appointment.firstName }} {{ appointment.lastName }}
            </span>
          </div>
          <div class="flex justify-between items-center py-2.5 border-b border-zinc-50">
            <span class="text-xs font-mono text-zinc-400 uppercase tracking-wider">Date</span>
            <span class="text-sm font-mono font-medium text-zinc-800 capitalize">
              {{ formatDate(appointment.date) }}
            </span>
          </div>
          <div class="flex justify-between items-center py-2.5">
            <span class="text-xs font-mono text-zinc-400 uppercase tracking-wider">Demandé le</span>
            <span class="text-sm font-mono text-zinc-600">
              {{ formatDate(appointment.createdAt) }}
            </span>
          </div>

          <UAlert
            v-if="appointment.status === 'PENDING'"
            color="yellow"
            variant="soft"
            description="Votre demande est en attente de confirmation. Vous recevrez un email dès validation."
            icon="i-heroicons-clock"
            class="mt-2"
          />
          <UAlert
            v-else-if="appointment.status === 'CONFIRMED'"
            color="green"
            variant="soft"
            description="Votre rendez-vous est confirmé. À bientôt !"
            icon="i-heroicons-check-circle"
            class="mt-2"
          />
          <UAlert
            v-else
            color="red"
            variant="soft"
            description="Ce rendez-vous a été annulé. Vous pouvez en réserver un autre."
            icon="i-heroicons-x-circle"
            class="mt-2"
          />
        </div>

        <div class="px-6 pb-6">
          <UButton to="/" variant="outline" color="gray" block>
            Retour à l'accueil
          </UButton>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const route = useRoute()
const { getByToken } = useAppointments()

const { data: appointment, pending, error } = await useAsyncData(
  'appointment',
  () => getByToken(route.params.token as string)
)

const statusLabel = computed(() => ({
  PENDING: 'En attente', CONFIRMED: 'Confirmé', CANCELLED: 'Annulé',
}[appointment.value?.status ?? 'PENDING']))

const statusHeaderBg = computed(() => ({
  PENDING: 'bg-amber-50', CONFIRMED: 'bg-emerald-50', CANCELLED: 'bg-zinc-50',
}[appointment.value?.status ?? 'PENDING']))

const statusIconBg = computed(() => ({
  PENDING: 'bg-amber-100', CONFIRMED: 'bg-emerald-100', CANCELLED: 'bg-zinc-100',
}[appointment.value?.status ?? 'PENDING']))

const statusIcon = computed(() => ({
  PENDING: 'i-heroicons-clock', CONFIRMED: 'i-heroicons-check-circle', CANCELLED: 'i-heroicons-x-circle',
}[appointment.value?.status ?? 'PENDING']))

const statusIconColor = computed(() => ({
  PENDING: 'text-amber-500', CONFIRMED: 'text-emerald-500', CANCELLED: 'text-zinc-400',
}[appointment.value?.status ?? 'PENDING']))

const statusBadgeClass = computed(() => ({
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-zinc-100 text-zinc-500 border-zinc-200',
}[appointment.value?.status ?? 'PENDING']))

const statusDot = computed(() => ({
  PENDING: 'bg-amber-500', CONFIRMED: 'bg-emerald-500', CANCELLED: 'bg-zinc-400',
}[appointment.value?.status ?? 'PENDING']))

function formatDate(date: string) {
  return format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr })
}
</script>
