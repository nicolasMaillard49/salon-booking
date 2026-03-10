<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <button
      v-if="showButton"
      @click="scrollToTop"
      class="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-zinc-900 text-white shadow-lg hover:bg-zinc-800 transition-all duration-300 flex items-center justify-center group"
      aria-label="Retour en haut"
    >
      <UIcon 
        name="i-heroicons-arrow-up" 
        class="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" 
      />
    </button>
  </Transition>
</template>

<script setup>
const showButton = ref(false)

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', () => {
    showButton.value = window.scrollY > 400
  })
})
</script>