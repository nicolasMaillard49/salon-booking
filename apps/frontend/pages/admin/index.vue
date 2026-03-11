<template>
  <div class="min-h-screen bg-zinc-50">
    <!-- Admin Nav -->
    <AdminNav />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-zinc-900">Gestion des rendez-vous</h1>
          <p class="text-zinc-600 mt-1">Tous les RDV de la semaine</p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink 
            to="/admin/indisponibilite"
            class="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <UIcon name="i-heroicons-calendar-x-mark" class="w-5 h-5" />
            Indisponibilité
          </NuxtLink>
          <NuxtLink 
            to="/admin/photos"
            class="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <UIcon name="i-heroicons-photo" class="w-5 h-5" />
            Gérer les photos
          </NuxtLink>
        </div>
      </div>

      <!-- Week Navigation -->
      <div class="bg-white border border-zinc-200 rounded-xl p-4 md:p-6 shadow-sm mb-6 flex items-center justify-between">
        <button
          @click="prevWeek"
          :disabled="loading"
          class="p-2 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-40"
        >
          <UIcon name="i-heroicons-chevron-left" class="w-6 h-6 text-zinc-600" />
        </button>

        <div class="text-center flex-1">
          <p class="text-sm text-zinc-500 uppercase tracking-wider font-semibold mb-1">Semaine du</p>
          <p class="text-xl md:text-2xl font-bold text-zinc-900 capitalize">
            {{ weekLabel }}
          </p>
        </div>

        <button
          @click="nextWeek"
          :disabled="loading"
          class="p-2 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-40"
        >
          <UIcon name="i-heroicons-chevron-right" class="w-6 h-6 text-zinc-600" />
        </button>
      </div>

      <!-- Stats Grid -->
      <div v-if="weekData && !loading" class="grid md:grid-cols-3 gap-4 mb-8">
        <div class="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-zinc-600">Total RDV</span>
            <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-zinc-400" />
          </div>
          <p class="text-4xl font-bold text-zinc-900">{{ weekData.total }}</p>
        </div>

        <div class="bg-white border border-yellow-200 rounded-xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-yellow-700">En attente</span>
            <span class="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
          </div>
          <p class="text-4xl font-bold text-yellow-600">{{ weekData.pending }}</p>
        </div>

        <div class="bg-white border border-emerald-200 rounded-xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-emerald-700">Confirmés</span>
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-emerald-500" />
          </div>
          <p class="text-4xl font-bold text-emerald-600">{{ weekData.confirmed }}</p>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="loading" class="space-y-3">
        <div v-for="n in 3" :key="n" class="h-20 bg-zinc-200 rounded-xl animate-pulse" />
      </div>

      <!-- Empty State -->
      <div v-else-if="!weekData || weekData.appointments.length === 0" class="bg-white border border-zinc-200 rounded-xl p-12 text-center">
        <div class="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-heroicons-calendar-x-mark" class="w-8 h-8 text-zinc-400" />
        </div>
        <h3 class="text-lg font-semibold text-zinc-900">Aucun rendez-vous</h3>
        <p class="text-zinc-600 mt-1">Pas de réservations cette semaine</p>
      </div>

      <!-- Appointments List -->
      <div v-else class="space-y-3">
        <AdminAppointmentCard
          v-for="appt in weekData.appointments"
          :key="appt.id"
          :appointment="appt"
          @confirm="confirmAppt"
          @cancel="cancelAppt"
          @delete="deleteAppt"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format, addWeeks, subWeeks, startOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'

definePageMeta({ middleware: 'auth-admin' })

const { getWeek, updateStatus, deleteAppointment } = useAppointments()
const adminPassword = useCookie('admin_password')

const currentWeek = ref(new Date())
const weekData = ref<any>(null)
const loading = ref(false)

const weekLabel = computed(() => {
  const start = startOfWeek(currentWeek.value)
  return format(start, 'd MMMM yyyy', { locale: fr })
})

async function loadWeek() {
  loading.value = true
  try {
    weekData.value = await getWeek(
      format(currentWeek.value, 'yyyy-MM-dd'),
      adminPassword.value!
    )
  } catch (e) {
    console.error('Error loading week:', e)
  } finally {
    loading.value = false
  }
}

function prevWeek() {
  currentWeek.value = subWeeks(currentWeek.value, 1)
  loadWeek()
}

function nextWeek() {
  currentWeek.value = addWeeks(currentWeek.value, 1)
  loadWeek()
}

async function confirmAppt(id: string) {
  try {
    await updateStatus(id, 'CONFIRMED', adminPassword.value!)
    await loadWeek()
  } catch (e) {
    console.error('Error confirming:', e)
  }
}

async function cancelAppt(id: string) {
  try {
    await updateStatus(id, 'CANCELLED', adminPassword.value!)
    await loadWeek()
  } catch (e) {
    console.error('Error cancelling:', e)
  }
}

async function deleteAppt(id: string) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce RDV ?')) {
    try {
      await deleteAppointment(id, adminPassword.value!)
      await loadWeek()
    } catch (e) {
      console.error('Error deleting:', e)
    }
  }
}

onMounted(loadWeek)
</script>