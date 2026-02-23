<template>
  <div class="w-full">
    <!-- Navigation mois -->
    <div class="flex items-center justify-between mb-6">
      <UButton
        icon="i-heroicons-chevron-left"
        variant="ghost"
        color="gray"
        size="sm"
        :disabled="loading"
        class="cursor-pointer"
        @click="prevMonth"
      />
      <div class="text-center">
        <p class="text-lg font-semibold tracking-tight text-zinc-900 capitalize">
          {{ currentMonthLabel }}
        </p>
      </div>
      <UButton
        icon="i-heroicons-chevron-right"
        variant="ghost"
        color="gray"
        size="sm"
        :disabled="loading"
        class="cursor-pointer"
        @click="nextMonth"
      />
    </div>

    <!-- En-têtes jours — DM Mono pour le côté précis/geek -->
    <div class="grid grid-cols-7 mb-2 border-b border-zinc-100 pb-2">
      <div
        v-for="d in weekDays"
        :key="d"
        class="text-center text-xs font-mono text-zinc-400 tracking-widest uppercase py-1"
      >
        {{ d }}
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-7 gap-1.5 mt-3">
      <div
        v-for="n in 35"
        :key="n"
        class="h-12 rounded-lg bg-zinc-100 animate-pulse"
      />
    </div>

    <!-- Grille des jours -->
    <div v-else class="grid grid-cols-7 gap-1.5 mt-3">
      <!-- Cellules vides pour aligner le 1er jour -->
      <div v-for="_ in firstDayOffset" :key="`e-${_}`" class="h-12" />

      <button
        v-for="day in daysInMonth"
        :key="day.date"
        :disabled="!day.available || day.isPast"
        class="h-12 rounded-lg text-sm font-mono font-medium transition-all duration-200 relative flex items-center justify-center cursor-pointer"
        :class="{
          // Disponible
          'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-indigo-200 hover:shadow-md': day.available && !day.isPast,
          // Aujourd'hui disponible
          'ring-2 ring-offset-1 ring-indigo-400': day.isToday && day.available && !day.isPast,
          // Aujourd'hui indisponible
          'ring-2 ring-offset-1 ring-zinc-300': day.isToday && (!day.available || day.isPast),
          // Indisponible
          'bg-zinc-100 text-zinc-300 cursor-not-allowed': !day.available || day.isPast,
        }"
        @click="day.available && !day.isPast && emit('select', day.date)"
      >
        {{ day.dayNumber }}
        <!-- Point indicateur aujourd'hui -->
        <span
          v-if="day.isToday"
          class="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          :class="day.available && !day.isPast ? 'bg-indigo-200' : 'bg-zinc-300'"
        />
      </button>
    </div>

    <!-- Légende -->
    <div class="flex items-center gap-6 mt-6 pt-4 border-t border-zinc-100">
      <span class="flex items-center gap-2 text-xs text-zinc-500">
        <span class="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />
        Disponible
      </span>
      <span class="flex items-center gap-2 text-xs text-zinc-500">
        <span class="w-3 h-3 rounded-sm bg-zinc-100 border border-zinc-200 inline-block" />
        Indisponible
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, format, isBefore, isToday, startOfDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'

const emit = defineEmits<{ select: [date: string] }>()
const { getAvailability } = useAppointments()

const today = startOfDay(new Date())
const currentDate = ref(new Date())
const availability = ref<{ date: string; available: boolean }[]>([])
const loading = ref(false)

const weekDays = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

const currentMonthLabel = computed(() =>
  format(currentDate.value, 'MMMM yyyy', { locale: fr })
)

const firstDayOffset = computed(() => {
  const firstDay = getDay(startOfMonth(currentDate.value))
  return firstDay === 0 ? 6 : firstDay - 1
})

const daysInMonth = computed(() => {
  const start = startOfMonth(currentDate.value)
  const end = endOfMonth(currentDate.value)
  return eachDayOfInterval({ start, end }).map(day => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const avail = availability.value.find(a => a.date === dateStr)
    return {
      date: dateStr,
      dayNumber: day.getDate(),
      available: avail?.available ?? false,
      isPast: isBefore(day, today),
      isToday: isToday(day),
    }
  })
})

async function loadAvailability() {
  loading.value = true
  try {
    availability.value = await getAvailability(format(currentDate.value, 'yyyy-MM'))
  } finally {
    loading.value = false
  }
}

function prevMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
  loadAvailability()
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
  loadAvailability()
}

onMounted(loadAvailability)
</script>
