<template>
  <div class="min-h-screen">

    <!-- Topbar -->
    <div class="bg-white border-b border-zinc-200 sticky top-0 z-10">
      <div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <UButton icon="i-heroicons-scissors" class="text-white" color="white"  to="/"/>
          </div>
          <div>
            <span class="text-sm font-semibold text-zinc-900">Admin</span>
            <span class="text-xs font-mono text-zinc-400 ml-2">· Nm.D.Barber</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            to="/admin/photos"
            icon="i-heroicons-photo"
            variant="ghost"
            color="gray"
            size="sm"
            class="cursor-pointer"
          >
            Réalisations
          </UButton>
          <UButton
            icon="i-heroicons-arrow-left-on-rectangle"
            variant="ghost"
            color="gray"
            size="sm"
            class="cursor-pointer"
            @click="logout"
          >
            Déconnexion
          </UButton>
        </div>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 py-8">

      <!-- Navigation semaine -->
      <div class="bg-white border border-zinc-200 rounded-xl p-4 mb-6 flex items-center justify-between shadow-sm">
        <UButton
          icon="i-heroicons-chevron-left"
          variant="ghost"
          color="gray"
          size="sm"
          class="cursor-pointer"
          @click="prevWeek"
        />
        <div class="text-center">
          <p class="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-0.5">Semaine du</p>
          <p class="text-base font-semibold tracking-tight text-zinc-900 capitalize">{{ weekLabel }}</p>
        </div>
        <UButton
          icon="i-heroicons-chevron-right"
          variant="ghost"
          color="gray"
          size="sm"
          class="cursor-pointer"
          @click="nextWeek"
        />
      </div>

      <!-- Stats -->
      <div v-if="weekData" class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono text-zinc-400 uppercase tracking-wider">Total</span>
            <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-zinc-300" />
          </div>
          <p class="text-3xl font-bold font-mono text-zinc-900">{{ weekData.total }}</p>
        </div>
        <div class="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono text-amber-600 uppercase tracking-wider">En attente</span>
            <span class="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          </div>
          <p class="text-3xl font-bold font-mono text-amber-600">{{ weekData.pending }}</p>
        </div>
        <div class="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono text-emerald-600 uppercase tracking-wider">Confirmés</span>
            <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-emerald-400" />
          </div>
          <p class="text-3xl font-bold font-mono text-emerald-600">{{ weekData.confirmed }}</p>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-3">
        <div
          v-for="n in 3"
          :key="n"
          class="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-3 animate-pulse"
        >
          <div class="w-11 h-11 rounded-xl bg-zinc-100 shrink-0" />
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-zinc-100 rounded w-1/3" />
            <div class="h-3 bg-zinc-50 rounded w-1/2" />
          </div>
        </div>
      </div>

      <!-- Vide -->
      <div
        v-else-if="weekData?.appointments.length === 0"
        class="bg-white border border-zinc-200 rounded-xl p-12 text-center shadow-sm"
      >
        <UIcon name="i-heroicons-calendar-x-mark" class="w-10 h-10 text-zinc-200 mx-auto mb-3" />
        <p class="text-sm font-mono text-zinc-400">Aucun rendez-vous cette semaine.</p>
      </div>

      <!-- Liste -->
      <div v-else class="space-y-2.5">
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
