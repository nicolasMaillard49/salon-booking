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
      <div v-for="n in 35" :key="n" class="h-20 rounded-lg bg-zinc-100 animate-pulse" />
    </div>

    <!-- Grille calendrier -->
    <div v-else class="grid grid-cols-7 gap-1">
      <div v-for="_ in firstDayOffset" :key="`e-${_}`" class="h-20" />

      <template v-for="day in daysInMonth" :key="day.date">
        <!-- Jeudi tout Benj -->
        <button
          v-if="day.isAllBenj"
          disabled
          class="h-20 rounded-lg transition-all duration-150 relative flex flex-col items-start justify-start p-1.5 overflow-hidden bg-gradient-to-br from-amber-400 to-yellow-500 text-white cursor-not-allowed ring-2 ring-amber-300 ring-offset-1 shadow-sm shadow-amber-200"
        >
          <span
            class="text-[11px] font-mono font-bold leading-none"
            :class="day.isToday ? 'text-red-300' : ''"
          >
            {{ day.dayNumber }}
          </span>
          <span class="absolute bottom-1 left-0 right-0 text-[9px] font-semibold text-center text-amber-100 truncate px-1">
            Benj Brichet
          </span>
        </button>

        <!-- Semaine : cellule scindée midi/soir -->
        <button
          v-else-if="!day.isWeekend"
          :disabled="day.isPast || day.availableCount === 0 || day.isBlocked"
          class="h-20 rounded-lg overflow-hidden flex flex-col transition-all duration-150 cursor-pointer"
          :class="[
            day.isBlocked ? 'opacity-50 cursor-not-allowed' : day.isPast || day.availableCount === 0 ? 'cursor-not-allowed' : 'hover:scale-110 hover:z-10',
            expandedDay === day.date && !day.isBlocked ? 'ring-2 ring-indigo-500 ring-offset-1' : '',
          ]"
          @click="!day.isPast && day.availableCount > 0 && !day.isBlocked && toggleDay(day.date)"
        >
          <!-- Numéro du jour (bandeau) -->
          <div class="w-full px-1.5 pt-1 pb-0.5 flex items-center justify-between" :class="day.isBlocked ? 'bg-red-600/80' : 'bg-indigo-800/80'">
            <span
              class="text-[10px] font-mono font-bold leading-none text-white"
              :class="day.isToday ? 'text-red-300' : ''"
            >
              {{ day.dayNumber }}
            </span>
            <span v-if="day.isBlocked" class="text-[7px] font-mono font-bold text-white/90">INDISPO</span>
          </div>
          <!-- Midi (50%) -->
          <div
            class="flex-1 w-full flex flex-col md:flex-row items-center justify-center gap-0 md:gap-1 text-[9px] font-mono font-semibold"
            :class="splitSlotClass(day.midiSlot, day.isPast)"
          >
            <UIcon name="i-heroicons-sun" class="w-4 h-4 md:w-3 md:h-3 shrink-0 text-white md:opacity-70" />
            <span v-if="day.midiSlot?.bookedBy" class="truncate text-[7px] text-white/80 leading-none md:hidden">{{ day.midiSlot.bookedBy }}</span>
            <span class="w-2 h-2 rounded-full shrink-0 hidden md:block" :class="dotColor(day.midiSlot, day.isPast)" />
            <span class="truncate hidden md:inline">{{ splitSlotLabel(day.midiSlot) }}</span>
          </div>
          <!-- Séparateur -->
          <div class="w-full h-px bg-white/30" />
          <!-- Soir (50%) -->
          <div
            class="flex-1 w-full flex flex-col md:flex-row items-center justify-center gap-0 md:gap-1 text-[9px] font-mono font-semibold"
            :class="splitSlotClass(day.soirSlot, day.isPast)"
          >
            <UIcon name="i-heroicons-moon" class="w-4 h-4 md:w-3 md:h-3 shrink-0 text-white md:opacity-70" />
            <span v-if="day.soirSlot?.bookedBy" class="truncate text-[7px] text-white/80 leading-none md:hidden">{{ day.soirSlot.bookedBy }}</span>
            <span class="w-2 h-2 rounded-full shrink-0 hidden md:block" :class="dotColor(day.soirSlot, day.isPast)" />
            <span class="truncate hidden md:inline">{{ splitSlotLabel(day.soirSlot) }}</span>
          </div>
        </button>

        <!-- Week-end : cellule unique avec compteur -->
        <button
          v-else
          :disabled="day.isPast || day.availableCount === 0 || day.isBlocked"
          class="h-20 rounded-lg transition-all duration-150 relative flex flex-col items-start justify-start p-1.5 overflow-hidden"
          :class="[dayCellClass(day), expandedDay === day.date && !day.isBlocked ? 'ring-2 ring-indigo-500 ring-offset-1' : day.isBlocked ? 'ring-1 ring-red-300' : '']"
          @click="!day.isPast && day.availableCount > 0 && !day.isBlocked && toggleDay(day.date)"
        >
          <span
            class="text-[11px] font-mono font-bold leading-none"
            :class="day.isToday ? 'text-red-300' : ''"
          >
            {{ day.dayNumber }}
          </span>
          <div class="absolute bottom-1 left-1 right-1 flex items-center justify-center">
            <span
              v-if="day.isBlocked"
              class="text-[9px] font-mono font-bold text-red-600"
            >
              Indispo
            </span>
            <span
              v-else-if="day.availableCount > 0"
              class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-white/20"
            >
              {{ day.availableCount }}/{{ day.slots.length }}
            </span>
            <span
              v-else
              class="text-[9px] font-mono text-zinc-400"
            >
              Complet
            </span>
          </div>
        </button>
      </template>
    </div>

    <!-- Slot picker panel -->
    <Transition name="slide">
      <div v-if="expandedDay" class="mt-4 bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div>
              <p class="text-sm font-semibold text-zinc-900 capitalize">{{ expandedDayLabel }}</p>
              <p class="text-[10px] font-mono text-zinc-400">{{ expandedDayIsWeekend ? 'Créneaux de 13h à 18h' : 'Choisissez midi ou soir' }}</p>
            </div>
          </div>
          <UButton icon="i-heroicons-x-mark" variant="ghost" color="gray" size="xs" class="cursor-pointer" @click="expandedDay = null" />
        </div>

        <!-- Semaine : 2 gros boutons midi/soir avec pastilles -->
        <div v-if="!expandedDayIsWeekend" class="grid grid-cols-2 gap-3">
          <button
            v-for="slot in expandedDaySlots"
            :key="slot.time"
            :disabled="!slot.available"
            class="relative p-5 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2"
            :class="slotButtonClass(slot)"
            @click="slot.available && selectSlot(slot.time)"
          >
            <!-- Pastille vert/rouge -->
            <span
              class="absolute top-3 right-3 w-3 h-3 rounded-full shadow-sm"
              :class="slot.isBenjThursday ? 'bg-amber-400' : slot.available ? 'bg-emerald-500' : 'bg-red-500'"
            />
            <UIcon
              :name="slot.time === '12:00' ? 'i-heroicons-sun' : 'i-heroicons-moon'"
              class="w-7 h-7"
              :class="slot.available ? 'text-indigo-500' : slot.isBenjThursday ? 'text-amber-400' : 'text-zinc-300'"
            />
            <span class="text-xl font-bold font-mono">{{ slot.time }}</span>
            <span class="text-xs font-mono uppercase tracking-wider" :class="slot.available ? 'text-emerald-600' : 'text-zinc-400'">
              {{ slot.time === '12:00' ? 'Midi' : 'Soir' }}
            </span>
            <!-- Nom du réservant (gros) -->
            <span
              v-if="!slot.available"
              class="text-sm font-semibold mt-1"
              :class="slot.isBenjThursday ? 'text-amber-600' : 'text-zinc-600'"
            >
              {{ slot.isBenjThursday ? 'Benj Brichet' : slot.bookedBy || 'Réservé' }}
            </span>
            <span v-else class="text-sm font-semibold text-emerald-600 mt-1">Disponible</span>
          </button>
        </div>

        <!-- Week-end : grille horaire avec pastilles -->
        <div v-else class="grid grid-cols-3 gap-2">
          <button
            v-for="slot in expandedDaySlots"
            :key="slot.time"
            :disabled="!slot.available"
            class="relative p-3.5 rounded-xl border-2 transition-all duration-150 flex flex-col items-center gap-1.5"
            :class="slotButtonClass(slot)"
            @click="slot.available && selectSlot(slot.time)"
          >
            <!-- Pastille vert/rouge -->
            <span
              class="absolute top-2 right-2 w-2.5 h-2.5 rounded-full shadow-sm"
              :class="slot.available ? 'bg-emerald-500' : 'bg-red-500'"
            />
            <span class="text-base font-bold font-mono">{{ slot.time }}</span>
            <span class="text-xs font-semibold truncate w-full text-center" :class="slot.available ? 'text-emerald-600' : 'text-zinc-600'">
              {{ slot.available ? 'Libre' : slot.bookedBy || 'Réservé' }}
            </span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Légende -->
    <div class="flex flex-wrap items-center justify-center gap-4 mt-6 pt-6 border-t border-zinc-100">
      <span class="flex items-center gap-2 text-sm text-zinc-600">
        <span class="w-4 h-4 rounded bg-indigo-600 inline-block" />
        Disponible
      </span>
      <span class="flex items-center gap-2 text-sm text-zinc-600">
        <span class="w-4 h-4 rounded bg-amber-400 inline-block" />
        Benj Brichet
      </span>
      <span class="flex items-center gap-2 text-sm text-zinc-600">
        <span class="w-4 h-4 rounded bg-red-100 border border-red-300 inline-block" />
        Indisponible
      </span>
      <span class="flex items-center gap-2 text-sm text-zinc-600">
        <span class="w-4 h-4 rounded bg-zinc-400 inline-block" />
        Complet
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, format, isBefore, isToday, startOfDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import type { DayAvailability, SlotAvailability } from '~/composables/useAppointments'

