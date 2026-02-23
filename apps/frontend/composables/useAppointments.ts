export interface DayAvailability {
  date: string
  available: boolean
}

export interface Appointment {
  id: string
  date: string
  firstName: string
  lastName: string
  email: string
  magicToken: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
}

export interface WeekData {
  week: string
  total: number
  pending: number
  confirmed: number
  cancelled: number
  appointments: Appointment[]
}

export const useAppointments = () => {
  const config = useRuntimeConfig()
  const API = config.public.apiUrl

  const getAvailability = (month: string) =>
    $fetch<DayAvailability[]>(`${API}/appointments/availability?month=${month}`)

  const createAppointment = (data: {
    date: string
    firstName: string
    lastName: string
    email: string
  }) => $fetch<Appointment>(`${API}/appointments`, { method: 'POST', body: data })

  const getByToken = (token: string) =>
    $fetch<Appointment>(`${API}/appointments/status/${token}`)

  const getWeek = (week: string, adminPassword: string) =>
    $fetch<WeekData>(`${API}/appointments/admin?week=${week}`, {
      headers: { 'x-admin-password': adminPassword },
    })

  const updateStatus = (id: string, status: 'CONFIRMED' | 'CANCELLED', adminPassword: string) =>
    $fetch<Appointment>(`${API}/appointments/admin/${id}/status`, {
      method: 'PATCH',
      body: { status },
      headers: { 'x-admin-password': adminPassword },
    })

  return { getAvailability, createAppointment, getByToken, getWeek, updateStatus }
}
