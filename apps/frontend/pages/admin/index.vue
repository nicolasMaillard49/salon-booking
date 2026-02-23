<template>
  <div class="min-h-screen bg-pink-50">
    <div class="max-w-3xl mx-auto py-8 px-4">

      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <UIcon name="i-heroicons-scissors" class="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-pink-900">Tableau de bord</h1>
            <p class="text-xs text-slate-400">Mon Salon de Coiffure</p>
          </div>
        </div>
        <UButton
          variant="ghost"
          color="gray"
          icon="i-heroicons-arrow-left-on-rectangle"
          size="sm"
          @click="logout"
        >
          Déconnexion
        </UButton>
      </div>

      <!-- Navigation semaine -->
      <UCard class="mb-5 shadow-sm">
        <div class="flex items-center justify-between">
          <UButton icon="i-heroicons-chevron-left" variant="ghost" color="primary" @click="prevWeek" />
          <div class="text-center">
            <p class="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Semaine du</p>
            <p class="font-semibold text-pink-900 capitalize">{{ weekLabel }}</p>
          </div>
          <UButton icon="i-heroicons-chevron-right" variant="ghost" color="primary" @click="nextWeek" />
        </div>
      </UCard>

      <!-- Stats -->
      <div v-if="weekData" class="grid grid-cols-3 gap-4 mb-5">
        <UCard class="text-center shadow-sm" :ui="{ body: { padding: 'py-4 px-3' } }">
          <p class="text-3xl font-bold text-slate-700">{{ weekData.total }}</p>
          <p class="text-xs text-slate-400 mt-1 uppercase tracking-wider">Total</p>
        </UCard>
        <UCard class="text-center shadow-sm" :ui="{ body: { padding: 'py-4 px-3' } }">
          <p class="text-3xl font-bold text-yellow-500">{{ weekData.pending }}</p>
          <p class="text-xs text-slate-400 mt-1 uppercase tracking-wider">En attente</p>
        </UCard>
        <UCard class="text-center shadow-sm" :ui="{ body: { padding: 'py-4 px-3' } }">
          <p class="text-3xl font-bold text-green-500">{{ weekData.confirmed }}</p>
          <p class="text-xs text-slate-400 mt-1 uppercase tracking-wider">Confirmés</p>
        </UCard>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <UCard v-for="n in 3" :key="n" class="animate-pulse">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-pink-100 rounded-full" />
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-pink-100 rounded w-1/3" />
              <div class="h-3 bg-pink-50 rounded w-1/2" />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Vide -->
      <UCard v-else-if="weekData?.appointments.length === 0" class="text-center py-12 shadow-sm">
        <UIcon name="i-heroicons-calendar-x-mark" class="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p class="text-slate-400">Aucun rendez-vous cette semaine.</p>
      </UCard>

      <!-- Liste -->
      <div v-else class="space-y-3">
        <AdminAppointmentCard
          v-for="appt in weekData?.appointments"
          :key="appt.id"
          :appointment="appt"
          @confirm="confirmAppt"
          @cancel="cancelAppt"
        />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { format, addWeeks, subWeeks } from 'date-fns'
import { fr } from 'date-fns/locale'

definePageMeta({ middleware: 'auth-admin' })

const { getWeek, updateStatus } = useAppointments()
const adminPassword = useCookie('admin_password')

const currentWeek = ref(new Date())
const weekData = ref<any>(null)
const loading = ref(false)

const weekLabel = computed(() =>
  format(currentWeek.value, 'd MMMM yyyy', { locale: fr })
)

async function loadWeek() {
  loading.value = true
  try {
    weekData.value = await getWeek(
      format(currentWeek.value, 'yyyy-MM-dd'),
      adminPassword.value!
    )
  } finally {
    loading.value = false
  }
}

function prevWeek() { currentWeek.value = subWeeks(currentWeek.value, 1); loadWeek() }
function nextWeek() { currentWeek.value = addWeeks(currentWeek.value, 1); loadWeek() }

async function confirmAppt(id: string) {
  await updateStatus(id, 'CONFIRMED', adminPassword.value!)
  await loadWeek()
}

async function cancelAppt(id: string) {
  await updateStatus(id, 'CANCELLED', adminPassword.value!)
  await loadWeek()
}

function logout() {
  adminPassword.value = null
  navigateTo('/admin/login')
}

onMounted(loadWeek)
</script>