const emit = defineEmits<{ select: [payload: { date: string; timeSlot: string }] }>()
const { getAvailability } = useAppointments()

const today = startOfDay(new Date())
const currentDate = ref(new Date())
const availability = ref<DayAvailability[]>([])
const loading = ref(false)
const expandedDay = ref<string | null>(null)
const blockedDates = ref<string[]>([])

// Load blocked dates from localStorage on mount
const loadBlockedDates = () => {
  if (typeof window !== 'undefined') {
    try {
      blockedDates.value = JSON.parse(localStorage.getItem('blockedDates') || '[]')
    } catch {
      blockedDates.value = []
    }
  }
}

const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const currentMonthLabel = computed(() =>
  format(currentDate.value, 'MMMM yyyy', { locale: fr })
)

const firstDayOffset = computed(() => {
  const firstDay = getDay(startOfMonth(currentDate.value))
  return firstDay === 0 ? 6 : firstDay - 1
})

interface DayCell {
  date: string
  dayNumber: number
  isPast: boolean
  isToday: boolean
  isWeekend: boolean
  isAllBenj: boolean
  isBlocked: boolean
  slots: SlotAvailability[]
  availableCount: number
  midiSlot?: SlotAvailability
  soirSlot?: SlotAvailability
}

const daysInMonth = computed<DayCell[]>(() => {
  const start = startOfMonth(currentDate.value)
  const end = endOfMonth(currentDate.value)
  return eachDayOfInterval({ start, end }).map(day => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const avail = availability.value.find(a => a.date === dateStr)
    const slots = avail?.slots ?? []
    const availableCount = slots.filter(s => s.available).length
    const isAllBenj = slots.length > 0 && slots.every(s => s.isBenjThursday)
    const isBlocked = blockedDates.value.includes(dateStr)

    return {
      date: dateStr,
      dayNumber: day.getDate(),
      isPast: isBefore(day, today),
      isToday: isToday(day),
      isWeekend: avail?.isWeekend ?? false,
      isAllBenj,
      isBlocked,
      slots,
      availableCount,
      midiSlot: slots.find(s => s.time === '12:00'),
      soirSlot: slots.find(s => s.time === '18:00'),
    }
  })
})

