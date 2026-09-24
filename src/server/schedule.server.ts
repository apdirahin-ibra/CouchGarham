import '@tanstack/react-start/server-only'

import { asc, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import { getDatabase, getDatabaseClient } from '../db/connection.server'
import {
  attendanceRecords,
  clubSettings,
  scheduleEntries,
  type ScheduleEntry,
} from '../db/schema'
import {
  formatSomaliDate,
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
  matchTime: z.string().optional().nullable(),
  customHoursRemaining: z.string().optional().nullable(),
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
      matchTime: validated.matchTime ? validated.matchTime.trim() : null,
      customHoursRemaining: validated.customHoursRemaining
        ? validated.customHoursRemaining.trim()
        : null,
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
      matchTime: validated.matchTime ? validated.matchTime.trim() : null,
      customHoursRemaining: validated.customHoursRemaining
        ? validated.customHoursRemaining.trim()
        : null,
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
  minutesRemaining?: number
  matchTitle: string
  opponent: string
  timeText: string
  place: string
  matchDate: string
  dayName: string
  isCustomAdminTime?: boolean
  scheduleId?: string
  matchAlertMode?: string
}

/**
 * Accurately parses kickoff / match time strings into 24-hr hours and minutes.
 * Handles: "16:30", "4:30 PM", "4:30pm", "4:30 Galabnimo", "4:00", "04:30", etc.
 */
export function parseTimeToHoursAndMinutes(timeStr?: string | null): {
  hours: number
  minutes: number
} {
  if (!timeStr) return { hours: 16, minutes: 30 }
  const clean = timeStr.trim()

  // Match 24hr format: "16:30", "09:15"
  const m24 = clean.match(/^(\d{1,2}):(\d{2})$/)
  if (m24) {
    const h = parseInt(m24[1], 10)
    const m = parseInt(m24[2], 10)
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return { hours: h, minutes: m }
    }
  }

  // Match 12hr / colloquial: e.g. "4:30 PM", "4:30pm", "4:30 Galabnimo", "4:30", "16:30 - 18:30"
  const m12 = clean.match(
    /(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm|Galab|Habeen|Subax)?/i,
  )
  if (m12) {
    let h = parseInt(m12[1], 10)
    const m = m12[2] ? parseInt(m12[2], 10) : 0
    const period = m12[3]?.toLowerCase()

    if (period === 'pm' || period === 'galab' || period === 'habeen') {
      if (h < 12) h += 12
    } else if (period === 'am' || period === 'subax') {
      if (h === 12) h = 0
    } else {
      // Default football hours: 1 to 9 are afternoon/evening PM in Somalia
      if (h >= 1 && h <= 9) {
        h += 12
      }
    }
    return {
      hours: Math.min(23, Math.max(0, h)),
      minutes: Math.min(59, Math.max(0, m)),
    }
  }

  return { hours: 16, minutes: 30 }
}

let hasEnsuredColumns = false
export async function ensureMatchAlertColumns() {
  if (hasEnsuredColumns) return
  try {
    const client = getDatabaseClient()
    await client`
      ALTER TABLE club_settings ADD COLUMN IF NOT EXISTS match_alert_mode varchar(50) DEFAULT 'auto' NOT NULL;
      ALTER TABLE club_settings ADD COLUMN IF NOT EXISTS match_alert_custom_hours varchar(100);
      ALTER TABLE club_settings ADD COLUMN IF NOT EXISTS match_alert_schedule_id varchar(100);
      ALTER TABLE schedule_entries ADD COLUMN IF NOT EXISTS match_time varchar(50);
      ALTER TABLE schedule_entries ADD COLUMN IF NOT EXISTS custom_hours_remaining varchar(100);
    `
    hasEnsuredColumns = true
  } catch {
    hasEnsuredColumns = true
  }
}

/**
 * Admin: Sets or overrides the match countdown alert mode and custom remaining time.
 */
