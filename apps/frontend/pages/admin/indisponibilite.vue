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
            <p class="text-sm text-zinc-500 mt-1">Bloquez les créneaux pour les jours non disponibles</p>
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
                @click="blockToday"
                class="w-full py-3 px-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium hover:bg-red-100 transition-colors text-sm"
              >
                Bloquer aujourd'hui
              </button>
              
              <button 
                @click="blockAll"
                class="w-full py-3 px-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 font-medium hover:bg-amber-100 transition-colors text-sm"
              >
                Bloquer toute la semaine
              </button>

              <button 
                @click="clearAll"
                class="w-full py-3 px-4 bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-700 font-medium hover:bg-zinc-200 transition-colors text-sm"
              >
                Débloquer tout
              </button>
            </div>

            <!-- Stats -->
            <div class="mt-8 pt-6 border-t border-zinc-200">
              <div class="text-sm text-zinc-500 mb-2">Jour(s) bloqué(s)</div>
              <div class="text-3xl font-bold text-zinc-900">{{ blockedDates.length }}</div>
            </div>
          </div>
        </div>

        <!-- Main Content - Calendar -->
        <div class="lg:col-span-2">
          <!-- Month/Year Navigation -->
          <div class="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
            <div class="flex items-center justify-between mb-6">
              <button 
                @click="previousMonth"
                class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h3 class="text-lg font-bold text-zinc-900">
                {{ currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }) }}
              </h3>

              <button 
                @click="nextMonth"
                class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <!-- Day headers -->
            <div class="grid grid-cols-7 gap-2 mb-4">
              <div v-for="day in ['L', 'M', 'M', 'J', 'V', 'S', 'D']" :key="day" class="text-center text-xs font-semibold text-zinc-500 py-2">
                {{ day }}
              </div>
            </div>

            <!-- Calendar grid -->
            <div class="grid grid-cols-7 gap-2">
              <button
                v-for="day in calendarDays"
                :key="day.date"
                @click="toggleBlockedDate(day.date)"
                :disabled="day.isOtherMonth"
                class="aspect-square p-2 rounded-lg transition-all relative group"
                :class="[
                  day.isOtherMonth ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
                  day.isBlocked 
                    ? 'bg-red-600 text-white font-bold' 
                    : 'bg-zinc-50 text-zinc-900 hover:bg-zinc-100 border border-zinc-200'
                ]"
              >
                <span class="text-sm">{{ day.day }}</span>
                
                <!-- Status indicator -->
                <div v-if="day.isBlocked" class="absolute top-1 right-1 w-2 h-2 bg-white rounded-full" />
              </button>
            </div>
          </div>

          <!-- Blocked Dates List -->
          <div class="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 class="font-semibold text-zinc-900 mb-4">Jours bloqués</h3>
            
            <div v-if="blockedDates.length === 0" class="text-center py-8 text-zinc-500">
              <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
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
                  @click="toggleBlockedDate(date)"
                  class="text-red-600 hover:text-red-700 font-medium text-sm"
                >
                  Débloquer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'

const router = useRouter()
const currentDate = ref(new Date())
const blockedDates = ref<string[]>(JSON.parse(localStorage.getItem('blockedDates') || '[]'))

// Calendar days
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  // First day of month
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Padding for days from previous month
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())
  
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
      isBlocked: blockedDates.value.includes(dateStr)
    })
  }
  
  return days
})

const sortedBlockedDates = computed(() => {
  return [...blockedDates.value].sort()
})

// Functions
function toggleBlockedDate(date: string) {
  const index = blockedDates.value.indexOf(date)
  if (index > -1) {
    blockedDates.value.splice(index, 1)
  } else {
    blockedDates.value.push(date)
  }
  localStorage.setItem('blockedDates', JSON.stringify(blockedDates.value))
}

function blockToday() {
  const today = format(new Date(), 'yyyy-MM-dd')
  if (!blockedDates.value.includes(today)) {
    blockedDates.value.push(today)
    localStorage.setItem('blockedDates', JSON.stringify(blockedDates.value))
  }
}

function blockAll() {
  const week = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = format(date, 'yyyy-MM-dd')
    if (!blockedDates.value.includes(dateStr)) {
      week.push(dateStr)
    }
  }
  blockedDates.value.push(...week)
  localStorage.setItem('blockedDates', JSON.stringify(blockedDates.value))
}

function clearAll() {
  blockedDates.value = []
  localStorage.setItem('blockedDates', JSON.stringify(blockedDates.value))
}

function previousMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}


</script>
