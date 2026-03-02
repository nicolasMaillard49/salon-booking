export interface SlotAvailability {
  time: string
  available: boolean
  bookedBy?: string
  isPending?: boolean
  isBenjThursday?: boolean
}

export interface DayAvailability {
  date: string
  isWeekend: boolean
  slots: SlotAvailability[]
}

export interface Appointment {
  id: string
  date: string
  timeSlot: string
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
    timeSlot: string
    firstName: string
    lastName: string
    email: string
  }) => $fetch<Appointment>(`${API}/appointments`, { method: 'POST', body: data })

  const getByToken = (token: string) =>
    $fetch<Appointment>(`${API}/appointments/status/${token}`)

  const getByEmail = (email: string) =>
    $fetch<Pick<Appointment, 'id' | 'date' | 'timeSlot' | 'firstName' | 'lastName' | 'status' | 'magicToken' | 'createdAt'>[]>(
      `${API}/appointments/my?email=${encodeURIComponent(email)}`
    )

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

  const deleteAppointment = (id: string, adminPassword: string) =>
    $fetch(`${API}/appointments/admin/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': adminPassword },
    })

  return { getAvailability, createAppointment, getByToken, getByEmail, getWeek, updateStatus, deleteAppointment }
}
