<template>
  <div class="min-h-screen bg-pink-50">
    <div class="max-w-2xl mx-auto py-12 px-4">

      <!-- Header -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-primary-100 rounded-2xl mb-4">
          <UIcon name="i-heroicons-scissors" class="w-7 h-7 text-primary-600" />
        </div>
        <h1 class="text-4xl font-bold text-pink-900 mb-2">Mon Salon de Coiffure</h1>
        <p class="text-slate-500 text-lg">Réservez votre rendez-vous en quelques clics</p>
      </div>

      <!-- Succès -->
      <Transition name="fade">
        <UCard v-if="success" class="mb-6 border border-green-200 bg-green-50">
          <div class="text-center py-6">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-green-600" />
            </div>
            <h3 class="text-xl font-bold text-green-800 mb-2">Demande envoyée !</h3>
            <p class="text-green-700">
              Vous allez recevoir un email de confirmation.<br />
              Votre RDV est en attente de validation.
            </p>
            <UButton variant="ghost" color="green" class="mt-4" @click="success = false">
              Faire une autre réservation
            </UButton>
          </div>
        </UCard>
      </Transition>

      <!-- Étape 1 : Calendrier -->
      <Transition name="slide">
        <UCard v-if="!selectedDate && !success" class="shadow-sm">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-primary-500" />
              <h2 class="text-lg font-semibold text-pink-900">Choisissez une date</h2>
            </div>
          </template>
          <BookingCalendar @select="onDateSelected" />
        </UCard>
      </Transition>

      <!-- Étape 2 : Formulaire -->
      <Transition name="slide">
        <UCard v-if="selectedDate && !success" class="shadow-sm">
          <template #header>
            <div class="flex items-center gap-2">
              <UButton
                icon="i-heroicons-arrow-left"
                variant="ghost"
                color="gray"
                size="xs"
                @click="selectedDate = null"
              />
              <div>
                <h2 class="text-lg font-semibold text-pink-900">Vos coordonnées</h2>
                <p class="text-sm text-slate-500 capitalize">{{ formatSelectedDate }}</p>
              </div>
            </div>
          </template>

          <BookingForm :date="selectedDate" @success="onSuccess" />
        </UCard>
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

.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(8px); }
</style>
