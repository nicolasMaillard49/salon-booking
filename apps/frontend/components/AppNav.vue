<template>
  <div>
    <!-- Floating Menu Button & Logo -->
    <div class="fixed top-6 left-6 right-6 z-50 flex items-center justify-between">
      <!-- Logo with Brand Text -->
      <NuxtLink 
        to="/" 
        class="group relative rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center px-4 py-3"
      >
        <span class="text-xs font-bold text-zinc-900 tracking-wider">nm D.</span>
        <img src="/faveicon.png" alt="Nm.D.Barber" class="w-8 h-8 object-contain my-1" />
        <span class="text-xs font-semibold text-zinc-700">barber</span>
      </NuxtLink>

      <!-- Floating Menu Burger Button -->
      <button 
        @click="isMenuOpen = !isMenuOpen"
        class="w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all group"
      >
        <div class="relative w-6 h-6 flex items-center justify-center">
          <svg 
            class="absolute w-6 h-6 transition-all duration-300"
            :class="isMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100'"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg 
            class="absolute w-6 h-6 transition-all duration-300"
            :class="isMenuOpen ? 'opacity-100 -rotate-90' : 'opacity-0'"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </button>
    </div>

    <!-- Floating Mobile Menu -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div 
        v-if="isMenuOpen" 
        class="fixed top-24 right-6 bg-zinc-900 rounded-2xl shadow-2xl z-40 w-56 overflow-hidden"
      >
        <div class="flex flex-col">
          <NuxtLink 
            to="/" 
            @click="isMenuOpen = false"
            class="flex items-center gap-3 px-5 py-4 text-white hover:bg-zinc-800 transition-colors border-b border-zinc-800"
          >
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="font-medium">Réserver</span>
          </NuxtLink>

          <NuxtLink 
            to="/realisations" 
            @click="isMenuOpen = false"
            class="flex items-center gap-3 px-5 py-4 text-white hover:bg-zinc-800 transition-colors border-b border-zinc-800"
          >
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="font-medium">Réalisations</span>
          </NuxtLink>

          <NuxtLink 
            to="/mes-rdv" 
            @click="isMenuOpen = false"
            class="flex items-center gap-3 px-5 py-4 text-white hover:bg-zinc-800 transition-colors border-b border-zinc-800"
          >
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span class="font-medium">Mes RDV</span>
          </NuxtLink>

          <NuxtLink 
            to="/admin" 
            @click="isMenuOpen = false"
            class="flex items-center gap-3 px-5 py-4 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span class="font-medium text-sm">Admin</span>
          </NuxtLink>
        </div>
      </div>
    </Transition>

    <!-- Click outside to close menu -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="isMenuOpen"
        class="fixed inset-0 bg-black/20 z-30"
        @click="isMenuOpen = false"
      />
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const isMenuOpen = ref(false)
const route = useRoute()

// Close menu on route change
watch(() => route.path, () => {
  isMenuOpen.value = false
})
</script>
