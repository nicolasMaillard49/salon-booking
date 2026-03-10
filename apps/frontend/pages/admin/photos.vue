<template>
  <div class="min-h-screen bg-zinc-50">
    <!-- Admin Nav -->
    <AdminNav />

    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-zinc-900">Gérer les réalisations</h1>
        <p class="text-zinc-600 mt-1">Ajoutez et organisez vos photos de coupes</p>
      </div>

      <!-- Upload Section -->
      <div class="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <div class="p-6 md:p-8">
          <h2 class="text-lg font-semibold text-zinc-900 mb-6 flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-up-tray" class="w-5 h-5 text-red-600" />
            Ajouter une nouvelle photo
          </h2>

          <!-- Dropzone -->
          <div
            class="border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-200 cursor-pointer"
            :class="dragOver ? 'border-red-500 bg-red-50' : 'border-zinc-300 hover:border-red-400 hover:bg-zinc-50'"
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            @drop.prevent="onDrop"
            @click="fileInput?.click()"
          >
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />

            <div v-if="!preview">
              <UIcon name="i-heroicons-photo" class="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <p class="text-lg font-semibold text-zinc-900 mb-1">
                Glisse une image ici ou <span class="text-red-600 cursor-pointer">parcourir</span>
              </p>
              <p class="text-sm text-zinc-500">JPG, PNG, WEBP — Max 10 MB</p>
            </div>

            <!-- Preview -->
            <div v-else class="flex flex-col items-center gap-4">
              <img :src="preview" alt="Preview" class="max-h-64 rounded-xl object-contain shadow-md" />
              <button 
                @click.stop="clearFile"
                class="text-sm text-zinc-600 hover:text-red-600 font-medium transition-colors"
              >
                ✕ Changer
              </button>
            </div>
          </div>

          <!-- Caption Input -->
          <div v-if="selectedFile" class="mt-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-zinc-700 mb-2">
                Légende <span class="text-zinc-400 font-normal">(optionnel)</span>
              </label>
              <input
                v-model="caption"
                type="text"
                placeholder="Ex: Dégradé américain avec barbe travaillée"
                class="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all"
              />
            </div>

            <button
              @click="uploadPhoto"
              :disabled="uploading"
              class="w-full bg-red-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span v-if="uploading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <template v-else>
                <UIcon name="i-heroicons-arrow-up-tray" class="w-5 h-5" />
                Publier la photo
              </template>
            </button>
          </div>
        </div>
      </div>

      <!-- Photos Grid -->
      <div v-if="photos.length" class="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div class="p-6 md:p-8 border-b border-zinc-200">
          <h2 class="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <UIcon name="i-heroicons-squares-2x2" class="w-5 h-5 text-red-600" />
            Photos publiées {{ photos.length > 0 && `(${photos.length})` }}
          </h2>
        </div>

        <div class="p-6 md:p-8">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div
              v-for="photo in photos"
              :key="photo.id"
              class="group relative rounded-xl overflow-hidden aspect-[3/4] bg-zinc-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <img 
                :src="photo.url" 
                :alt="photo.caption || 'Réalisation'" 
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              <!-- Caption Overlay -->
              <div v-if="photo.caption" class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p class="text-white text-xs font-medium truncate">{{ photo.caption }}</p>
              </div>

              <!-- Delete Button -->
              <button
                @click="deletePhoto(photo.id)"
                class="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-md"
                title="Supprimer cette photo"
              >
                <UIcon name="i-heroicons-trash-20-solid" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="bg-white border border-zinc-200 rounded-2xl shadow-sm p-12 text-center">
        <div class="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <UIcon name="i-heroicons-photo" class="w-10 h-10 text-zinc-300" />
        </div>
        <h3 class="text-lg font-semibold text-zinc-900">Aucune photo pour l'instant</h3>
        <p class="text-zinc-600 mt-1">Commencez par ajouter votre première réalisation</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Photo } from '~/composables/usePhotos'

definePageMeta({ middleware: 'auth-admin' })

const { getAll, upload, remove } = usePhotos()
const adminPasswordCookie = useCookie('admin_password')

const photos = ref<Photo[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const preview = ref<string | null>(null)
const caption = ref('')
const uploading = ref(false)
const dragOver = ref(false)

const adminPassword = computed(() => adminPasswordCookie.value || '')

onMounted(async () => {
  try {
    photos.value = await getAll()
  } catch (e) {
    console.error('Error loading photos:', e)
  }
})

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) setFile(file)
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    setFile(file)
  }
}

function setFile(file: File) {
  if (file.size > 10 * 1024 * 1024) {
    alert('Le fichier est trop volumineux (max 10 MB)')
    return
  }
  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    preview.value = e.target?.result as string
  }
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
  } catch (e) {
    console.error('Error uploading photo:', e)
    alert('Erreur lors de l\'upload')
  } finally {
    uploading.value = false
  }
}

async function deletePhoto(id: string) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
    return
  }
  try {
    await remove(id, adminPassword.value)
    photos.value = photos.value.filter((p) => p.id !== id)
  } catch (e) {
    console.error('Error deleting photo:', e)
    alert('Erreur lors de la suppression')
  }
}
</script>