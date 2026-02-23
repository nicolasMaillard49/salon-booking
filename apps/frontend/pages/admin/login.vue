<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-sm">

      <!-- Brand -->
      <div class="text-center mb-8">
        <div class="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-heroicons-scissors" class="w-7 h-7 text-white" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-zinc-900">Espace admin</h1>
        <p class="text-sm font-mono text-zinc-400 mt-1">Nm.D.Barber</p>
      </div>

      <!-- Card login -->
      <div class="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <UForm :state="form" @submit="onSubmit" class="space-y-4">

          <UFormField label="Mot de passe" name="password">
            <UInput
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••••"
              icon="i-heroicons-lock-closed"
              size="lg"
              class="w-full font-mono"
            >
              <template #trailing>
                <UButton
                  :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  variant="ghost"
                  color="gray"
                  size="xs"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
          </UFormField>

          <UAlert
            v-if="error"
            color="red"
            variant="soft"
            description="Mot de passe incorrect."
            icon="i-heroicons-shield-exclamation"
          />

          <UButton
            type="submit"
            :loading="loading"
            block
            size="lg"
            color="primary"
          >
            Accéder au dashboard
          </UButton>
        </UForm>
      </div>

      <p class="text-center text-xs font-mono text-zinc-400 mt-6">
        Accès réservé · Nm.D.Barber
      </p>
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
