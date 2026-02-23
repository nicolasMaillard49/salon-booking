export interface Photo {
  id: string
  url: string
  publicId: string
  caption: string | null
  createdAt: string
}

export const usePhotos = () => {
  const config = useRuntimeConfig()
  const API = config.public.apiUrl

  const getAll = () => $fetch<Photo[]>(`${API}/photos`)

  const upload = (file: File, caption: string, adminPassword: string) => {
    const form = new FormData()
    form.append('file', file)
    if (caption) form.append('caption', caption)
    return $fetch<Photo>(`${API}/photos`, {
      method: 'POST',
      body: form,
      headers: { 'x-admin-password': adminPassword },
    })
  }

  const remove = (id: string, adminPassword: string) =>
    $fetch<{ success: boolean }>(`${API}/photos/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': adminPassword },
    })

  return { getAll, upload, remove }
}
