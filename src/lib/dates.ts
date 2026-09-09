export const SOMALI_WEEKDAYS = [
  'Axad',
  'Isniin',
  'Talaado',
  'Arbaco',
  'Khamiis',
  'Jimco',
  'Sabti',
] as const

export type SomaliWeekday = (typeof SOMALI_WEEKDAYS)[number]

const SOMALI_MONTHS = [
  'Janaayo',
  'Febraayo',
  'Maarso',
  'Abriil',
  'Maajo',
  'Juun',
  'Luuliyo',
  'Ogosto',
  'Sebteembar',
  'Oktoobar',
  'Nofembar',
  'Diseembar',
]

/**
 * Maps Somali weekday name to JavaScript getDay() index (0 = Sunday = Axad, 6 = Saturday = Sabti).
 */
export function somaliDayToJsDay(dayName: string): number {
  const normalized = dayName.trim()
  const index = SOMALI_WEEKDAYS.findIndex(
    (d) => d.toLowerCase() === normalized.toLowerCase(),
  )
  return index !== -1 ? index : 0
}

/**
 * Maps JavaScript getDay() index to Somali weekday name.
 */
export function jsDayToSomaliDay(jsDay: number): SomaliWeekday {
  const normalizedIndex = ((jsDay % 7) + 7) % 7
  return SOMALI_WEEKDAYS[normalizedIndex] ?? 'Axad'
}

/**
 * Returns the most recent date (or today) string YYYY-MM-DD corresponding to a Somali weekday name.
 */
export function getDateForSomaliWeekday(dayName: string): string {
  const targetJsDay = somaliDayToJsDay(dayName)
  const now = new Date()
  const currentJsDay = now.getDay()
  const diff = (currentJsDay - targetJsDay + 7) % 7
  const d = new Date(now)
  d.setDate(now.getDate() - diff)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Formats a Date object or ISO date string into a friendly Somali date banner string:
 * e.g. "Axad, 30 Ogosto 2026"
 */
export function formatSomaliDate(input: Date | string): string {
  const d =
    typeof input === 'string'
      ? new Date(input.includes('T') ? input : `${input}T00:00:00`)
      : input
  if (isNaN(d.getTime())) return ''
  const weekday = jsDayToSomaliDay(d.getDay())
  const day = d.getDate()
  const month = SOMALI_MONTHS[d.getMonth()] ?? ''
  const year = d.getFullYear()
  return `${weekday}, ${day} ${month} ${year}`
}

/**
 * Returns month key in YYYY-MM format.
 */
export function getCurrentMonthKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Returns today's ISO date string in YYYY-MM-DD format.
 */
export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns bounded start and end date range for a month key in YYYY-MM format.
 * Guarantees standard PostgreSQL date comparisons (>= startDate AND < nextMonthStartDate).
 */
export function getMonthDateRange(monthKey: string): {
  startDate: string
  nextMonthStartDate: string
} {
  const parts = monthKey.split('-')
  const year = parseInt(parts[0] ?? '2026', 10)
  const month = parseInt(parts[1] ?? '1', 10)

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const nextMonthYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextMonthStartDate = `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-01`

  return { startDate, nextMonthStartDate }
}

/**
 * Resolves the most recent date matching the target JS weekday index (0-6) relative to reference date.
 */
export function getRecentDateForWeekday(
  targetJsDay: number,
  referenceDate: Date = new Date(),
): string {
  const ref = new Date(referenceDate)
  ref.setHours(0, 0, 0, 0)
  const currentJsDay = ref.getDay()
  const diff = (currentJsDay - targetJsDay + 7) % 7
  ref.setDate(ref.getDate() - diff)
  return getTodayDateString(ref)
}
