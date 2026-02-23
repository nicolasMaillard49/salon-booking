<template>
  <div class="min-h-screen">

    <!-- Nav -->
    <div class="fixed top-4 left-4 right-4 z-20 flex items-center justify-between">
      <UButton to="/" icon="i-heroicons-arrow-left" variant="ghost" color="gray" size="sm" class="bg-white/80 backdrop-blur border border-zinc-200 cursor-pointer">
        Retour
      </UButton>
      <div class="bg-white/80 backdrop-blur border border-zinc-200 rounded-full px-4 py-1.5">
        <span class="text-xs font-mono text-zinc-500 tracking-wider uppercase">Nm.D.Barber</span>
      </div>
    </div>

    <div class="max-w-2xl mx-auto pt-24 pb-12 px-4">

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight text-zinc-900 mb-1">Mes rendez-vous</h1>
        <p class="text-zinc-500 text-sm">Retrouve tous tes RDV en entrant ton adresse email.</p>
      </div>

      <!-- Formulaire recherche -->
      <div class="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm mb-6">
        <UForm :state="form" @submit="search" class="flex gap-3">
          <UInput
            v-model="form.email"
            type="email"
            placeholder="ton@email.com"
            icon="i-heroicons-envelope"
            size="lg"
            class="flex-1 font-mono"
            :disabled="loading"
          />
          <UButton
            type="submit"
            :loading="loading"
            :disabled="!form.email"
            size="lg"
            color="primary"
            icon="i-heroicons-magnifying-glass"
            class="cursor-pointer"
          />
        </UForm>
      </div>

      <!-- Résultats -->
      <Transition name="fade">
        <div v-if="searched">

          <!-- Aucun résultat -->
          <div
            v-if="appointments.length === 0"
            class="bg-white border border-zinc-200 rounded-2xl p-10 text-center shadow-sm"
          >
            <UIcon name="i-heroicons-calendar-x-mark" class="w-10 h-10 text-zinc-200 mx-auto mb-3" />
            <p class="text-sm font-mono text-zinc-400">Aucun rendez-vous trouvé pour cet email.</p>
          </div>

          <!-- Liste -->
          <div v-else class="space-y-3">
            <p class="text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">
              {{ appointments.length }} rendez-vous trouvé{{ appointments.length > 1 ? 's' : '' }}
            </p>

            <NuxtLink
              v-for="appt in appointments"
              :key="appt.id"
              :to="`/booking/${appt.magicToken}`"
              class="block bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 hover:shadow-sm transition-all duration-200 cursor-pointer group"
            >
              <div class="flex items-center justify-between gap-4">
                <!-- Infos -->
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold text-white shrink-0"
                    :class="avatarClass(appt.status)"
                  >
                    {{ appt.firstName[0] }}{{ appt.lastName[0] }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-zinc-900 truncate text-sm">
                      {{ appt.firstName }} {{ appt.lastName }}
                    </p>
                    <p class="text-xs font-mono text-zinc-500 capitalize mt-0.5">
                      {{ formatDate(appt.date) }}
                    </p>
                  </div>
                </div>

                <!-- Statut + chevron -->
                <div class="flex items-center gap-2 shrink-0">
                  <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border" :class="badgeClass(appt.status)">
                    <span class="w-1.5 h-1.5 rounded-full" :class="[dotClass(appt.status), appt.status === 'PENDING' ? 'animate-pulse' : '']" />
                    {{ statusLabel(appt.status) }}
                  </div>
                  <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </Transition>

    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const { getByEmail } = useAppointments()

const form = reactive({ email: '' })
const loading = ref(false)
const searched = ref(false)
const appointments = ref<any[]>([])

async function search() {
  loading.value = true
  searched.value = false
  try {
    appointments.value = await getByEmail(form.email)
    searched.value = true
  } catch {
    appointments.value = []
    searched.value = true
  } finally {
    loading.value = false
  }
}

function formatDate(date: string) {
  return format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr })
}

function statusLabel(status: string) {
  return { PENDING: 'En attente', CONFIRMED: 'Confirmé', CANCELLED: 'Annulé' }[status] ?? status
}

function avatarClass(status: string) {
  return {
    PENDING: 'bg-gradient-to-br from-amber-400 to-orange-500',
    CONFIRMED: 'bg-gradient-to-br from-emerald-400 to-teal-600',
    CANCELLED: 'bg-gradient-to-br from-zinc-300 to-zinc-400',
  }[status] ?? 'bg-zinc-300'
}

function badgeClass(status: string) {
  return {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  }[status] ?? ''
}

function dotClass(status: string) {
  return { PENDING: 'bg-amber-500', CONFIRMED: 'bg-emerald-500', CANCELLED: 'bg-zinc-400' }[status] ?? ''
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
