<template>
  <div class="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Brand Section -->
      <div class="text-center mb-10">
        <div class="w-16 h-16 bg-gradient-to-br from-red-600 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-600/20">
          <UIcon name="i-heroicons-scissors" class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-white">Espace admin</h1>
        <p class="text-red-500 font-semibold mt-2">Nm.D.Barber</p>
        <p class="text-zinc-400 text-sm mt-3">Gestion des rendez-vous et du salon</p>
      </div>

      <!-- Login Card -->
      <div class="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
        <h2 class="text-xl font-semibold text-white mb-6">Authentification</h2>

        <UForm :state="form" @submit="onSubmit" class="space-y-5">
          <!-- Password Field -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-white">Mot de passe administrateur</label>
            <div class="relative">
              <UIcon name="i-heroicons-lock-closed" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••••"
                class="w-full pl-12 pr-12 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all font-mono tracking-widest"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              >
                <UIcon 
                  :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" 
                  class="w-5 h-5"
                />
              </button>
            </div>
          </div>

          <!-- Error Alert -->
          <Transition name="fade">
            <div v-if="error" class="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-center gap-3">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400 flex-shrink-0" />
              <p class="text-sm text-red-300">Mot de passe incorrect. Veuillez réessayer.</p>
            </div>
          </Transition>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading || !form.password"
            class="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-red-700 hover:to-red-600 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <template v-else>
              <UIcon name="i-heroicons-arrow-right" class="w-5 h-5" />
              Accéder au dashboard
            </template>
          </button>
        </UForm>

        <!-- Footer -->
        <p class="text-center text-xs text-zinc-400 mt-6">
          Accès réservé aux administrateurs
        </p>
      </div>

      <!-- Security Info -->
      <div class="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl">
        <div class="flex items-center gap-2 text-zinc-400 text-xs">
          <UIcon name="i-heroicons-shield-check" class="w-4 h-4" />
          <span>Connexion sécurisée</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = reactive({ password: '' })
const loading = ref(false)
const error = ref(false)
const showPassword = ref(false)

async function onSubmit() {
  loading.value = true
  error.value = false
  try {
    const config = useRuntimeConfig()
    await $fetch(`${config.public.apiUrl}/appointments/admin`, {
      headers: { 'x-admin-password': form.password },
    })
    const adminPassword = useCookie('admin_password', { maxAge: 60 * 60 * 8 })
    adminPassword.value = form.password
    await navigateTo('/admin')
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>