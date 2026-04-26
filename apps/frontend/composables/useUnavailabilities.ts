export interface Unavailability {
  id: string
  date: string
  createdAt: string
}

export interface ConflictBooking {
  id: string
  date?: string
  timeSlot: string
  firstName: string
  lastName: string
  email: string
}

export interface RangeResult {
  created: Unavailability[]
  skipped: string[]
}

export const useUnavailabilities = () => {
  const config = useRuntimeConfig()
  const API = config.public.apiUrl

  const getAll = (month?: string) =>
    $fetch<Unavailability[]>(`${API}/unavailabilities${month ? `?month=${month}` : ''}`)

  const create = (date: string, adminPassword: string, cascade = false) =>
    $fetch<Unavailability>(`${API}/unavailabilities/admin`, {
      method: 'POST',
      body: { date, cascade },
      headers: { 'x-admin-password': adminPassword },
    })

  const createRange = (from: string, to: string, adminPassword: string, cascade = false) =>
    $fetch<RangeResult>(`${API}/unavailabilities/admin/range`, {
      method: 'POST',
      body: { from, to, cascade },
      headers: { 'x-admin-password': adminPassword },
    })

  const removeByDate = (date: string, adminPassword: string) =>
    $fetch(`${API}/unavailabilities/admin/by-date/${date}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': adminPassword },
    })

  return { getAll, create, createRange, removeByDate }
}
