<template>
  <div class="min-h-screen bg-white">
    <!-- Header Section -->
    <section class="bg-zinc-900 py-20 md:py-32">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span class="text-red-500 font-semibold text-sm uppercase tracking-wider">Portfolio</span>
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mt-4">
          Nos réalisations
        </h1>
        <p class="text-zinc-400 mt-4 max-w-2xl mx-auto text-lg">
          Découvrez nos dernières coupes et transformations. 
          Chaque client est unique, chaque coupe est personnalisée.
        </p>
      </div>
    </section>

    <!-- Gallery Section -->
    <section class="py-16 md:py-24 -mt-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Loading -->
        <div v-if="pending" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div v-for="n in 8" :key="n" class="aspect-[3/4] rounded-2xl bg-zinc-100 animate-pulse" />
        </div>

        <!-- Empty -->
        <div v-else-if="!photos.length" class="text-center py-24 bg-zinc-50 rounded-3xl">
          <div class="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <UIcon name="i-heroicons-photo" class="w-10 h-10 text-zinc-300" />
          </div>
          <h3 class="text-xl font-semibold text-zinc-900 mb-2">Aucune réalisation pour le moment</h3>
          <p class="text-zinc-500">Revenez bientôt pour découvrir nos créations !</p>
        </div>

        <!-- Gallery Grid -->
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="(photo, index) in photos"
            :key="photo.id"
            class="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer bg-zinc-100"
            :class="index === 0 ? 'md:col-span-2 md:row-span-2' : ''"
            @click="openPhoto(photo)"
          >
            <img
              :src="photo.url"
              :alt="photo.caption || 'Réalisation Nm.D.Barber'"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <!-- Hover Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div class="absolute bottom-0 left-0 right-0 p-4">
                <p v-if="photo.caption" class="text-white font-medium text-sm">{{ photo.caption }}</p>
                <div class="flex items-center gap-2 mt-2">
                  <UIcon name="i-heroicons-eye" class="w-4 h-4 text-white/70" />
                  <span class="text-white/70 text-xs">Voir</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 bg-zinc-50">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
          Envie de transformer votre look ?
        </h2>
        <p class="text-zinc-600 mb-8 text-lg">
          Réservez votre créneau maintenant et rejoignez nos clients satisfaits.
        </p>
        <NuxtLink 
          to="/"
          class="inline-flex items-center gap-2 bg-zinc-900 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-zinc-800 transition-colors"
        >
          <UIcon name="i-heroicons-calendar" class="w-5 h-5" />
          Prendre rendez-vous
        </NuxtLink>
      </div>
    </section>

    <!-- Lightbox -->
    <Transition name="fade">
      <div
        v-if="selected"
        class="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
        @click.self="selected = null"
      >
        <button 
          class="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          @click="selected = null"
        >
          <UIcon name="i-heroicons-x-mark" class="w-6 h-6 text-white" />
        </button>
        
        <div class="max-w-5xl w-full">
          <img 
            :src="selected.url" 
            :alt="selected.caption || ''" 
            class="w-full rounded-2xl object-contain max-h-[85vh] shadow-2xl" 
          />
          <p v-if="selected.caption" class="text-white/80 text-center mt-4 text-lg">
            {{ selected.caption }}
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Photo } from '~/composables/usePhotos'

const { getAll } = usePhotos()

const { data: photos, pending } = await useAsyncData('photos', () => getAll(), { 
  default: () => [] as Photo[] 
})

const selected = ref<Photo | null>(null)

function openPhoto(photo: Photo) {
  selected.value = photo
}

// SEO
useHead({
  title: 'Réalisations | Nm.D.Barber',
  meta: [
    { 
      name: 'description', 
      content: 'Découvrez nos dernières coupes et transformations. Portfolio de Nm.D.Barber.' 
    }
  ]
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.3s ease; 
}
.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
}
</style>