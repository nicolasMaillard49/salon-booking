<template>
  <nav class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 md:h-20">
        
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <div class="relative w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
            <img src="/faveicon.png" alt="Nm.D.Barber" class="w-6 h-6 md:w-8 md:h-8 object-contain" />
          </div>
          <div class="hidden sm:block">
            <span class="text-lg md:text-xl font-bold text-zinc-900 tracking-tight">Nm.D.</span>
            <span class="text-lg md:text-xl font-bold text-red-600">Barber</span>
          </div>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center gap-8">
          <NuxtLink 
            to="/" 
            class="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors relative group"
          >
            Réserver
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300" />
          </NuxtLink>
          <NuxtLink 
            to="/realisations" 
            class="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors relative group"
          >
            Réalisations
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300" />
          </NuxtLink>
          <NuxtLink 
            to="/mes-rdv" 
            class="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors relative group"
          >
            Mes RDV
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300" />
          </NuxtLink>
        </div>

        <!-- CTA & Mobile Menu -->
        <div class="flex items-center gap-4">
          <!-- Desktop CTA -->
          <NuxtLink 
            to="/"
            class="hidden md:flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
            Prendre RDV
          </NuxtLink>

          <!-- Mobile Menu Button - Always Visible -->
          <button 
            @click="isMenuOpen = !isMenuOpen"
            class="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors"
          >
            <UIcon 
              :name="isMenuOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'" 
              class="w-5 h-5 text-white"
            />
          </button>
        </div>
      </div>

      <!-- Mobile Menu - Always Visible Below Header -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 max-h-0"
        enter-to-class="opacity-100 max-h-96"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 max-h-96"
        leave-to-class="opacity-0 max-h-0"
      >
        <div v-if="isMenuOpen" class="md:hidden bg-zinc-900 border-t border-zinc-800">
          <div class="flex flex-col gap-0">
            <NuxtLink 
              to="/" 
              @click="isMenuOpen = false"
              class="flex items-center gap-3 px-4 py-4 hover:bg-zinc-800 transition-colors border-b border-zinc-800"
            >
              <UIcon name="i-heroicons-calendar" class="w-5 h-5 text-red-500" />
              <span class="font-medium text-white">Réserver</span>
            </NuxtLink>
            <NuxtLink 
              to="/realisations" 
              @click="isMenuOpen = false"
              class="flex items-center gap-3 px-4 py-4 hover:bg-zinc-800 transition-colors border-b border-zinc-800"
            >
              <UIcon name="i-heroicons-photo" class="w-5 h-5 text-white" />
              <span class="font-medium text-white">Réalisations</span>
            </NuxtLink>
            <NuxtLink 
              to="/mes-rdv" 
              @click="isMenuOpen = false"
              class="flex items-center gap-3 px-4 py-4 hover:bg-zinc-800 transition-colors border-b border-zinc-800"
            >
              <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-white" />
              <span class="font-medium text-white">Mes RDV</span>
            </NuxtLink>
            <NuxtLink 
              to="/admin" 
              @click="isMenuOpen = false"
              class="flex items-center gap-3 px-4 py-4 hover:bg-zinc-800 transition-colors"
            >
              <UIcon name="i-heroicons-lock-closed" class="w-5 h-5 text-zinc-500" />
              <span class="font-medium text-zinc-400">Admin</span>
            </NuxtLink>
          </div>
        </div>
      </Transition>
    </div>
  </nav>
</template>

<script setup>
const isMenuOpen = ref(false)

// Close menu on route change
watch(() => useRoute().path, () => {
  isMenuOpen.value = false
})
</script>