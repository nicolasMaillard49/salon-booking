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

    <!-- En-têtes jours -->
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
    <div v-if="loading" class="grid grid-cols-7 gap-2 mt-3">
      <div v-for="n in 35" :key="n" class="h-16 rounded-lg bg-zinc-100 animate-pulse" />
    </div>

    <!-- Grille des jours -->
    <div v-else class="relative">
      <!-- Bande semaine en cours -->
      <div
        v-if="currentWeekRow >= 0"
        class="absolute -left-2 -right-2 rounded-xl bg-indigo-50 border border-indigo-200 pointer-events-none z-0"
        :style="{ top: `${6 + currentWeekRow * 72}px`, height: '76px' }"
      />
      <div class="grid grid-cols-7 gap-2 mt-3 relative z-10">
      <div v-for="_ in firstDayOffset" :key="`e-${_}`" class="h-16" />

      <button
        v-for="day in daysInMonth"
        :key="day.date"
        :disabled="!day.available || day.isPast"
        class="h-16 rounded-lg text-sm transition-all duration-200 relative flex flex-col items-center justify-center gap-0.5 overflow-hidden hover:scale-110 hover:z-10"
        :class="cellClass(day)"
        @click="day.available && !day.isPast && emit('select', day.date)"
      >
        <!-- Numéro du jour -->
        <span class="font-mono font-semibold leading-none" :class="day.isBenjThursday ? 'text-base' : 'text-sm'">
          {{ day.dayNumber }}
        </span>

        <!-- Nom du réservant -->
        <span
          v-if="day.bookedBy"
          class="text-[9px] font-medium leading-tight px-1 text-center truncate w-full"
          :class="day.isBenjThursday ? 'text-amber-100' : 'text-zinc-400'"
        >
          {{ day.bookedBy }}
        </span>

        <!-- Dot "aujourd'hui" -->
        <span
          v-if="day.isToday"
          class="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          :class="day.available && !day.isPast ? 'bg-white/50' : 'bg-zinc-300'"
        />
      </button>
    </div>
    </div>

    <!-- Légende -->
    <div class="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-zinc-100">
      <span class="flex items-center gap-2 text-xs text-zinc-500">
        <span class="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />
        Disponible
      </span>
      <span class="flex items-center gap-2 text-xs text-zinc-500">
        <span class="w-3 h-3 rounded-sm bg-gradient-to-br from-amber-400 to-yellow-500 inline-block ring-1 ring-amber-400" />
        Benj Brichet (jeudi)
      </span>
      <span class="flex items-center gap-2 text-xs text-zinc-500">
        <span class="w-3 h-3 rounded-sm bg-indigo-600 ring-2 ring-orange-400 ring-offset-1 inline-block" />
        Ven / Sam / Dim
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
import type { DayAvailability } from '~/composables/useAppointments'

const emit = defineEmits<{ select: [date: string] }>()
const { getAvailability } = useAppointments()

const today = startOfDay(new Date())
const currentDate = ref(new Date())
const availability = ref<DayAvailability[]>([])
const loading = ref(false)

const weekDays = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

const currentWeekRow = computed(() => {
  const todayStr = format(today, 'yyyy-MM-dd')
  const todayIdx = daysInMonth.value.findIndex(d => d.date === todayStr)
  if (todayIdx === -1) return -1
  return Math.floor((firstDayOffset.value + todayIdx) / 7)
})

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
      bookedBy: avail?.bookedBy,
      isBenjThursday: avail?.isBenjThursday ?? false,
      isWeekend: avail?.isWeekend ?? false,
    }
  })
})

function cellClass(day: ReturnType<typeof daysInMonth.value[0]['valueOf']>) {
  // Jeudi Benj Brichet → doré
  if (day.isBenjThursday) {
    return 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white cursor-not-allowed ring-2 ring-amber-400 ring-offset-1 shadow-md shadow-amber-200'
  }
  // Passé ou indisponible (réservé par qqn)
  if (day.isPast || (!day.available && !day.isBenjThursday)) {
    return 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
  }
  // Disponible week-end (ven/sam/dim) → indigo + ring orange
  if (day.isWeekend) {
    return 'bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 ring-2 ring-offset-1 ring-orange-400 shadow-sm'
    + (day.isToday ? ' ring-2 ring-offset-1 ring-orange-400' : '')
  }
  // Disponible jour normal → indigo
  return 'bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 shadow-sm hover:shadow-indigo-200 hover:shadow-md'
    + (day.isToday ? ' ring-2 ring-offset-1 ring-indigo-300' : '')
}

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
