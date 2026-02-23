<template>
  <div class="min-h-screen">

    <!-- Nav top-right -->
    <div class="fixed top-4 right-4 z-20 flex flex-col md:flex-row items-end md:items-center gap-2">
      <!-- Mobile : icônes seules verticales -->
      <NuxtLink
        v-for="btn in navButtons"
        :key="btn.to"
        :to="btn.to"
        class="flex items-center gap-2 bg-zinc-900 text-white border border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer rounded-full"
        :class="btn.label ? 'md:px-3 md:py-1.5 px-0 w-9 h-9 md:w-auto md:h-auto justify-center' : 'w-9 h-9 justify-center'"
      >
        <UIcon :name="btn.icon" class="w-4 h-4 shrink-0" />
        <span v-if="btn.label" class="hidden md:inline text-sm font-medium">{{ btn.label }}</span>
      </NuxtLink>
    </div>

    <div class="max-w-4xl mx-auto py-12 px-4">

      <!-- Header -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center gap-2 bg-white border border-zinc-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
          <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span class="text-xs font-mono text-zinc-500 tracking-wider uppercase">Réservation en ligne</span>
          <span class="w-px h-3 bg-zinc-200" />
          <span class="text-xs font-mono font-semibold text-indigo-600">10 €</span>
        </div>
        <h1 class="text-5xl font-bold tracking-tight text-zinc-900 mb-1">
          Nm.D.<span class="text-red-600">Barber</span>
        </h1>
        <p class="text-zinc-500 text-base mt-3">Choisis ton créneau mec, tqt je te rend bg.</p>
      </div>

      <!-- Indicateur d'étape -->
      <div v-if="!success" class="flex items-center gap-2 justify-center mb-8">
        <div class="flex items-center gap-1.5">
          <div
            class="w-6 h-6 rounded-full text-xs font-mono font-bold flex items-center justify-center transition-colors duration-300"
            :class="!selectedDate ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'"
          >1</div>
          <span class="text-xs font-medium" :class="!selectedDate ? 'text-zinc-700' : 'text-zinc-400'">Date</span>
        </div>
        <div class="w-8 h-px" :class="selectedDate ? 'bg-indigo-400' : 'bg-zinc-200'" />
        <div class="flex items-center gap-1.5">
          <div
            class="w-6 h-6 rounded-full text-xs font-mono font-bold flex items-center justify-center transition-colors duration-300"
            :class="selectedDate ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-400'"
          >2</div>
          <span class="text-xs font-medium" :class="selectedDate ? 'text-zinc-700' : 'text-zinc-400'">Infos</span>
        </div>
      </div>

      <!-- Succès -->
      <Transition name="fade">
        <div v-if="success" class="bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm">
          <div class="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-emerald-600" />
          </div>
          <h3 class="text-2xl font-bold text-zinc-900 mb-2">Demande envoyée !</h3>
          <p class="text-zinc-500 mb-6 text-sm leading-relaxed">
            Vous allez recevoir un email de confirmation.<br />
            Votre RDV est en attente de validation par le salon.
          </p>
          <div class="flex items-center justify-center gap-1.5 mb-6 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
            <UIcon name="i-heroicons-envelope" class="w-4 h-4 text-zinc-400" />
            <p class="text-xs font-mono text-zinc-500">Un lien de suivi vous a été envoyé par email</p>
          </div>
          <UButton variant="outline" color="gray" size="sm" @click="success = false">
            Faire une autre réservation
          </UButton>
        </div>
      </Transition>

      <!-- Étape 1 : Calendrier -->
      <Transition name="slide">
        <div v-if="!selectedDate && !success" class="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 class="text-sm font-semibold text-zinc-900">Choisissez une date</h2>
                <p class="text-xs text-zinc-400">Les jeudis sont réservés · Ven/Sam/Dim en orange</p>
              </div>
            </div>
            <!-- Prix -->
            <div class="flex items-center gap-1 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-1 md:px-3 shrink-0">
              <UIcon name="i-heroicons-banknotes" class="w-3 h-3 md:w-3.5 md:h-3.5 text-indigo-500 shrink-0" />
              <span class="text-[10px] md:text-xs font-mono font-semibold text-indigo-700 whitespace-nowrap">10 €</span>
            </div>
          </div>
          <div class="p-6">
            <BookingCalendar @select="onDateSelected" />
          </div>
        </div>
      </Transition>

      <!-- Étape 2 : Formulaire -->
      <Transition name="slide">
        <div v-if="selectedDate && !success" class="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-zinc-100 flex items-center gap-3">
            <UButton
              icon="i-heroicons-arrow-left"
              variant="ghost"
              color="gray"
              size="xs"
              class="cursor-pointer"
              @click="selectedDate = null"
            />
            <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-user" class="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 class="text-sm font-semibold text-zinc-900">Vos coordonnées</h2>
              <p class="text-xs font-mono text-zinc-400 capitalize">{{ formatSelectedDate }}</p>
            </div>
          </div>
          <div class="p-6">
            <BookingForm :date="selectedDate" @success="onSuccess" />
          </div>
        </div>
      </Transition>

    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const selectedDate = ref<string | null>(null)
const success = ref(false)

const formatSelectedDate = computed(() =>
  selectedDate.value
    ? format(new Date(selectedDate.value), 'EEEE d MMMM yyyy', { locale: fr })
    : ''
)

function onDateSelected(date: string) {
  selectedDate.value = date
  success.value = false
}

function onSuccess() {
  selectedDate.value = null
  success.value = true
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(6px); }
</style>
