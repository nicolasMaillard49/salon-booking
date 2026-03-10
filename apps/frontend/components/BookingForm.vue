<template>
  <div class="space-y-6">
    <!-- Ticket Header -->
    <div class="bg-zinc-900 rounded-2xl p-6 relative overflow-hidden">
      <div class="absolute inset-0 opacity-5" style="background-image: radial-gradient(circle, #fff 1px, transparent 1px); background-size: 20px 20px;" />
      <div class="relative">
        <p class="text-red-500 text-xs font-semibold uppercase tracking-wider mb-1">Nm.D.Barber</p>
        <p class="text-white text-xl font-bold capitalize">{{ formatDateTime() }}</p>
      </div>
      <!-- Ticket cutout effect -->
      <div class="absolute -bottom-3 left-0 right-0 flex">
        <div class="h-6 w-6 bg-white rounded-tr-full" />
        <div class="flex-1 border-b-2 border-dashed border-zinc-700" />
        <div class="h-6 w-6 bg-white rounded-tl-full" />
      </div>
    </div>

    <!-- Form -->
    <div class="bg-white rounded-2xl p-6 border border-zinc-200">
      <!-- Cutout continuations -->
      <div class="absolute -top-3 left-6 w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200" />
      <div class="absolute -top-3 right-6 w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200" />

      <UForm :state="form" @submit="onSubmit" class="space-y-5">
        <!-- Name Fields -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-zinc-700">Prénom</label>
            <div class="relative">
              <UIcon name="i-heroicons-user" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                v-model="form.firstName"
                type="text"
                placeholder="Jean"
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-zinc-700">Nom</label>
            <div class="relative">
              <UIcon name="i-heroicons-user-circle" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                v-model="form.lastName"
                type="text"
                placeholder="Dupont"
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        <!-- Email -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-zinc-700">Email</label>
          <div class="relative">
            <UIcon name="i-heroicons-envelope" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              v-model="form.email"
              type="email"
              placeholder="jean.dupont@email.com"
              class="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all"
            />
          </div>
        </div>

        <!-- Phone (optional) -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-zinc-700">
            Téléphone <span class="text-zinc-400 font-normal">(optionnel)</span>
          </label>
          <div class="relative">
            <UIcon name="i-heroicons-phone" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              v-model="form.phone"
              type="tel"
              placeholder="06 12 34 56 78"
              class="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all"
            />
          </div>
        </div>

        <!-- Notes -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-zinc-700">
            Notes <span class="text-zinc-400 font-normal">(optionnel)</span>
          </label>
          <textarea
            v-model="form.notes"
            rows="3"
            placeholder="Type de coupe souhaité, préférences..."
            class="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all resize-none"
          />
        </div>

        <!-- Error -->
        <UAlert
          v-if="error"
          color="red"
          variant="soft"
          :description="error"
          icon="i-heroicons-exclamation-triangle"
          class="rounded-xl"
        />

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading || !isValid"
          class="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <template v-else>
            Confirmer ma réservation
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5" />
          </template>
        </button>

        <p class="text-center text-sm text-zinc-500">
          Un email de confirmation vous sera envoyé à {{ form.email || 'votre adresse' }}
        </p>
      </UForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const props = defineProps<{ date: string; timeSlot: string }>()
const emit = defineEmits<{ success: [] }>()
const { createAppointment } = useAppointments()

const loading = ref(false)
const error = ref('')
const form = reactive({ 
  firstName: '', 
  lastName: '', 
  email: '',
  phone: '',
  notes: ''
})

const isValid = computed(() => {
  return form.firstName && form.lastName && form.email && form.email.includes('@')
})

function formatDate(date: string) {
  return format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr })
}

function formatDateTime() {
  return `${formatDate(props.date)} à ${props.timeSlot}`
}

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await createAppointment({ 
      ...form, 
      date: props.date, 
      timeSlot: props.timeSlot 
    })
    emit('success')
  } catch (e: any) {
    error.value = e?.data?.message || 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}
</script>