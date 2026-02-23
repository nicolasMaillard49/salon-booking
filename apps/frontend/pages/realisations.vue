<template>
  <div class="min-h-screen">

    <!-- Nav -->
    <div class="fixed top-4 left-4 right-4 z-20 flex items-center justify-between">
      <UButton to="/" icon="i-heroicons-arrow-left" size="sm" color="gray"
        class="bg-zinc-900 text-white border border-zinc-700 hover:bg-zinc-700 cursor-pointer font-medium">
        Retour
      </UButton>
      <div class="bg-zinc-900 border border-zinc-700 rounded-full px-4 py-1.5">
        <span class="text-xs font-mono text-zinc-300 tracking-wider uppercase">Nm.D.Barber</span>
      </div>
    </div>

    <div class="max-w-5xl mx-auto pt-24 pb-16 px-4">

      <!-- Header -->
      <div class="mb-10">
        <p class="text-xs font-mono text-indigo-500 uppercase tracking-widest mb-2">Portfolio</p>
        <h1 class="text-3xl font-bold tracking-tight text-zinc-900 mb-1">Réalisations</h1>
        <p class="text-zinc-500 text-sm">Les dernières coupes du salon.</p>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="columns-2 md:columns-3 gap-3 space-y-3">
        <div v-for="n in 9" :key="n" class="break-inside-avoid rounded-xl bg-zinc-100 animate-pulse"
          :style="{ height: `${160 + (n % 3) * 60}px` }" />
      </div>

      <!-- Vide -->
      <div v-else-if="!photos.length" class="text-center py-24">
        <UIcon name="i-heroicons-photo" class="w-12 h-12 text-zinc-200 mx-auto mb-3" />
        <p class="text-sm font-mono text-zinc-400">Aucune réalisation pour le moment.</p>
      </div>

      <!-- Galerie masonry -->
      <div v-else class="columns-2 md:columns-3 gap-3">
        <div
          v-for="photo in photos"
          :key="photo.id"
          class="break-inside-avoid mb-3 group relative rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-200"
          @click="openPhoto(photo)"
        >
          <img
            :src="photo.url"
            :alt="photo.caption || 'Réalisation Nm.D.Barber'"
            class="w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <!-- Caption overlay -->
          <div
            v-if="photo.caption"
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200"
          >
            <p class="text-white text-xs font-medium truncate">{{ photo.caption }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <Transition name="fade">
      <div
        v-if="selected"
        class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        @click.self="selected = null"
      >
        <button class="absolute top-4 right-4 text-white/60 hover:text-white cursor-pointer" @click="selected = null">
          <UIcon name="i-heroicons-x-mark" class="w-7 h-7" />
        </button>
        <div class="max-w-2xl w-full">
          <img :src="selected.url" :alt="selected.caption || ''" class="w-full rounded-xl object-contain max-h-[80vh]" />
          <p v-if="selected.caption" class="text-white/70 text-sm font-mono text-center mt-3">{{ selected.caption }}</p>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import type { Photo } from '~/composables/usePhotos'

const { getAll } = usePhotos()

const { data: photos, pending } = await useAsyncData('photos', () => getAll(), { default: () => [] as Photo[] })

const selected = ref<Photo | null>(null)
function openPhoto(photo: Photo) {
  selected.value = photo
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
