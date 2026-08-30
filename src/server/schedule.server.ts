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
  getRecentDateForWeekday,
  somaliDayToJsDay,
} from '../lib/dates'
import { getAttendanceForDate } from './attendance.server'

export const scheduleInputSchema = z.object({
  dayName: z.string().min(2),
  timeText: z.string().min(2),
  place: z.string().min(2),
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
