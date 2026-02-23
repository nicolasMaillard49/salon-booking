<template>
  <div>
    <!-- Navigation mois -->
    <div class="flex items-center justify-between mb-6">
      <UButton
        icon="i-heroicons-chevron-left"
        variant="ghost"
        color="primary"
        :disabled="loading"
        @click="prevMonth"
      />
      <span class="font-semibold capitalize text-pink-900 tracking-wide">
        {{ currentMonthLabel }}
      </span>
      <UButton
        icon="i-heroicons-chevron-right"
        variant="ghost"
        color="primary"
        :disabled="loading"
        @click="nextMonth"
      />
    </div>

    <!-- Jours de la semaine -->
    <div class="grid grid-cols-7 gap-1 mb-2">
      <div
        v-for="d in weekDays"
        :key="d"
        class="text-center text-xs text-slate-400 font-medium py-1 uppercase tracking-wider"
      >
        {{ d }}
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-7 gap-1">
      <div v-for="n in 35" :key="n" class="h-10 rounded-lg bg-pink-100 animate-pulse" />
    </div>

    <!-- Grille -->
    <div v-else class="grid grid-cols-7 gap-1">
      <div v-for="_ in firstDayOffset" :key="`e-${_}`" />

      <button
        v-for="day in daysInMonth"
        :key="day.date"
        :disabled="!day.available || day.isPast"
        class="h-10 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
        :class="{
          'bg-primary-500 text-white hover:bg-primary-600 shadow-sm hover:shadow-md': day.available && !day.isPast,
          'bg-pink-50 text-slate-300 cursor-not-allowed': !day.available || day.isPast,
          'ring-2 ring-primary-300 ring-offset-1': day.isToday && (day.available && !day.isPast),
        }"
        @click="day.available && !day.isPast && emit('select', day.date)"
      >
        {{ day.dayNumber }}
      </button>
    </div>

    <!-- Légende -->
    <div class="flex gap-5 mt-5 text-xs text-slate-500">
      <span class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded-sm bg-primary-500 inline-block" />
        Disponible
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded-sm bg-pink-100 inline-block" />
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

const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

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
    const month = format(currentDate.value, 'yyyy-MM')
    availability.value = await getAvailability(month)
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
