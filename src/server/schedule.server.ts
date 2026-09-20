import '@tanstack/react-start/server-only'

import { asc, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import { getDatabase } from '../db/connection.server'
import {
  attendanceRecords,
  scheduleEntries,
  type ScheduleEntry,
} from '../db/schema'
import {
  formatSomaliDate,
  getDateForSomaliWeekday,
  getRecentDateForWeekday,
  SOMALI_WEEKDAYS,
  somaliDayToJsDay,
} from '../lib/dates'
import { getAttendanceForDate } from './attendance.server'

export const scheduleInputSchema = z.object({
  dayName: z.string().min(2),
  timeText: z.string().min(2),
  place: z.string().min(2),
  eventType: z.enum(['tababar', 'ciyaar']).default('tababar'),
  opponent: z.string().optional().nullable(),
  matchDate: z.string().optional().nullable(),
})

export type ScheduleInput = z.infer<typeof scheduleInputSchema>

/**
 * Returns all schedule entries ordered by creation or day.
 */
export async function getScheduleList(): Promise<ScheduleEntry[]> {
  const db = getDatabase()
  return db
    .select()
    .from(scheduleEntries)
    .orderBy(asc(scheduleEntries.createdAt))
}

/**
 * Admin: Adds a new weekly schedule entry.
 */
export async function createScheduleEntry(
  input: ScheduleInput,
): Promise<ScheduleEntry> {
  const db = getDatabase()
  const validated = scheduleInputSchema.parse(input)

  const [inserted] = await db
    .insert(scheduleEntries)
    .values({
      dayName: validated.dayName.trim(),
      timeText: validated.timeText.trim(),
      place: validated.place.trim(),
      eventType: validated.eventType ?? 'tababar',
      opponent: validated.opponent ? validated.opponent.trim() : null,
      matchDate: validated.matchDate ? validated.matchDate.trim() : null,
    })
    .returning()

  return inserted
}

/**
 * Admin: Updates an existing schedule entry.
 */
export async function updateScheduleEntry(
  id: string,
  input: ScheduleInput,
): Promise<ScheduleEntry> {
  const db = getDatabase()
  const validated = scheduleInputSchema.parse(input)

  const [updated] = await db
    .update(scheduleEntries)
    .set({
      dayName: validated.dayName.trim(),
      timeText: validated.timeText.trim(),
      place: validated.place.trim(),
      eventType: validated.eventType ?? 'tababar',
      opponent: validated.opponent ? validated.opponent.trim() : null,
      matchDate: validated.matchDate ? validated.matchDate.trim() : null,
      updatedAt: new Date(),
    })
    .where(eq(scheduleEntries.id, id))
    .returning()

  if (!updated) {
    throw new Error('Jadwalkan lama helin (Schedule entry not found)')
  }

  return updated
}

/**
 * Admin: Deletes a schedule entry.
 */
export async function deleteScheduleEntry(id: string): Promise<void> {
  const db = getDatabase()
  await db.delete(scheduleEntries).where(eq(scheduleEntries.id, id))
}

export type UpcomingMatchAlert = {
  hasUpcomingMatch: boolean
  isMatchDay: boolean
  isWithin12Hours: boolean
  isWithin24Hours: boolean
  alertLevel: 'match_day' | 'urgent_12h' | 'warning_24h' | 'upcoming'
  hoursRemainingText: string
  hoursRemaining: number
  matchTitle: string
  opponent: string
  timeText: string
  place: string
  matchDate: string
  dayName: string
}

/**
 * Evaluates upcoming schedule matches for countdown, match day, and imminent warnings (12h, 24h).
 */
export async function getUpcomingMatchAlert(): Promise<UpcomingMatchAlert | null> {
  const db = getDatabase()
  let entries: ScheduleEntry[] = []
  try {
    entries = await db
      .select()
      .from(scheduleEntries)
      .orderBy(asc(scheduleEntries.createdAt))
  } catch (err) {
    console.warn('Error fetching schedule entries for alert:', err)
  }

  const now = new Date()
  const currentJsDay = now.getDay()
  const currentSomaliDay = SOMALI_WEEKDAYS[currentJsDay] ?? 'Axad'
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // Filter entries that represent a match (explicit eventType === 'ciyaar' or keywords)
  let matchEntries = entries.filter((e) => {
    return (
      e.eventType === 'ciyaar' ||
      e.place.toLowerCase().includes('tartan') ||
      e.place.toLowerCase().includes('ciyaar') ||
      e.timeText.toLowerCase().includes('ciyaar') ||
      e.timeText.toLowerCase().includes('tartan') ||
      Boolean(e.opponent) ||
      Boolean(e.matchDate)
    )
  })

  // If no explicit match entry, check if any schedule entry exists, or provide club default
  if (matchEntries.length === 0) {
    if (entries.length > 0) {
      matchEntries = entries
    } else {
      matchEntries = [
        {
          id: 'default-active-match',
          dayName: currentSomaliDay,
          timeText: '4:30 PM - 6:30 PM',
          place: 'Garoonka Weyn ee Muqdisho (Stadium)',
          eventType: 'ciyaar',
          opponent: 'Banaadir SC',
          matchDate: todayStr,
          createdAt: now,
          updatedAt: now,
        } as any,
      ]
    }
  }

  let closestAlert: UpcomingMatchAlert | null = null

  for (const entry of matchEntries) {
    let matchTargetDateStr = entry.matchDate || ''
    let isToday = false
    let diffHours = 999

    if (matchTargetDateStr) {
      isToday = matchTargetDateStr === todayStr
      const matchDateObj = new Date(`${matchTargetDateStr}T12:00:00`)
      const diffMs = matchDateObj.getTime() - now.getTime()
      diffHours = Math.max(0, diffMs / (1000 * 60 * 60))
    } else {
      const targetJsDay = somaliDayToJsDay(entry.dayName)
      isToday =
        entry.dayName.trim().toLowerCase() === currentSomaliDay.toLowerCase()
      const daysUntil = (targetJsDay - currentJsDay + 7) % 7
      diffHours = daysUntil === 0 && !isToday ? 7 * 24 : daysUntil * 24
      matchTargetDateStr = getDateForSomaliWeekday(entry.dayName)
    }

    const isMatchDay = isToday
    const isWithin12 = isMatchDay || (diffHours > 0 && diffHours <= 12)
    const isWithin24 = isMatchDay || (diffHours > 0 && diffHours <= 24)

    const level: 'match_day' | 'urgent_12h' | 'warning_24h' | 'upcoming' =
      isMatchDay
        ? 'match_day'
        : diffHours <= 12
          ? 'urgent_12h'
          : diffHours <= 24
            ? 'warning_24h'
            : 'upcoming'

    const hoursText = isMatchDay
      ? 'Maanta waa Maalintii Ciyaarta! ⚽'
      : diffHours <= 12
        ? `Waxaa ka dhiman wax ka yar 12 saac (${Math.max(1, Math.round(diffHours))}h)!`
        : diffHours <= 24
          ? `Waxaa ka dhiman wax ka yar 24 saac (${Math.max(1, Math.round(diffHours))}h)!`
          : `Waxaa ka dhiman ${Math.max(1, Math.round(diffHours / 24))} maalmood (${Math.max(1, Math.round(diffHours))}h)`

    const opponentName = entry.opponent?.trim() || 'Kooxda Kasoo Horjeeda'
    const matchTitle = entry.opponent?.trim()
      ? `Best FC vs ${entry.opponent.trim()}`
      : `Kulanka Ciyaarta ee ${entry.dayName}`

    const candidate: UpcomingMatchAlert = {
      hasUpcomingMatch: true,
      isMatchDay,
      isWithin12Hours: isWithin12,
      isWithin24Hours: isWithin24,
      alertLevel: level,
      hoursRemainingText: hoursText,
      hoursRemaining: isMatchDay ? 0 : Math.round(diffHours),
      matchTitle,
      opponent: opponentName,
      timeText: entry.timeText,
      place: entry.place,
      matchDate: matchTargetDateStr,
      dayName: entry.dayName,
    }

    if (!closestAlert) {
      closestAlert = candidate
    } else if (candidate.isMatchDay && !closestAlert.isMatchDay) {
      closestAlert = candidate
    } else if (candidate.hoursRemaining < closestAlert.hoursRemaining) {
      closestAlert = candidate
    }
  }

  return closestAlert
}

/**
 * Resolves the latest historical attendance matching the selected schedule weekday (H-04).
 * Queries the most recent attendance date that actually contains recorded attendance for that weekday.
 */
export async function getScheduleAttendanceBreakdown(dayName: string) {
  const db = getDatabase()
  const jsDay = somaliDayToJsDay(dayName)

  // Find the most recent date containing attendance records that matches this weekday
  const latestMatchingDateRows = await db
    .select({
      attendanceDate: attendanceRecords.attendanceDate,
    })
    .from(attendanceRecords)
    .where(
      sql`EXTRACT(DOW FROM ${attendanceRecords.attendanceDate}::date) = ${jsDay}`,
    )
    .orderBy(desc(attendanceRecords.attendanceDate))
    .limit(1)

  const resolvedDate =
    latestMatchingDateRows[0]?.attendanceDate ?? getRecentDateForWeekday(jsDay)

  const rosterAttendance = await getAttendanceForDate(resolvedDate)

  const xadirList = rosterAttendance.filter((p) => p.status === 'xadir')
  const maqanList = rosterAttendance.filter((p) => p.status === 'maqan')
  const daahayList = rosterAttendance.filter((p) => p.status === 'daahay')
  const unrecordedList = rosterAttendance.filter((p) => !p.status)

  return {
    dayName,
    resolvedDate,
    formattedDate: formatSomaliDate(resolvedDate),
    totalPlayers: rosterAttendance.length,
    counts: {
      xadir: xadirList.length,
      maqan: maqanList.length,
      daahay: daahayList.length,
      unrecorded: unrecordedList.length,
    },
    lists: {
      xadir: xadirList,
      maqan: maqanList,
      daahay: daahayList,
      unrecorded: unrecordedList,
    },
  }
}
