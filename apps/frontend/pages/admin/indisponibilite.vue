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
            <p class="text-sm text-zinc-500 mt-1">Bloquez les jours non disponibles</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Sidebar - Quick Actions -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl border border-zinc-200 p-6 sticky top-24">
            <h3 class="font-semibold text-zinc-900 mb-4">Actions rapides</h3>

            <div class="space-y-3">
              <button
                :disabled="loading"
                @click="onBlockToday"
                class="w-full py-3 px-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium hover:bg-red-100 transition-colors text-sm disabled:opacity-50"
              >
                Bloquer aujourd'hui
              </button>

              <button
                :disabled="loading"
                @click="rangeModalOpen = true"
                class="w-full py-3 px-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 font-medium hover:bg-amber-100 transition-colors text-sm disabled:opacity-50"
              >
                Bloquer une plage
              </button>

              <button
                :disabled="loading || blockedDates.length === 0"
                @click="clearAllModalOpen = true"
                class="w-full py-3 px-4 bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-700 font-medium hover:bg-zinc-200 transition-colors text-sm disabled:opacity-50"
              >
                Débloquer tout
              </button>
            </div>

            <div class="mt-8 pt-6 border-t border-zinc-200">
              <div class="text-sm text-zinc-500 mb-2">Jour(s) bloqué(s)</div>
              <div class="text-3xl font-bold text-zinc-900">{{ blockedDates.length }}</div>
            </div>
          </div>
        </div>

        <!-- Main Content - Calendar -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
            <div class="flex items-center justify-between mb-6">
              <button @click="previousMonth" class="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                <svg class="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <h3 class="text-lg font-bold text-zinc-900">
                {{ currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }) }}
              </h3>

              <button @click="nextMonth" class="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                <svg class="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div class="grid grid-cols-7 gap-2 mb-4">
              <div v-for="(day, i) in ['L', 'M', 'M', 'J', 'V', 'S', 'D']" :key="i" class="text-center text-xs font-semibold text-zinc-500 py-2">
                {{ day }}
              </div>
            </div>

            <div class="grid grid-cols-7 gap-2">
              <button
                v-for="day in calendarDays"
                :key="day.date"
                @click="onToggleDay(day.date)"
                :disabled="day.isOtherMonth || loading"
                class="aspect-square p-2 rounded-lg transition-all relative group"
                :class="[
                  day.isOtherMonth ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
                  day.isBlocked
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-zinc-50 text-zinc-900 hover:bg-zinc-100 border border-zinc-200',
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

            <div v-if="blockedDates.length === 0" class="text-center py-8 text-zinc-500">
              <p>Aucun jour bloqué</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="date in sortedBlockedDates"
                :key="date"
                class="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <span class="font-medium text-red-900">
                  {{ new Date(date).toLocaleString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
                </span>
                <button
                  @click="onUnblock(date)"
                  :disabled="loading"
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

    <!-- Modal cascade-cancel -->
    <UModal v-model="cascadeModalOpen">
      <div class="p-6">
        <h3 class="text-lg font-bold text-zinc-900 mb-3">Confirmer le blocage</h3>
        <p class="text-sm text-zinc-700 mb-4">
          {{ cascadeConflicts.length }} RDV actif(s) sur le
          <strong>{{ cascadeDateLabel }}</strong>.
          Bloquer va les annuler et envoyer un email d'annulation au(x) client(s).
        </p>
        <ul class="text-xs text-zinc-600 mb-6 space-y-1 max-h-40 overflow-y-auto">
          <li v-for="c in cascadeConflicts" :key="c.id" class="flex justify-between">
            <span>{{ c.firstName }} {{ c.lastName }} — {{ c.timeSlot }}</span>
            <span class="text-zinc-400">{{ c.email }}</span>
          </li>
        </ul>
        <div class="flex justify-end gap-3">
          <UButton color="gray" variant="ghost" @click="cascadeModalOpen = false">Annuler</UButton>
          <UButton color="red" @click="confirmCascade">Bloquer et annuler les RDV</UButton>
        </div>
      </div>
    </UModal>

    <!-- Modal range -->
    <UModal v-model="rangeModalOpen">
      <div class="p-6">
        <h3 class="text-lg font-bold text-zinc-900 mb-4">Bloquer une plage de dates</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1">Du</label>
            <UInput v-model="rangeFrom" type="date" />
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1">Au</label>
            <UInput v-model="rangeTo" type="date" />
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <UButton color="gray" variant="ghost" @click="rangeModalOpen = false">Annuler</UButton>
          <UButton color="indigo" :disabled="!rangeFrom || !rangeTo" @click="onSubmitRange">Bloquer la plage</UButton>
        </div>
      </div>
    </UModal>

    <!-- Modal "Débloquer tout" -->
    <UModal v-model="clearAllModalOpen">
      <div class="p-6">
        <h3 class="text-lg font-bold text-zinc-900 mb-3">Débloquer tous les jours ?</h3>
        <p class="text-sm text-zinc-700 mb-6">
          Ceci supprimera les <strong>{{ blockedDates.length }}</strong> indisponibilité(s) actuellement enregistrée(s).
        </p>
        <div class="flex justify-end gap-3">
          <UButton color="gray" variant="ghost" @click="clearAllModalOpen = false">Annuler</UButton>
          <UButton color="red" @click="confirmClearAll">Tout débloquer</UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import type { Unavailability, ConflictBooking } from '~/composables/useUnavailabilities'

definePageMeta({ middleware: 'auth-admin' })

const router = useRouter()
const toast = useToast()
const { getAll, create, createRange, removeByDate } = useUnavailabilities()

const adminPassword = ref('')
const currentDate = ref(new Date())
const unavailabilities = ref<Unavailability[]>([])
const loading = ref(false)

// Modals
const cascadeModalOpen = ref(false)
const cascadeConflicts = ref<ConflictBooking[]>([])
const cascadePendingDate = ref<string | null>(null)
const cascadePendingMode = ref<'single' | 'range'>('single')
const cascadePendingRange = ref<{ from: string; to: string } | null>(null)
const cascadeDateLabel = ref('')

const rangeModalOpen = ref(false)
const rangeFrom = ref('')
const rangeTo = ref('')

const clearAllModalOpen = ref(false)

const blockedDates = computed(() => unavailabilities.value.map(u => u.date.slice(0, 10)))
const sortedBlockedDates = computed(() => [...blockedDates.value].sort())

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDate = new Date(firstDay)
  const offset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  startDate.setDate(startDate.getDate() - offset)

  const days = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const isCurrentMonth = date.getMonth() === month
    days.push({
      date: dateStr,
      day: date.getDate(),
      isOtherMonth: !isCurrentMonth,
      isBlocked: blockedDates.value.includes(dateStr),
    })
  }
  return days
})

