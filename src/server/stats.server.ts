import '@tanstack/react-start/server-only'

import { and, eq, gte, lt, sql } from 'drizzle-orm'

import { getDatabase } from '../db/connection.server'
import { attendanceRecords, playerMonthlyStats } from '../db/schema'
import { getCurrentMonthKey, getMonthDateRange } from '../lib/dates'
import { getActiveRoster } from './players.server'

export type RosterPlayerStatRow = {
  playerId: string
  name: string
  nickname: string | null
  jerseyNumber: number | null
  position: string | null
  goals: number
  assists: number
  errors: number
  xadirCount: number
  maqanCount: number
  daahayCount: number
}

/**
 * Returns current month stats for all active players combining goals/assists/errors and attendance totals.
 */
export async function getCurrentMonthRosterStats(
  monthKey: string = getCurrentMonthKey(),
): Promise<RosterPlayerStatRow[]> {
  const db = getDatabase()
  const activePlayers = await getActiveRoster()
  const { startDate, nextMonthStartDate } = getMonthDateRange(monthKey)

  // Manual goals/assists/errors
  const manualStats = await db
    .select()
    .from(playerMonthlyStats)
    .where(eq(playerMonthlyStats.monthKey, monthKey))

  const manualMap = new Map(
    manualStats.map((s) => [
      s.playerId,
      { goals: s.goals, assists: s.assists, errors: s.errors },
    ]),
  )

  // Attendance counts for this month using bounded date comparison
  const attendanceCounts = await db
    .select({
      playerId: attendanceRecords.playerId,
      status: attendanceRecords.status,
      count: sql<number>`count(*)::int`,
    })
    .from(attendanceRecords)
    .where(
      and(
        gte(attendanceRecords.attendanceDate, startDate),
        lt(attendanceRecords.attendanceDate, nextMonthStartDate),
      ),
    )
    .groupBy(attendanceRecords.playerId, attendanceRecords.status)

  const countsMap = new Map<
    string,
    { xadir: number; maqan: number; daahay: number }
  >()
  for (const row of attendanceCounts) {
    if (!countsMap.has(row.playerId)) {
      countsMap.set(row.playerId, { xadir: 0, maqan: 0, daahay: 0 })
    }
    const current = countsMap.get(row.playerId)!
    if (row.status === 'xadir') current.xadir = row.count
    else if (row.status === 'maqan') current.maqan = row.count
    else if (row.status === 'daahay') current.daahay = row.count
  }

  return activePlayers.map((player) => {
    const manual = manualMap.get(player.id) ?? {
      goals: 0,
      assists: 0,
      errors: 0,
    }
    const counts = countsMap.get(player.id) ?? { xadir: 0, maqan: 0, daahay: 0 }

    return {
      playerId: player.id,
      name: player.name,
      nickname: player.nickname,
      jerseyNumber: player.jerseyNumber,
      position: player.position,
      goals: manual.goals,
      assists: manual.assists,
      errors: manual.errors,
      xadirCount: counts.xadir,
      maqanCount: counts.maqan,
      daahayCount: counts.daahay,
    }
  })
}

/**
 * Admin: Updates a player's goals, assists, and errors for a specific month.
 */
export async function updatePlayerMonthlyStats(input: {
  playerId: string
  monthKey: string
  goals: number
  assists: number
  errors: number
}) {
  const db = getDatabase()

  const [saved] = await db
    .insert(playerMonthlyStats)
    .values({
      playerId: input.playerId,
      monthKey: input.monthKey,
      goals: Math.max(0, input.goals),
      assists: Math.max(0, input.assists),
      errors: Math.max(0, input.errors),
    })
    .onConflictDoUpdate({
      target: [playerMonthlyStats.playerId, playerMonthlyStats.monthKey],
      set: {
        goals: Math.max(0, input.goals),
        assists: Math.max(0, input.assists),
        errors: Math.max(0, input.errors),
        updatedAt: new Date(),
      },
    })
    .returning()

  return saved
}

/**
 * Player: Returns own monthly stats summary.
 */
export async function getPlayerMonthlyStats(
  playerId: string,
  monthKey: string = getCurrentMonthKey(),
) {
  const db = getDatabase()
  const { startDate, nextMonthStartDate } = getMonthDateRange(monthKey)

  const [manual] = await db
    .select()
    .from(playerMonthlyStats)
    .where(
      and(
        eq(playerMonthlyStats.playerId, playerId),
        eq(playerMonthlyStats.monthKey, monthKey),
      ),
    )
    .limit(1)

  const attendanceCounts = await db
    .select({
      status: attendanceRecords.status,
      count: sql<number>`count(*)::int`,
    })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.playerId, playerId),
        gte(attendanceRecords.attendanceDate, startDate),
        lt(attendanceRecords.attendanceDate, nextMonthStartDate),
      ),
    )
    .groupBy(attendanceRecords.status)

  let xadir = 0
  let maqan = 0
  let daahay = 0

  for (const row of attendanceCounts) {
    if (row.status === 'xadir') xadir = row.count
    else if (row.status === 'maqan') maqan = row.count
    else if (row.status === 'daahay') daahay = row.count
  }

  return {
    monthKey,
    goals: manual?.goals ?? 0,
    assists: manual?.assists ?? 0,
    errors: manual?.errors ?? 0,
    xadirCount: xadir,
    maqanCount: maqan,
    daahayCount: daahay,
  }
}
