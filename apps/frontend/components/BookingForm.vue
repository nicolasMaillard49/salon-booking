<template>
  <div class="rounded-2xl overflow-hidden border border-zinc-200 shadow-sm">

    <!-- Header billet — fond indigo foncé -->
    <div class="bg-indigo-950 px-6 py-5 relative">
      <!-- Pattern points subtil -->
      <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle, #fff 1px, transparent 1px); background-size: 16px 16px;" />

      <div class="relative flex items-start justify-between gap-4">
        <div>
          <p class="text-indigo-400 text-xs font-mono uppercase tracking-widest mb-1">Nm.D.Barber — Réservation</p>
          <p class="text-white text-lg font-semibold capitalize leading-tight">{{ formatDate(date) }}</p>
        </div>
        <div class="flex flex-col items-end shrink-0">
          <span class="text-indigo-400 text-xs font-mono uppercase tracking-widest mb-1">Prix</span>
          <span class="text-white text-2xl font-bold font-mono">10 €</span>
        </div>
      </div>

      <!-- Bande de coupe ticket -->
      <div class="absolute -bottom-px left-0 right-0 flex">
        <div class="h-3 w-4 bg-zinc-50 rounded-tr-full" />
        <div class="flex-1 border-b-2 border-dashed border-indigo-800/60" />
        <div class="h-3 w-4 bg-zinc-50 rounded-tl-full" />
      </div>
    </div>

    <!-- Encoche gauche + droite -->
    <div class="relative bg-white px-6 pt-6 pb-6">
      <div class="absolute -top-3.5 -left-3.5 w-7 h-7 rounded-full bg-zinc-50 border border-zinc-200" />
      <div class="absolute -top-3.5 -right-3.5 w-7 h-7 rounded-full bg-zinc-50 border border-zinc-200" />

      <UForm :state="form" @submit="onSubmit" class="space-y-4">

        <div class="grid grid-cols-2 gap-3">
          <!-- Prénom -->
          <div class="space-y-1.5">
            <label class="block text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-widest">Prénom</label>
            <div class="relative">
              <UIcon name="i-heroicons-user" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 z-10 pointer-events-none" />
              <input
                v-model="form.firstName"
                type="text"
                placeholder="Jean"
                class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-zinc-300 bg-zinc-50 text-zinc-900 text-sm font-medium placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all duration-200"
              />
            </div>
          </div>

          <!-- Nom -->
          <div class="space-y-1.5">
            <label class="block text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-widest">Nom</label>
            <div class="relative">
              <UIcon name="i-heroicons-identification" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 z-10 pointer-events-none" />
              <input
                v-model="form.lastName"
                type="text"
                placeholder="Dupont"
                class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-zinc-300 bg-zinc-50 text-zinc-900 text-sm font-medium placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all duration-200"
              />
            </div>
          </div>
        </div>

        <!-- Email -->
        <div class="space-y-1.5">
          <label class="block text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-widest">Email</label>
          <div class="relative">
            <UIcon name="i-heroicons-envelope" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 z-10 pointer-events-none" />
            <input
              v-model="form.email"
              type="email"
              placeholder="jean@email.com"
              class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-zinc-300 bg-zinc-50 text-zinc-900 text-sm font-medium placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all duration-200"
            />
          </div>
        </div>

        <UAlert
          v-if="error"
          color="red"
          variant="soft"
          :description="error"
          icon="i-heroicons-exclamation-triangle"
        />

        <!-- Séparateur -->
        <div class="flex items-center gap-3">
          <div class="flex-1 h-px bg-zinc-200" />
          <span class="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Confirmation</span>
          <div class="flex-1 h-px bg-zinc-200" />
        </div>

        <!-- Bouton submit -->
        <button
          type="submit"
          :disabled="loading || !form.firstName || !form.lastName || !form.email"
          class="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-zinc-900 text-white font-semibold text-sm tracking-wide hover:bg-zinc-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <template v-else>
Faire une demande de réservation          
            <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
          </template>
        </button>

        <p class="text-center text-[11px] text-zinc-400 font-mono">
          Un email de confirmation vous sera envoyé
        </p>

      </UForm>
    </div>

  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const props = defineProps<{ date: string }>()
const emit = defineEmits<{ success: [] }>()
const { createAppointment } = useAppointments()

const loading = ref(false)
const error = ref('')
const form = reactive({ firstName: '', lastName: '', email: '' })

function formatDate(date: string) {
  return format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr })
}

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await createAppointment({ ...form, date: props.date })
    emit('success')
  } catch (e: any) {
    error.value = e?.data?.message || 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}
</script>
