export const WEEKDAY_SLOTS = ['12:00', '18:00'];
export const WEEKEND_SLOTS = ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export function getSlotsForDay(dayOfWeek: number): string[] {
  // 0=Sun, 1=Mon, ..., 4=Thu, 5=Fri, 6=Sat
  if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
    return WEEKEND_SLOTS;
  }
  return WEEKDAY_SLOTS;
}

export function isWeekendDay(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
}
