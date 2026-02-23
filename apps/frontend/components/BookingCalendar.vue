<template>
  <div class="w-full">

    <!-- Navigation mois -->
    <div class="flex items-center justify-between mb-4">
      <UButton icon="i-heroicons-chevron-left" variant="ghost" color="gray" size="sm" :disabled="loading" class="cursor-pointer" @click="prevMonth" />
      <p class="text-base font-semibold tracking-tight text-zinc-900 capitalize">{{ currentMonthLabel }}</p>
      <UButton icon="i-heroicons-chevron-right" variant="ghost" color="gray" size="sm" :disabled="loading" class="cursor-pointer" @click="nextMonth" />
    </div>

    <!-- En-têtes jours -->
    <div class="grid grid-cols-7 gap-1 mb-1">
      <div v-for="d in weekDays" :key="d" class="text-center text-[10px] font-mono text-zinc-400 tracking-widest uppercase py-1">
        {{ d }}
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-7 gap-1">
      <div v-for="n in 35" :key="n" class="h-16 rounded-lg bg-zinc-100 animate-pulse" />
    </div>

    <!-- Grille -->
    <div v-else class="grid grid-cols-7 gap-1">
      <div v-for="_ in firstDayOffset" :key="`e-${_}`" class="h-16" />

      <button
        v-for="day in daysInMonth"
        :key="day.date"
        :disabled="!day.available || day.isPast"
        class="h-16 rounded-lg transition-all duration-150 relative flex flex-col items-start justify-start p-1.5 hover:scale-110 hover:z-10 overflow-hidden"
        :class="cellClass(day)"
        @click="day.available && !day.isPast && emit('select', day.date)"
      >
        <!-- Numéro du jour -->
        <span
          class="text-[11px] font-mono font-bold leading-none"
          :class="day.isToday ? (day.available ? 'text-red-300' : 'text-red-500') : ''"
        >
          {{ day.dayNumber }}
        </span>

        <!-- Nom du réservant -->
        <span
          v-if="day.bookedBy"
          class="absolute bottom-1 left-0 right-0 text-[10px] md:text-sm font-semibold text-center truncate px-1 leading-tight"
          :class="day.isBenjThursday ? 'text-amber-100' : day.isPending ? 'text-zinc-400 italic' : 'text-zinc-500'"
        >
          {{ day.bookedBy }}
        </span>
      </button>
    </div>

    <!-- Légende -->
    <div class="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-zinc-100">
      <span class="flex items-center gap-1.5 text-xs text-zinc-500">
        <span class="w-3 h-3 rounded-sm bg-indigo-600 inline-block shrink-0" />
        Disponible
      </span>
      <span class="flex items-center gap-1.5 text-xs text-zinc-500">
        <span class="w-3 h-3 rounded-sm bg-gradient-to-br from-amber-400 to-yellow-500 inline-block ring-1 ring-amber-400 shrink-0" />
        Benj Brichet (jeudi)
      </span>
      <span class="flex items-center gap-1.5 text-xs text-zinc-500">
        <span class="w-3 h-3 rounded-sm bg-indigo-600 ring-2 ring-orange-400 ring-offset-1 inline-block shrink-0" />
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

const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

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
      isPending: avail?.isPending ?? false,
      isBenjThursday: avail?.isBenjThursday ?? false,
      isWeekend: avail?.isWeekend ?? false,
    }
  })
})

function cellClass(day: ReturnType<typeof daysInMonth.value[0]['valueOf']>) {
  if (day.isBenjThursday) {
    return 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white cursor-not-allowed ring-2 ring-amber-300 ring-offset-1 shadow-sm shadow-amber-200'
  }
  if (day.isPending) {
    return 'bg-zinc-100 text-zinc-400 cursor-not-allowed border-2 border-dashed border-zinc-300'
  }
  if (day.isPast || (!day.available && !day.isBenjThursday)) {
    return 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
  }
  if (day.isWeekend) {
    return 'bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 ring-2 ring-offset-1 ring-orange-400 shadow-sm'
  }
  return 'bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 shadow-sm'
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
