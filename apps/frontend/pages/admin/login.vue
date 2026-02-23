<template>
  <div class="min-h-screen bg-pink-50 flex items-center justify-center px-4">
    <div class="w-full max-w-sm">

      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-primary-100 rounded-2xl mb-4">
          <UIcon name="i-heroicons-scissors" class="w-7 h-7 text-primary-600" />
        </div>
        <h1 class="text-2xl font-bold text-pink-900">Espace Admin</h1>
        <p class="text-slate-500 text-sm mt-1">Mon Salon de Coiffure</p>
      </div>

      <UCard class="shadow-sm">
        <UForm :state="form" @submit="onSubmit" class="space-y-4">
          <UFormField label="Mot de passe" name="password">
            <UInput
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              icon="i-heroicons-lock-closed"
              size="md"
            />
          </UFormField>

          <UAlert
            v-if="error"
            color="red"
            variant="soft"
            description="Mot de passe incorrect."
            icon="i-heroicons-exclamation-triangle"
          />

          <UButton type="submit" :loading="loading" block size="md" color="primary">
            Se connecter
          </UButton>
        </UForm>
      </UCard>

      <p class="text-center text-xs text-slate-400 mt-6">
        Accès réservé à l'équipe du salon
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = reactive({ password: '' })
const loading = ref(false)
const error = ref(false)

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
