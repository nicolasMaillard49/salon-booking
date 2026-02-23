<template>
  <div class="min-h-screen bg-pink-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full">

      <!-- Header -->
      <div class="text-center mb-8">
        <UIcon name="i-heroicons-scissors" class="w-8 h-8 text-primary-500 mx-auto mb-2" />
        <h1 class="text-2xl font-bold text-pink-900">Mon Salon de Coiffure</h1>
      </div>

      <!-- Chargement -->
      <UCard v-if="pending" class="text-center py-10">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary-400 mx-auto animate-spin mb-3" />
        <p class="text-slate-500">Chargement de votre rendez-vous...</p>
      </UCard>

      <!-- Erreur -->
      <UCard v-else-if="error" class="text-center py-10">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-heroicons-link-slash" class="w-8 h-8 text-red-500" />
        </div>
        <h2 class="text-xl font-bold text-slate-800 mb-2">Lien invalide</h2>
        <p class="text-slate-500 mb-6">Ce rendez-vous est introuvable ou le lien a expiré.</p>
        <UButton to="/" variant="soft" color="primary">Retour à l'accueil</UButton>
      </UCard>

      <!-- RDV trouvé -->
      <UCard v-else-if="appointment">
        <template #header>
          <div class="text-center pt-2">
            <!-- Icône statut -->
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
              :class="statusBg"
            >
              <UIcon :name="statusIcon" class="w-8 h-8" :class="statusIconColor" />
            </div>
            <UBadge :color="statusColor" size="lg" variant="soft">
              {{ statusLabel }}
            </UBadge>
          </div>
        </template>

        <!-- Détails -->
        <div class="space-y-3 py-2">
          <div class="flex justify-between items-center py-2 border-b border-pink-100">
            <span class="text-sm text-slate-500 flex items-center gap-1.5">
              <UIcon name="i-heroicons-user" class="w-4 h-4" />
              Client
            </span>
            <span class="text-sm font-medium text-slate-800">
              {{ appointment.firstName }} {{ appointment.lastName }}
            </span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-pink-100">
            <span class="text-sm text-slate-500 flex items-center gap-1.5">
              <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
              Date
            </span>
            <span class="text-sm font-medium text-slate-800 capitalize">
              {{ formatDate(appointment.date) }}
            </span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-slate-500 flex items-center gap-1.5">
              <UIcon name="i-heroicons-clock" class="w-4 h-4" />
              Demandé le
            </span>
            <span class="text-sm font-medium text-slate-800">
              {{ formatDate(appointment.createdAt) }}
            </span>
          </div>
        </div>

        <!-- Alerte statut -->
        <UAlert
          v-if="appointment.status === 'PENDING'"
          color="yellow"
          variant="soft"
          description="Votre demande est en attente de confirmation. Vous recevrez un email dès validation."
          icon="i-heroicons-clock"
          class="mt-4"
        />
        <UAlert
          v-else-if="appointment.status === 'CONFIRMED'"
          color="green"
          variant="soft"
          description="Votre rendez-vous est confirmé. À bientôt !"
          icon="i-heroicons-check-circle"
          class="mt-4"
        />
        <UAlert
          v-else
          color="red"
          variant="soft"
          description="Ce rendez-vous a été annulé. Vous pouvez en réserver un autre."
          icon="i-heroicons-x-circle"
          class="mt-4"
        />

        <template #footer>
          <UButton to="/" variant="soft" color="primary" block>
            Retour à l'accueil
          </UButton>
        </template>
      </UCard>

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
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  CANCELLED: 'Annulé',
}[appointment.value?.status ?? 'PENDING']))

const statusColor = computed(() => ({
  PENDING: 'yellow' as const,
  CONFIRMED: 'green' as const,
  CANCELLED: 'red' as const,
}[appointment.value?.status ?? 'PENDING']))

const statusBg = computed(() => ({
  PENDING: 'bg-yellow-100',
  CONFIRMED: 'bg-green-100',
  CANCELLED: 'bg-red-100',
}[appointment.value?.status ?? 'PENDING']))

const statusIcon = computed(() => ({
  PENDING: 'i-heroicons-clock',
  CONFIRMED: 'i-heroicons-check-circle',
  CANCELLED: 'i-heroicons-x-circle',
}[appointment.value?.status ?? 'PENDING']))

const statusIconColor = computed(() => ({
  PENDING: 'text-yellow-600',
  CONFIRMED: 'text-green-600',
  CANCELLED: 'text-red-600',
}[appointment.value?.status ?? 'PENDING']))

function formatDate(date: string) {
  return format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr })
}
</script>
