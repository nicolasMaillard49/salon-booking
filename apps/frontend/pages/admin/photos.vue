<template>
  <div class="min-h-screen bg-zinc-50">

    <!-- Topbar -->
    <div class="sticky top-0 z-10 bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <UButton to="/admin" icon="i-heroicons-arrow-left" variant="ghost" color="gray" size="sm" class="cursor-pointer" />
        <div>
          <p class="text-sm font-semibold text-zinc-900">Réalisations</p>
          <p class="text-xs text-zinc-400 font-mono">{{ photos.length }} photo{{ photos.length > 1 ? 's' : '' }}</p>
        </div>
      </div>
      <UButton to="/realisations" icon="i-heroicons-arrow-top-right-on-square" variant="ghost" color="gray" size="sm" class="cursor-pointer text-xs">
        Voir la galerie
      </UButton>
    </div>

    <div class="max-w-4xl mx-auto py-8 px-4 space-y-8">

      <!-- Zone d'upload -->
      <div class="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <h2 class="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4 text-indigo-500" />
          Ajouter une photo
        </h2>

        <!-- Dropzone -->
        <div
          class="border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 cursor-pointer"
          :class="dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-zinc-300 hover:border-indigo-300 hover:bg-zinc-50'"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="onDrop"
          @click="fileInput?.click()"
        >
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />

          <div v-if="!preview">
            <UIcon name="i-heroicons-photo" class="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p class="text-sm font-medium text-zinc-500">Glisse une photo ici ou <span class="text-indigo-600">clique pour parcourir</span></p>
            <p class="text-xs text-zinc-400 mt-1 font-mono">JPG, PNG, WEBP — Max 10 MB</p>
          </div>

          <!-- Preview -->
          <div v-else class="flex flex-col items-center gap-3">
            <img :src="preview" class="max-h-48 rounded-lg object-contain shadow-sm" />
            <button class="text-xs text-zinc-400 hover:text-red-500 font-mono cursor-pointer" @click.stop="clearFile">
              Supprimer
            </button>
          </div>
        </div>

        <!-- Caption + submit -->
        <div v-if="selectedFile" class="mt-4 space-y-3">
          <div class="space-y-1.5">
            <label class="block text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-widest">Légende (optionnel)</label>
            <input
              v-model="caption"
              type="text"
              placeholder="Ex: Dégradé américain + barbe"
              class="w-full px-3 py-2.5 rounded-lg border border-zinc-300 bg-zinc-50 text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <button
            :disabled="uploading"
            class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            @click="uploadPhoto"
          >
            <span v-if="uploading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <template v-else>
              <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4" />
              Publier la photo
            </template>
          </button>
        </div>
      </div>

      <!-- Grille des photos -->
      <div v-if="photos.length" class="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <h2 class="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <UIcon name="i-heroicons-squares-2x2" class="w-4 h-4 text-indigo-500" />
          Photos publiées
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div
            v-for="photo in photos"
            :key="photo.id"
            class="group relative rounded-xl overflow-hidden aspect-square bg-zinc-100"
          >
            <img :src="photo.url" :alt="photo.caption || ''" class="w-full h-full object-cover" loading="lazy" />
            <!-- Caption -->
            <div v-if="photo.caption" class="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1.5">
              <p class="text-white text-[10px] font-mono truncate">{{ photo.caption }}</p>
            </div>
            <!-- Bouton supprimer -->
            <button
              class="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600"
              @click="deletePhoto(photo.id)"
            >
              <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 text-sm font-mono text-zinc-400">
        Aucune photo publiée pour l'instant.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Photo } from '~/composables/usePhotos'

definePageMeta({ middleware: 'auth-admin' })

const { getAll, upload, remove } = usePhotos()
const cookie = useCookie('admin_password')
const adminPassword = computed(() => cookie.value || '')

const photos = ref<Photo[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const preview = ref<string | null>(null)
const caption = ref('')
const uploading = ref(false)
const dragOver = ref(false)

onMounted(async () => {
  photos.value = await getAll()
})

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) setFile(file)
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) setFile(file)
}

function setFile(file: File) {
  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = e => { preview.value = e.target?.result as string }
  reader.readAsDataURL(file)
}

function clearFile() {
  selectedFile.value = null
  preview.value = null
  caption.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function uploadPhoto() {
  if (!selectedFile.value) return
  uploading.value = true
  try {
    const photo = await upload(selectedFile.value, caption.value, adminPassword.value)
    photos.value.unshift(photo)
    clearFile()
  } finally {
    uploading.value = false
  }
}

async function deletePhoto(id: string) {
  await remove(id, adminPassword.value)
  photos.value = photos.value.filter(p => p.id !== id)
}
</script>
