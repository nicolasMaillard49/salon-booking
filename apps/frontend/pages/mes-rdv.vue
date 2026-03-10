<template>
  <div class="min-h-screen bg-white">
    <!-- Header Section -->
    <section class="bg-zinc-900 py-16 md:py-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-4xl md:text-5xl font-bold text-white">
          Retrouvez vos rendez-vous
        </h1>
        <p class="text-zinc-400 mt-4 text-lg">
          Entrez votre adresse email pour consulter vos réservations
        </p>
      </div>
    </section>

    <!-- Search Section -->
    <section class="py-12 md:py-20">
      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Search Form -->
        <div class="bg-white rounded-2xl p-6 md:p-8 border border-zinc-200 shadow-sm mb-8">
          <UForm :state="form" @submit="search" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-zinc-700 mb-2">Votre adresse email</label>
              <div class="relative">
                <UIcon name="i-heroicons-envelope" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="vous@email.com"
                  class="w-full pl-12 pr-4 py-3 md:py-4 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all text-base md:text-lg"
                  :disabled="loading"
                />
              </div>
            </div>

            <button
              type="submit"
              :disabled="!form.email || loading"
              class="w-full bg-zinc-900 text-white py-3 md:py-4 rounded-xl font-semibold hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <template v-else>
                <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5" />
                Rechercher mes RDV
              </template>
            </button>
          </UForm>
        </div>

        <!-- Results -->
        <Transition name="fade">
          <div v-if="searched">
            <!-- Empty State -->
            <div v-if="appointments.length === 0" class="text-center py-16">
              <div class="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UIcon name="i-heroicons-calendar" class="w-10 h-10 text-zinc-300" />
              </div>
              <h3 class="text-xl font-semibold text-zinc-900 mb-2">Aucun rendez-vous trouvé</h3>
              <p class="text-zinc-500 mb-6">Cet email n'a pas de réservation pour le moment.</p>
              <NuxtLink 
                to="/"
                class="inline-flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-full font-medium hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                Prendre rendez-vous
              </NuxtLink>
            </div>

            <!-- Appointments List -->
            <div v-else class="space-y-4">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-2xl font-bold text-zinc-900">Vos rendez-vous</h2>
                  <p class="text-zinc-500 text-sm mt-1">
                    {{ appointments.length }} rendez-vous trouvé{{ appointments.length > 1 ? 's' : '' }}
                  </p>
                </div>
                <button 
                  @click="searched = false; form.email = ''"
                  class="text-zinc-600 hover:text-zinc-900 text-sm font-medium transition-colors"
                >
                  Modifier
                </button>
              </div>

              <div class="space-y-3">
                <NuxtLink
                  v-for="appt in appointments"
                  :key="appt.id"
                  :to="`/booking/${appt.magicToken}`"
                  class="block bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 hover:border-zinc-300 hover:shadow-md transition-all duration-200 group"
                >
                  <div class="flex items-center justify-between gap-4">
                    <!-- Left: Avatar + Info -->
                    <div class="flex items-start gap-4 min-w-0 flex-1">
                      <div
                        class="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 flex-shrink-0"
                        :class="avatarClass(appt.status)"
                      >
                        {{ appt.firstName.charAt(0) }}{{ appt.lastName.charAt(0) }}
                      </div>
                      <div class="min-w-0 flex-1">
                        <h3 class="font-semibold text-zinc-900">
                          {{ appt.firstName }} {{ appt.lastName }}
                        </h3>
                        <p class="text-zinc-500 text-sm mt-1">
                          <span class="flex items-center gap-1.5">
                            <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                            {{ formatDate(appt.date) }}
                          </span>
                        </p>
                        <p class="text-zinc-500 text-sm mt-0.5">
                          <span class="flex items-center gap-1.5">
                            <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                            {{ appt.timeSlot }}
                          </span>
                        </p>
                      </div>
                    </div>

                    <!-- Right: Status + Arrow -->
                    <div class="flex items-center gap-3 shrink-0">
                      <div 
                        class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium border"
                        :class="badgeClass(appt.status)"
                      >
                        <span 
                          class="w-2 h-2 rounded-full"
                          :class="[dotClass(appt.status), appt.status === 'PENDING' ? 'animate-pulse' : '']"
                        />
                        {{ statusLabel(appt.status) }}
                      </div>
                      <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
                    </div>
                  </div>
                </NuxtLink>
              </div>

              <!-- CTA -->
              <div class="mt-8 p-6 bg-zinc-50 rounded-2xl border border-zinc-200 text-center">
                <p class="text-zinc-600 mb-4">Vous désirez prendre un autre rendez-vous ?</p>
                <NuxtLink 
                  to="/"
                  class="inline-flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-full font-medium hover:bg-zinc-800 transition-colors"
                >
                  <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                  Nouvelle réservation
                </NuxtLink>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </section>
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
  try {
    appointments.value = await getByEmail(form.email)
    searched.value = true
  } catch (e) {
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
  const labels = {
    PENDING: 'En attente',
    CONFIRMED: 'Confirmé',
    CANCELLED: 'Annulé'
  }
  return labels[status as keyof typeof labels] || status
}

function avatarClass(status: string) {
  const classes = {
    PENDING: 'bg-gradient-to-br from-yellow-400 to-orange-500',
    CONFIRMED: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    CANCELLED: 'bg-gradient-to-br from-zinc-300 to-zinc-400'
  }
  return classes[status as keyof typeof classes] || 'bg-zinc-400'
}

function badgeClass(status: string) {
  const classes = {
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-zinc-100 text-zinc-600 border-zinc-200'
  }
  return classes[status as keyof typeof classes] || ''
}

function dotClass(status: string) {
  const colors = {
    PENDING: 'bg-yellow-500',
    CONFIRMED: 'bg-emerald-500',
    CANCELLED: 'bg-zinc-400'
  }
  return colors[status as keyof typeof colors] || 'bg-zinc-400'
}

// SEO
useHead({
  title: 'Mes rendez-vous | Nm.D.Barber',
  meta: [
    { 
      name: 'description', 
      content: 'Consultez et gérez vos rendez-vous chez Nm.D.Barber' 
    }
  ]
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>