async function loadMonth() {
  loading.value = true
  try {
    unavailabilities.value = await getAll(format(currentDate.value, 'yyyy-MM'))
  } catch (e: any) {
    toast.add({ title: 'Erreur', description: e?.data?.message || 'Chargement impossible', color: 'red' })
  } finally {
    loading.value = false
  }
}

function previousMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
  loadMonth()
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
  loadMonth()
}

async function onToggleDay(date: string) {
  if (blockedDates.value.includes(date)) {
    await onUnblock(date)
  } else {
    await tryBlock(date)
  }
}

async function tryBlock(date: string) {
  loading.value = true
  try {
    await create(date, adminPassword.value, false)
    toast.add({ title: 'Jour bloqué', color: 'green' })
    await loadMonth()
  } catch (e: any) {
    if (e?.statusCode === 409 && e?.data?.conflicts) {
      cascadeConflicts.value = e.data.conflicts
      cascadePendingDate.value = date
      cascadePendingMode.value = 'single'
      cascadeDateLabel.value = new Date(date).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      cascadeModalOpen.value = true
    } else {
      toast.add({ title: 'Erreur', description: e?.data?.message || 'Blocage impossible', color: 'red' })
    }
  } finally {
    loading.value = false
  }
}

async function onBlockToday() {
  await tryBlock(format(new Date(), 'yyyy-MM-dd'))
}

async function onUnblock(date: string) {
  loading.value = true
  try {
    await removeByDate(date, adminPassword.value)
    toast.add({ title: 'Jour débloqué', color: 'green' })
    await loadMonth()
  } catch (e: any) {
    toast.add({ title: 'Erreur', description: e?.data?.message || 'Déblocage impossible', color: 'red' })
  } finally {
    loading.value = false
  }
}

async function onSubmitRange() {
  if (!rangeFrom.value || !rangeTo.value) return
  rangeModalOpen.value = false
  loading.value = true
  try {
    await createRange(rangeFrom.value, rangeTo.value, adminPassword.value, false)
    toast.add({ title: 'Plage bloquée', color: 'green' })
    rangeFrom.value = ''
    rangeTo.value = ''
    await loadMonth()
  } catch (e: any) {
    if (e?.statusCode === 409 && e?.data?.conflicts) {
      cascadeConflicts.value = e.data.conflicts
      cascadePendingMode.value = 'range'
      cascadePendingRange.value = { from: rangeFrom.value, to: rangeTo.value }
      cascadeDateLabel.value = `${rangeFrom.value} → ${rangeTo.value}`
      cascadeModalOpen.value = true
    } else {
      toast.add({ title: 'Erreur', description: e?.data?.message || 'Blocage plage impossible', color: 'red' })
    }
  } finally {
    loading.value = false
  }
}

async function confirmCascade() {
  cascadeModalOpen.value = false
  loading.value = true
  try {
    if (cascadePendingMode.value === 'single' && cascadePendingDate.value) {
      await create(cascadePendingDate.value, adminPassword.value, true)
    } else if (cascadePendingMode.value === 'range' && cascadePendingRange.value) {
      await createRange(cascadePendingRange.value.from, cascadePendingRange.value.to, adminPassword.value, true)
      rangeFrom.value = ''
      rangeTo.value = ''
    }
    toast.add({ title: 'Blocage effectué', description: 'Les RDV ont été annulés et les clients notifiés.', color: 'green' })
    await loadMonth()
  } catch (e: any) {
    toast.add({ title: 'Erreur', description: e?.data?.message || 'Cascade impossible', color: 'red' })
  } finally {
    loading.value = false
    cascadeConflicts.value = []
    cascadePendingDate.value = null
    cascadePendingRange.value = null
  }
}

async function confirmClearAll() {
  clearAllModalOpen.value = false
  loading.value = true
  try {
    for (const date of [...blockedDates.value]) {
      await removeByDate(date, adminPassword.value)
    }
    toast.add({ title: 'Tous les jours débloqués', color: 'green' })
    await loadMonth()
  } catch (e: any) {
    toast.add({ title: 'Erreur', description: e?.data?.message || 'Déblocage en masse impossible', color: 'red' })
    await loadMonth()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  adminPassword.value = useCookie('admin_password').value || ''
  loadMonth()
})
</script>