export async function setMatchCountdownAlert(input: {
  mode: 'auto' | 'custom' | 'match_day' | 'urgent_12h' | 'warning_24h'
  customHours?: string | null
  scheduleId?: string | null
}): Promise<UpcomingMatchAlert | null> {
  const db = getDatabase()
  await ensureMatchAlertColumns()

  const existing = await db
    .select()
    .from(clubSettings)
    .where(eq(clubSettings.id, 'default'))
    .limit(1)

  if (existing.length === 0) {
    await db.insert(clubSettings).values({
      id: 'default',
      matchAlertMode: input.mode,
      matchAlertCustomHours: input.customHours?.trim() || null,
      matchAlertScheduleId: input.scheduleId?.trim() || null,
    })
  } else {
    await db
      .update(clubSettings)
      .set({
        matchAlertMode: input.mode,
        matchAlertCustomHours: input.customHours?.trim() || null,
        matchAlertScheduleId: input.scheduleId?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(clubSettings.id, 'default'))
  }

  return getUpcomingMatchAlert()
}

/**
 * Evaluates upcoming schedule matches for countdown, match day, and imminent warnings (12h, 24h),
 * tied directly to the schedule kickoff times, or respecting admin's custom remaining time.
 */
export async function getUpcomingMatchAlert(): Promise<UpcomingMatchAlert | null> {
  const db = getDatabase()
  await ensureMatchAlertColumns()

  let entries: ScheduleEntry[] = []
  try {
    entries = await db
      .select()
      .from(scheduleEntries)
      .orderBy(asc(scheduleEntries.createdAt))
  } catch (err) {
    console.warn('Error fetching schedule entries for alert:', err)
  }

  let settings: any = null
  try {
    const [row] = await db
      .select()
      .from(clubSettings)
      .where(eq(clubSettings.id, 'default'))
      .limit(1)
    settings = row
  } catch (err) {
    console.warn('Error fetching clubSettings for alert:', err)
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

  // Prioritize admin-selected schedule entry if specified
  if (settings?.matchAlertScheduleId) {
    const targeted = entries.find((e) => e.id === settings.matchAlertScheduleId)
    if (targeted) {
      matchEntries = [
        targeted,
        ...matchEntries.filter((e) => e.id !== settings.matchAlertScheduleId),
      ]
    }
  }

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
          matchTime: '16:30',
          customHoursRemaining: null,
          createdAt: now,
          updatedAt: now,
        } as any,
      ]
    }
  }

  let closestAlert: UpcomingMatchAlert | null = null

  for (const entry of matchEntries) {
    const timeParsed = parseTimeToHoursAndMinutes(
      entry.matchTime || entry.timeText,
    )
    let targetDateTime: Date
    let isToday: boolean
    let matchTargetDateStr = entry.matchDate || ''

    if (matchTargetDateStr) {
      const [y, m, d] = matchTargetDateStr.split('-').map(Number)
      targetDateTime = new Date(
        y,
        m - 1,
        d,
        timeParsed.hours,
        timeParsed.minutes,
        0,
        0,
      )
      isToday = matchTargetDateStr === todayStr
    } else {
      const targetJsDay = somaliDayToJsDay(entry.dayName)
      let daysUntil = (targetJsDay - currentJsDay + 7) % 7
      isToday =
        entry.dayName.trim().toLowerCase() === currentSomaliDay.toLowerCase()

      // If today is match day, check if kickoff + 2.5 hours has already passed
      if (daysUntil === 0) {
        const todayKickoff = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          timeParsed.hours,
          timeParsed.minutes,
          0,
          0,
        )
        if (now.getTime() > todayKickoff.getTime() + 2.5 * 60 * 60 * 1000) {
          daysUntil = 7
          isToday = false
        }
      }

      const futureDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + daysUntil,
        timeParsed.hours,
        timeParsed.minutes,
        0,
        0,
      )
      targetDateTime = futureDate
      matchTargetDateStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`
    }

    const diffMs = targetDateTime.getTime() - now.getTime()
    const totalMinutes = Math.round(diffMs / (1000 * 60))
    const totalHours = diffMs / (1000 * 60 * 60)
    const remDays = Math.floor(Math.max(0, totalMinutes) / (24 * 60))
    const remHours = Math.floor((Math.max(0, totalMinutes) % (24 * 60)) / 60)
    const remMinutes = Math.max(0, totalMinutes) % 60

    // Skip past matches that ended more than 4 hours ago if there are other matches
    if (diffMs < -4 * 60 * 60 * 1000 && matchEntries.length > 1) {
      continue
    }

    const isMatchDay =
      isToday || targetDateTime.toDateString() === now.toDateString()
    const isWithin12 = isMatchDay || (totalHours > 0 && totalHours <= 12)
    const isWithin24 = isMatchDay || (totalHours > 0 && totalHours <= 24)

    const level: 'match_day' | 'urgent_12h' | 'warning_24h' | 'upcoming' =
      isMatchDay
        ? 'match_day'
        : totalHours <= 12
          ? 'urgent_12h'
          : totalHours <= 24
            ? 'warning_24h'
            : 'upcoming'

    let hoursText: string
    if (diffMs <= 0 && diffMs >= -2.5 * 60 * 60 * 1000) {
      hoursText = 'Ciyaartu way socotaa hadda! ⚽'
    } else if (isMatchDay) {
      if (remHours > 0 && remMinutes > 0) {
        hoursText = `Maanta waa Maalintii Ciyaarta! (Waxaa ka dhiman ${remHours} saac iyo ${remMinutes} daqiiqo) ⚽`
      } else if (remHours > 0) {
        hoursText = `Maanta waa Maalintii Ciyaarta! (Waxaa ka dhiman ${remHours} saac) ⚽`
      } else if (remMinutes > 0) {
        hoursText = `Maanta waa Maalintii Ciyaarta! (Waxaa ka dhiman ${remMinutes} daqiiqo oo kaliya) ⏱️`
      } else {
        hoursText = 'Maanta waa Maalintii Ciyaarta! ⚽'
      }
    } else if (totalHours <= 12) {
      if (remHours > 0 && remMinutes > 0) {
        hoursText = `Waxaa ka dhiman ${remHours} saac iyo ${remMinutes} daqiiqo (wax ka yar 12 saac)!`
      } else if (remHours > 0) {
        hoursText = `Waxaa ka dhiman ${remHours} saac (wax ka yar 12 saac)!`
      } else {
        hoursText = `Waxaa ka dhiman ${remMinutes} daqiiqo oo kaliya! ⏱️`
      }
    } else if (totalHours <= 24) {
      if (remHours > 0 && remMinutes > 0) {
        hoursText = `Waxaa ka dhiman ${remHours} saac iyo ${remMinutes} daqiiqo (wax ka yar 24 saac)!`
      } else {
        hoursText = `Waxaa ka dhiman ${remHours} saac (wax ka yar 24 saac)!`
      }
    } else {
      hoursText =
        remDays > 0
          ? `Waxaa ka dhiman ${remDays} maalmood iyo ${remHours} saac (${Math.max(1, Math.round(totalHours))}h)`
          : `Waxaa ka dhiman ${remHours} saac`
    }

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
      hoursRemaining: isMatchDay ? 0 : Math.max(0, Math.round(totalHours)),
      minutesRemaining: remMinutes,
      matchTitle,
      opponent: opponentName,
      timeText: entry.timeText,
      place: entry.place,
      matchDate: matchTargetDateStr,
      dayName: entry.dayName,
      scheduleId: entry.id,
      matchAlertMode: settings?.matchAlertMode || 'auto',
    }

    // Check entry-level custom override or global admin settings override
    const customHoursSetting =
      entry.customHoursRemaining || settings?.matchAlertCustomHours
    const alertMode = settings?.matchAlertMode || 'auto'

    if (alertMode === 'urgent_12h') {
      candidate.isWithin12Hours = true
      candidate.isWithin24Hours = true
      candidate.alertLevel = 'urgent_12h'
      candidate.hoursRemaining = 12
      candidate.hoursRemainingText = customHoursSetting
        ? `Waxaa ka dhiman ${customHoursSetting}!`
        : 'Waxaa ka dhiman wax ka yar 12 saac (12h)!'
      candidate.isCustomAdminTime = true
    } else if (alertMode === 'warning_24h') {
      candidate.isWithin12Hours = false
      candidate.isWithin24Hours = true
      candidate.alertLevel = 'warning_24h'
      candidate.hoursRemaining = 24
      candidate.hoursRemainingText = customHoursSetting
        ? `Waxaa ka dhiman ${customHoursSetting}!`
        : 'Waxaa ka dhiman wax ka yar 24 saac (24h)!'
      candidate.isCustomAdminTime = true
    } else if (alertMode === 'match_day') {
      candidate.isMatchDay = true
      candidate.isWithin12Hours = true
      candidate.isWithin24Hours = true
      candidate.alertLevel = 'match_day'
      candidate.hoursRemaining = 0
      candidate.hoursRemainingText = customHoursSetting
        ? `Maanta waa Maalintii Ciyaarta! (${customHoursSetting}) ⚽`
        : 'Maanta waa Maalintii Ciyaarta! (0 saac) ⚽'
      candidate.isCustomAdminTime = true
    } else if (alertMode === 'custom' && customHoursSetting) {
      candidate.hoursRemainingText = `Waxaa ka dhiman ${customHoursSetting}!`
      const parsedH = parseInt(customHoursSetting, 10) || 0
      if (parsedH <= 12 || customHoursSetting.includes('12')) {
        candidate.isWithin12Hours = true
        candidate.isWithin24Hours = true
        candidate.alertLevel = 'urgent_12h'
      } else if (parsedH <= 24 || customHoursSetting.includes('24')) {
        candidate.isWithin12Hours = false
        candidate.isWithin24Hours = true
        candidate.alertLevel = 'warning_24h'
      }
      candidate.hoursRemaining = parsedH
      candidate.isCustomAdminTime = true
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