const expandedDayData = computed(() =>
  daysInMonth.value.find(d => d.date === expandedDay.value)
)

const expandedDayLabel = computed(() =>
  expandedDay.value ? format(new Date(expandedDay.value), 'EEEE d MMMM', { locale: fr }) : ''
)

const expandedDayIsWeekend = computed(() => expandedDayData.value?.isWeekend ?? false)

const expandedDaySlots = computed(() => expandedDayData.value?.slots ?? [])

function dayCellClass(day: DayCell) {
  if (day.isBlocked) {
    return 'bg-red-100 text-red-700 cursor-not-allowed ring-2 ring-red-300 ring-offset-1 shadow-sm shadow-red-200'
  }
  if (day.isAllBenj) {
    return 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white cursor-not-allowed ring-2 ring-amber-300 ring-offset-1 shadow-sm shadow-amber-200'
  }
  if (day.isPast || day.availableCount === 0) {
    return 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
  }
  if (day.isWeekend) {
    return 'bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 hover:scale-110 hover:z-10 ring-2 ring-offset-1 ring-orange-400 shadow-sm'
  }
  return 'bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 hover:scale-110 hover:z-10 shadow-sm'
}

function slotButtonClass(slot: SlotAvailability) {
  if (slot.isBenjThursday) {
    return 'border-amber-300 bg-amber-50 cursor-not-allowed'
  }
  if (!slot.available) {
    return 'border-zinc-200 bg-zinc-50 cursor-not-allowed opacity-60'
  }
  return 'border-indigo-200 bg-indigo-50 hover:border-indigo-400 hover:bg-indigo-100 cursor-pointer hover:shadow-md'
}

function splitSlotClass(slot: SlotAvailability | undefined, isPast: boolean) {
  if (!slot || isPast) return 'bg-zinc-100 text-zinc-400'
  if (slot.isBenjThursday) return 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white'
  if (!slot.available) return 'bg-indigo-900/60 text-white/80'
  return 'bg-indigo-600 text-white'
}

function splitSlotLabel(slot: SlotAvailability | undefined) {
  if (!slot) return ''
  if (slot.isBenjThursday) return 'Benj'
  if (!slot.available) return slot.bookedBy || 'Pris'
  return slot.time === '12:00' ? 'Midi' : 'Soir'
}

function dotColor(slot: SlotAvailability | undefined, isPast: boolean) {
  if (!slot || isPast) return 'bg-zinc-300'
  if (slot.isBenjThursday) return 'bg-amber-200'
  if (slot.available) return 'bg-emerald-400'
  return 'bg-red-400'
}

function toggleDay(date: string) {
  expandedDay.value = expandedDay.value === date ? null : date
}

function selectSlot(time: string) {
  if (expandedDay.value) {
    emit('select', { date: expandedDay.value, timeSlot: time })
    expandedDay.value = null
  }
}

async function loadAvailability() {
  loading.value = true
  expandedDay.value = null
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

onMounted(() => {
  loadBlockedDates()
  loadAvailability()
})
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
