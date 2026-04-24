<template>
  <div class="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-zinc-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center gap-4">
          <button
            @click="router.push('/admin')"
            class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <svg class="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-zinc-900">Gérer l'indisponibilité</h1>
            <p class="text-sm text-zinc-500 mt-1">Bloquez les jours où vous n'êtes pas disponible</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl border border-zinc-200 p-6 sticky top-24">
            <h3 class="font-semibold text-zinc-900 mb-4">Action rapide</h3>

            <div class="space-y-3">
              <button
                @click="blockToday"
                :disabled="saving"
                class="w-full py-3 px-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium hover:bg-red-100 transition-colors text-sm disabled:opacity-50"
              >
                Bloquer aujourd'hui
              </button>
            </div>

            <!-- Stats -->
            <div class="mt-8 pt-6 border-t border-zinc-200">
              <div class="text-sm text-zinc-500 mb-2">Jour(s) bloqué(s)</div>
              <div class="text-3xl font-bold text-zinc-900">{{ unavailabilities.length }}</div>
            </div>

            <div v-if="error" class="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {{ error }}
            </div>
          </div>
        </div>

        <!-- Calendar + List -->
        <div class="lg:col-span-2">
          <!-- Month Navigation -->
          <div class="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
            <div class="flex items-center justify-between mb-6">
              <button
                @click="previousMonth"
                :disabled="loading"
                class="p-2 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-40"
              >
                <svg class="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <h3 class="text-lg font-bold text-zinc-900 capitalize">
                {{ monthLabel }}
              </h3>

              <button
                @click="nextMonth"
                :disabled="loading"
                class="p-2 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-40"
              >
                <svg class="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <!-- Day headers -->
            <div class="grid grid-cols-7 gap-2 mb-4">
              <div v-for="(day, i) in ['L', 'M', 'M', 'J', 'V', 'S', 'D']" :key="i" class="text-center text-xs font-semibold text-zinc-500 py-2">
                {{ day }}
              </div>
            </div>

            <!-- Calendar grid -->
            <div class="grid grid-cols-7 gap-2">
              <button
                v-for="day in calendarDays"
                :key="day.date"
                @click="day.isOtherMonth || saving ? null : toggleBlockedDate(day)"
                :disabled="day.isOtherMonth || saving"
                class="aspect-square p-2 rounded-lg transition-all relative"
                :class="[
                  day.isOtherMonth ? 'opacity-30 cursor-not-allowed' : saving ? 'cursor-wait' : 'cursor-pointer',
                  day.isBlocked
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-zinc-50 text-zinc-900 hover:bg-zinc-100 border border-zinc-200'
                ]"
              >
                <span class="text-sm">{{ day.day }}</span>
                <div v-if="day.isBlocked" class="absolute top-1 right-1 w-2 h-2 bg-white rounded-full" />
              </button>
            </div>
          </div>

          <!-- Blocked Dates List -->
          <div class="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 class="font-semibold text-zinc-900 mb-4">Jours bloqués</h3>

            <div v-if="loading" class="space-y-2">
              <div v-for="n in 3" :key="n" class="h-14 bg-zinc-100 rounded-lg animate-pulse" />
            </div>

            <div v-else-if="unavailabilities.length === 0" class="text-center py-8 text-zinc-500">
              <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>Aucun jour bloqué</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="u in sortedUnavailabilities"
                :key="u.id"
                class="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div>
                  <div class="font-medium text-red-900 capitalize">
                    {{ formatDate(u.date) }}
                  </div>
                  <div v-if="u.reason" class="text-xs text-red-700 mt-0.5">{{ u.reason }}</div>
                </div>
                <button
                  @click="removeUnavailability(u.id)"
                  :disabled="saving"
                  class="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                >
                  Débloquer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reason modal -->
    <div
      v-if="pendingBlock"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      @click.self="pendingBlock = null"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold text-zinc-900 mb-1">Bloquer ce jour</h3>
        <p class="text-sm text-zinc-500 mb-4 capitalize">{{ formatDate(pendingBlock) }}</p>

        <label class="block text-sm font-medium text-zinc-700 mb-2">Raison (facultatif)</label>
        <input
          v-model="pendingReason"
          type="text"
          maxlength="200"
          placeholder="Ex : Congés, formation, rendez-vous perso..."
          class="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
          @keyup.enter="confirmBlock"
        />

        <div class="flex gap-2 mt-6 justify-end">
          <button
            @click="pendingBlock = null"
            class="px-4 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Annuler
          </button>
          <button
            @click="confirmBlock"
            :disabled="saving"
            class="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            Bloquer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Unavailability } from '~/composables/useUnavailabilities'

definePageMeta({ middleware: 'auth-admin' })

const router = useRouter()
const adminPassword = useCookie('admin_password')
const { getAll, create, remove } = useUnavailabilities()

const currentDate = ref(new Date())
const unavailabilities = ref<Unavailability[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const pendingBlock = ref<string | null>(null)
const pendingReason = ref('')

const monthLabel = computed(() => format(currentDate.value, 'MMMM yyyy', { locale: fr }))

interface DayCell {
  date: string
  day: number
  isOtherMonth: boolean
  isBlocked: boolean
  existingId?: string
}

const blockedMap = computed(() => {
  const map = new Map<string, Unavailability>()
  unavailabilities.value.forEach(u => {
    map.set(u.date.slice(0, 10), u)
  })
  return map
})

const calendarDays = computed<DayCell[]>(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDate = new Date(firstDay)
  const offset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  startDate.setDate(startDate.getDate() - offset)

  const days: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const existing = blockedMap.value.get(dateStr)
    days.push({
      date: dateStr,
      day: date.getDate(),
      isOtherMonth: date.getMonth() !== month,
      isBlocked: !!existing,
      existingId: existing?.id,
    })
  }
  return days
})

const sortedUnavailabilities = computed(() =>
  [...unavailabilities.value].sort((a, b) => a.date.localeCompare(b.date)),
)

function formatDate(d: string) {
  return format(new Date(d), 'EEEE d MMMM yyyy', { locale: fr })
}

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    unavailabilities.value = await getAll()
  } catch (e: any) {
    error.value = e?.data?.message || 'Erreur lors du chargement.'
  } finally {
    loading.value = false
  }
}

function toggleBlockedDate(day: DayCell) {
  if (day.isBlocked && day.existingId) {
    removeUnavailability(day.existingId)
  } else {
    pendingBlock.value = day.date
    pendingReason.value = ''
  }
}

async function confirmBlock() {
  if (!pendingBlock.value) return
  saving.value = true
  error.value = null
  try {
    const created = await create(
      { date: pendingBlock.value, reason: pendingReason.value.trim() || undefined },
      adminPassword.value!,
    )
    unavailabilities.value.push(created)
    pendingBlock.value = null
    pendingReason.value = ''
  } catch (e: any) {
    error.value = e?.data?.message || 'Impossible de bloquer ce jour.'
  } finally {
    saving.value = false
  }
}

async function removeUnavailability(id: string) {
  saving.value = true
  error.value = null
  try {
    await remove(id, adminPassword.value!)
    unavailabilities.value = unavailabilities.value.filter(u => u.id !== id)
  } catch (e: any) {
    error.value = e?.data?.message || 'Impossible de débloquer ce jour.'
  } finally {
    saving.value = false
  }
}

async function blockToday() {
  const today = format(new Date(), 'yyyy-MM-dd')
  if (blockedMap.value.has(today)) return
  pendingBlock.value = today
  pendingReason.value = ''
}

function previousMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

onMounted(loadAll)
</script>
