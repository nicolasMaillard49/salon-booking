<template>
  <UApp>
    <!-- App Shell -->
    <div class="min-h-screen bg-white">
      <!-- Navigation -->
      <AppNav />
      
      <!-- Main Content -->
      <main>
        <NuxtPage />
      </main>
      
      <!-- Footer -->
      <AppFooter />
      
      <!-- Scroll to top -->
      <ScrollToTop />
    </div>
  </UApp>
</template>

<script setup>
// Smooth scroll behavior
useHead({
  htmlAttrs: {
    class: 'scroll-smooth'
  }
})
</script>

<style>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c4c4c4;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}

/* Smooth transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>