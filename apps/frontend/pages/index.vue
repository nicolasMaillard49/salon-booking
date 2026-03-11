<template>
  <div>
    <!-- Hero Section -->
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden bg-zinc-900">
      <!-- Background Image with Overlay -->
      <div class="absolute inset-0">
        <div class="absolute inset-0 bg-gradient-to-b from-zinc-900/60 via-zinc-900/40 to-zinc-900/90 z-10" />
        <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599351431202-6e0c95e5a2a7?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
      </div>

      <!-- Content -->
      <div class="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
          <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span class="text-white/90 text-sm font-medium">Ouvert aujourd'hui · 10h-19h</span>
        </div>

        <!-- Title with Logo -->
        <div class="mb-6">
          <img src="/faveicon.png" alt="Nm.D.Barber" class="w-24 h-24 mx-auto mb-4 object-contain brightness-0 invert" />
          <h1 class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight">
            <span class="block">Nm.D.</span>
            <span class="block text-red-500">Barber</span>
          </h1>
        </div>

        <!-- Subtitle -->
        <p class="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto font-light">
          L'art de la coupe masculine. <br class="hidden sm:block" />
          Réservez votre créneau en quelques clics.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button 
            @click="scrollToBooking"
            class="w-full sm:w-auto bg-white text-zinc-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2"
          >
            <UIcon name="i-heroicons-calendar" class="w-5 h-5" />
            Réserver maintenant
          </button>
          <NuxtLink 
            to="/realisations"
            class="w-full sm:w-auto bg-white/10 backdrop-blur-sm text-white border border-white/30 px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
          >
            <UIcon name="i-heroicons-photo" class="w-5 h-5" />
            Voir nos réalisations
          </NuxtLink>
        </div>

        <!-- Stats - Simplified -->
        <div class="grid grid-cols-2 gap-6 max-w-lg mx-auto">
          <div class="text-center">
            <div class="text-3xl md:text-4xl font-bold text-white">100%</div>
            <div class="text-white/60 text-sm mt-1">Clients satisfaits</div>
          </div>
          <div class="text-center">
            <div class="text-3xl md:text-4xl font-bold text-white">1</div>
            <div class="text-white/60 text-sm mt-1">Année d'expérience</div>
          </div>
        </div>
      </div>

      <!-- Scroll indicator - Clickable -->
      <button 
        @click="scrollToBooking"
        class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce cursor-pointer hover:text-white/80 transition-colors"
        aria-label="Scroll to booking"
      >
        <svg class="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
    </section>

    <!-- Booking Section -->
    <section id="booking" class="py-20 md:py-32 bg-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <span class="text-red-600 font-semibold text-sm uppercase tracking-wider">Réservation</span>
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 mt-3">
            Prenez rendez-vous
          </h2>
          <p class="text-zinc-600 mt-4 text-lg">
            Choisissez votre créneau en quelques clics
          </p>
        </div>

        <!-- Steps Indicator -->
        <div v-if="!success" class="flex items-center justify-center gap-4 mb-10">
          <div class="flex items-center gap-2">
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300"
              :class="!selectedDate ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-900'"
            >
              1
            </div>
            <span class="text-sm font-medium" :class="!selectedDate ? 'text-zinc-900' : 'text-zinc-400'">Date</span>
          </div>
          <div class="w-12 h-px bg-zinc-200" :class="selectedDate ? 'bg-zinc-900' : ''" />
          <div class="flex items-center gap-2">
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300"
              :class="selectedDate ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'"
            >
              2
            </div>
            <span class="text-sm font-medium" :class="selectedDate ? 'text-zinc-900' : 'text-zinc-400'">Infos</span>
          </div>
        </div>

        <!-- Success Message -->
        <Transition name="fade">
          <div v-if="success" class="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 md:p-12 text-center">
            <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <UIcon name="i-heroicons-check-badge" class="w-10 h-10 text-emerald-600" />
            </div>
            <h3 class="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">Rendez-vous confirmé !</h3>
            <p class="text-zinc-600 mb-6 max-w-md mx-auto">
              Vous allez recevoir un email de confirmation. À très vite !
            </p>
            <button 
              @click="resetBooking"
              class="bg-zinc-900 text-white px-6 py-2 rounded-full font-medium hover:bg-zinc-800 transition-colors"
            >
              Nouveau rendez-vous
            </button>
          </div>
        </Transition>

        <!-- Step 1: Calendar -->
        <Transition name="slide-up">
          <div v-if="!selectedDate && !success" class="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 bg-zinc-50 border-b border-zinc-100">
              <h3 class="font-semibold text-zinc-900">Sélectionnez une date et heure</h3>
              <p class="text-sm text-zinc-500 mt-1">Les créneaux disponibles sont mis à jour en temps réel</p>
            </div>
            <div class="p-6">
              <BookingCalendar @select="onDateSelected" />
            </div>
          </div>
        </Transition>

        <!-- Step 2: Form -->
        <Transition name="slide-up">
          <div v-if="selectedDate && !success" class="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 bg-zinc-50 border-b border-zinc-100 flex items-center gap-4">
              <button 
                @click="selectedDate = null"
                class="text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <UIcon name="i-heroicons-arrow-left" class="w-5 h-5" />
              </button>
              <div>
                <h3 class="font-semibold text-zinc-900">Vos informations</h3>
                <p class="text-sm text-zinc-500">{{ formatSelectedDate }}</p>
              </div>
            </div>
            <div class="p-6">
              <BookingForm 
                :date="selectedDate" 
                :time-slot="selectedTimeSlot" 
                @success="onSuccess" 
              />
            </div>
          </div>
        </Transition>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const selectedDate = ref(null)
const selectedTimeSlot = ref(null)
const success = ref(false)

const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  const dateStr = format(new Date(selectedDate.value), 'EEEE d MMMM yyyy', { locale: fr })
  return selectedTimeSlot.value ? `${dateStr} à ${selectedTimeSlot.value}` : dateStr
})

function onDateSelected(payload) {
  selectedDate.value = payload.date
  selectedTimeSlot.value = payload.timeSlot
  success.value = false
}

function onSuccess() {
  success.value = true
  selectedDate.value = null
  selectedTimeSlot.value = null
}

function resetBooking() {
  success.value = false
  selectedDate.value = null
  selectedTimeSlot.value = null
}

function scrollToBooking() {
  document.getElementById('booking').scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
