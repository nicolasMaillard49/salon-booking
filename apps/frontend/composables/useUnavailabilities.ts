export interface Unavailability {
  id: string
  date: string
  reason: string | null
  createdAt: string
}

export const useUnavailabilities = () => {
  const config = useRuntimeConfig()
  const API = config.public.apiUrl

  const getAll = (month?: string) =>
    $fetch<Unavailability[]>(`${API}/unavailabilities${month ? `?month=${month}` : ''}`)

  const create = (data: { date: string; reason?: string }, adminPassword: string) =>
    $fetch<Unavailability>(`${API}/unavailabilities/admin`, {
      method: 'POST',
      body: data,
      headers: { 'x-admin-password': adminPassword },
    })

  const remove = (id: string, adminPassword: string) =>
    $fetch(`${API}/unavailabilities/admin/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': adminPassword },
    })

  const removeByDate = (date: string, adminPassword: string) =>
    $fetch(`${API}/unavailabilities/admin/by-date/${date}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': adminPassword },
    })

  return { getAll, create, remove, removeByDate }
}
