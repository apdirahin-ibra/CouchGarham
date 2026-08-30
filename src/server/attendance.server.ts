import '@tanstack/react-start/server-only'

import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { getDatabase } from '../db/connection.server'
import { attendanceExcuses, attendanceRecords, players } from '../db/schema'

export const attendanceStatusInputSchema = z.object({
  playerId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['xadir', 'maqan', 'daahay']).nullable(),
})

export const attendanceExcuseInputSchema = z.object({
  playerId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string(),
  createdBy: z.enum(['player', 'admin']).default('admin'),
})

export type AttendanceRosterRow = {
  playerId: string
  name: string
  nickname: string | null
  jerseyNumber: number | null
  position: string | null
  status: 'xadir' | 'maqan' | 'daahay' | null
  reason: string | null
  excuseCreatedBy: string | null
}

/**
 * Returns full attendance state for a given date across all active players.
 */
export async function getAttendanceForDate(
  date: string,
): Promise<AttendanceRosterRow[]> {
  const db = getDatabase()

  const rows = await db
    .select({
      playerId: players.id,
      name: players.name,
      nickname: players.nickname,
      jerseyNumber: players.jerseyNumber,
      position: players.position,
      status: attendanceRecords.status,
      reason: attendanceExcuses.reason,
      excuseCreatedBy: attendanceExcuses.createdBy,
    })
    .from(players)
    .leftJoin(
      attendanceRecords,
      and(
        eq(attendanceRecords.playerId, players.id),
        eq(attendanceRecords.attendanceDate, date),
      ),
    )
    .leftJoin(
      attendanceExcuses,
      and(
        eq(attendanceExcuses.playerId, players.id),
        eq(attendanceExcuses.attendanceDate, date),
      ),
    )
    .where(eq(players.isActive, true))
    .orderBy(players.jerseyNumber, players.name)

  return rows
}

/**
 * Admin: Toggles or sets attendance status for a player on a date.
 */
export async function saveAttendanceStatus(input: {
  playerId: string
  date: string
  status: 'xadir' | 'maqan' | 'daahay' | null
}) {
  const db = getDatabase()

  if (input.status === null) {
    await db
      .delete(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.playerId, input.playerId),
          eq(attendanceRecords.attendanceDate, input.date),
        ),
      )
    return null
  }

  const [saved] = await db
    .insert(attendanceRecords)
    .values({
      playerId: input.playerId,
      attendanceDate: input.date,
      status: input.status,
    })
    .onConflictDoUpdate({
      target: [attendanceRecords.playerId, attendanceRecords.attendanceDate],
      set: {
        status: input.status,
        updatedAt: new Date(),
      },
    })
    .returning()

  return saved
}

/**
 * Saves excuse reason on blur or submission.
 * Enforces business rule: excuse reasons can only be attached to existing 'maqan' or 'daahay' records (M-08 & M3-01).
 */
export async function saveAttendanceExcuse(input: {
  playerId: string
  date: string
  reason: string
  createdBy?: 'player' | 'admin'
}) {
  const db = getDatabase()
  const trimmed = input.reason.trim()

  if (!trimmed) {
    // If reason is cleared, delete excuse record
    await db
      .delete(attendanceExcuses)
      .where(
        and(
          eq(attendanceExcuses.playerId, input.playerId),
          eq(attendanceExcuses.attendanceDate, input.date),
        ),
      )
    return null
  }

  // Check matching attendance record status
  const [record] = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.playerId, input.playerId),
        eq(attendanceRecords.attendanceDate, input.date),
      ),
    )
    .limit(1)

  if (!record || (record.status !== 'maqan' && record.status !== 'daahay')) {
    throw new Error(
      'Cudurdaar waxaad u qori kartaa oo kaliya ciyaartoy horey loogu calaamadeeyay Maqan ama Daahay (Excuses require an existing absent or late attendance record)',
    )
  }

  const [saved] = await db
    .insert(attendanceExcuses)
    .values({
      playerId: input.playerId,
      attendanceDate: input.date,
      reason: trimmed,
      createdBy: input.createdBy || 'admin',
    })
    .onConflictDoUpdate({
      target: [attendanceExcuses.playerId, attendanceExcuses.attendanceDate],
      set: {
        reason: trimmed,
        createdBy: input.createdBy || 'admin',
        updatedAt: new Date(),
      },
    })
    .returning()

  return saved
}

/**
 * Player: Returns attendance history for authenticated player.
 */
export async function getPlayerAttendanceHistory(playerId: string) {
  const db = getDatabase()

  const rows = await db
    .select({
      attendanceDate: attendanceRecords.attendanceDate,
      status: attendanceRecords.status,
      reason: attendanceExcuses.reason,
    })
    .from(attendanceRecords)
    .leftJoin(
      attendanceExcuses,
      and(
        eq(attendanceExcuses.playerId, attendanceRecords.playerId),
        eq(attendanceExcuses.attendanceDate, attendanceRecords.attendanceDate),
      ),
    )
    .where(eq(attendanceRecords.playerId, playerId))
    .orderBy(desc(attendanceRecords.attendanceDate))
    .limit(50)

  return rows
}
