<template>
  <nav class="bg-white border-b border-zinc-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Logo & Brand -->
      <NuxtLink to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div class="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
          <UIcon name="i-heroicons-scissors" class="w-6 h-6 text-white" />
        </div>
        <div>
          <div class="text-sm font-bold text-zinc-900">Nm.D.</div>
          <div class="text-xs text-zinc-500 -mt-1">Admin</div>
        </div>
      </NuxtLink>

      <!-- Navigation Links -->
      <div class="hidden md:flex items-center gap-1">
        <NuxtLink 
          to="/admin" 
          class="px-4 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          active-class="bg-zinc-100 text-zinc-900"
        >
          <UIcon name="i-heroicons-calendar" class="w-4 h-4 inline mr-2" />
          Rendez-vous
        </NuxtLink>
        <NuxtLink 
          to="/admin/photos" 
          class="px-4 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          active-class="bg-zinc-100 text-zinc-900"
        >
          <UIcon name="i-heroicons-photo" class="w-4 h-4 inline mr-2" />
          Photos
        </NuxtLink>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <button
          @click="logout"
          class="px-4 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2"
        >
          <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
          <span class="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const adminPassword = useCookie('admin_password')

function logout() {
  adminPassword.value = null
  navigateTo('/admin/login')
}
</script>