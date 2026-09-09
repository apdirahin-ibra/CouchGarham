import '@tanstack/react-start/server-only'

import { and, asc, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { getDatabase } from '../db/connection.server'
import {
  attendanceExcuses,
  attendanceRecords,
  authSessions,
  authUsers,
  chatMessages,
  excuseRequests,
  leaveRequests,
  loginLogs,
  playerFeeRecords,
  playerMatchRatings,
  playerMonthlyStats,
  players,
  suggestions,
  type Player,
} from '../db/schema'
import { getCurrentMonthKey } from '../lib/dates'

export const playerInputSchema = z.object({
  name: z.string().min(2, 'Magacu waa inuu ka koobnaadaa ugu yaraan 2 xaraf'),
  nickname: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  jerseyNumber: z.number().int().min(1).max(99).optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  legacyPin: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export type PlayerInput = z.infer<typeof playerInputSchema>

export type LoginPlayerProjection = {
  id: string
  name: string
  nickname: string | null
  jerseyNumber: number | null
  position: string | null
}

/**
 * Returns minimal public projection of active players for login selector (M-03).
 */
export async function getRosterForLogin(): Promise<LoginPlayerProjection[]> {
  const db = getDatabase()
  return db
    .select({
      id: players.id,
      name: players.name,
      nickname: players.nickname,
      jerseyNumber: players.jerseyNumber,
      position: players.position,
    })
    .from(players)
    .where(eq(players.isActive, true))
    .orderBy(asc(players.jerseyNumber), asc(players.name))
}

/**
 * Returns active players for roster listings.
 */
export async function getActiveRoster(): Promise<Player[]> {
  const db = getDatabase()
  return db
    .select()
    .from(players)
    .where(eq(players.isActive, true))
    .orderBy(asc(players.jerseyNumber), asc(players.name))
}

/**
 * Returns all players for Admin management (both active and inactive).
 */
export async function getAllPlayersAdmin(): Promise<Player[]> {
  const db = getDatabase()
  return db
    .select()
    .from(players)
    .orderBy(
      desc(players.isActive),
      asc(players.jerseyNumber),
      asc(players.name),
    )
}

/**
 * Generates a unique 4-digit PIN not in use by any player.
 */
export async function generateUniquePlayerPin(): Promise<string> {
  const db = getDatabase()
  const existing = await db.select({ pin: players.legacyPin }).from(players)
  const usedPins = new Set(existing.map((p) => p.pin?.trim()).filter(Boolean))

  for (let attempt = 0; attempt < 1000; attempt++) {
    const candidate = String(Math.floor(1000 + Math.random() * 9000))
    if (!usedPins.has(candidate)) {
      return candidate
    }
  }

  return String(Math.floor(1000 + Math.random() * 9000))
}

/**
 * Admin: Creates a new player on the roster.
 */
export async function createPlayerAdmin(input: PlayerInput): Promise<Player> {
  const db = getDatabase()
  const validated = playerInputSchema.parse(input)

  let pin = validated.legacyPin?.trim() || null
  if (!pin) {
    pin = await generateUniquePlayerPin()
  }

  const [inserted] = await db
    .insert(players)
    .values({
      name: validated.name.trim(),
      nickname: validated.nickname?.trim() || null,
      position: validated.position?.trim() || null,
      jerseyNumber: validated.jerseyNumber ?? null,
      whatsapp: validated.whatsapp?.trim() || null,
      legacyPin: pin,
      isActive: validated.isActive,
    })
    .returning()

  return inserted
}

/**
 * Admin: Updates existing player details.
 */
export async function updatePlayerAdmin(
  id: string,
  input: Partial<PlayerInput>,
): Promise<Player> {
  const db = getDatabase()
  const [updated] = await db
    .update(players)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.nickname !== undefined
        ? { nickname: input.nickname?.trim() || null }
        : {}),
      ...(input.position !== undefined
        ? { position: input.position?.trim() || null }
        : {}),
      ...(input.jerseyNumber !== undefined
        ? { jerseyNumber: input.jerseyNumber }
        : {}),
      ...(input.whatsapp !== undefined
        ? { whatsapp: input.whatsapp?.trim() || null }
        : {}),
      ...(input.legacyPin !== undefined
        ? { legacyPin: input.legacyPin?.trim() || null }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    })
    .where(eq(players.id, id))
    .returning()

  if (!updated) {
    throw new Error('Ciyaartoygan lama helin (Player not found)')
  }

  return updated
}

/**
 * Admin: Toggles player active/inactive state.
 */
export async function togglePlayerActiveAdmin(
  id: string,
  isActive: boolean,
): Promise<Player> {
  const db = getDatabase()
  const [updated] = await db
    .update(players)
    .set({ isActive })
    .where(eq(players.id, id))
    .returning()

  if (!updated) {
    throw new Error('Ciyaartoygan lama helin (Player not found)')
  }

  return updated
}

/**
 * Admin: Returns comprehensive details for a single player with current month scoped stats (M-06).
 */
export async function getPlayerDetailAdmin(id: string, monthKey?: string) {
  const db = getDatabase()
  const targetMonth = monthKey || getCurrentMonthKey()

  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.id, id))
    .limit(1)

  if (!player) {
    throw new Error('Ciyaartoygan lama helin (Player not found)')
  }

  const [stats] = await db
    .select()
    .from(playerMonthlyStats)
    .where(
      and(
        eq(playerMonthlyStats.playerId, id),
        eq(playerMonthlyStats.monthKey, targetMonth),
      ),
    )
    .limit(1)

  const attendance = await db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.playerId, id))
    .orderBy(desc(attendanceRecords.attendanceDate))
    .limit(30)

  const excuses = await db
    .select()
    .from(attendanceExcuses)
    .where(eq(attendanceExcuses.playerId, id))
    .orderBy(desc(attendanceExcuses.attendanceDate))
    .limit(10)

  const leaves = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.playerId, id))
    .orderBy(desc(leaveRequests.leaveDate))
    .limit(10)

  const ratings = await db
    .select()
    .from(playerMatchRatings)
    .where(eq(playerMatchRatings.playerId, id))
    .orderBy(desc(playerMatchRatings.matchDate))
    .limit(10)

  const sumRatings = ratings.reduce(
    (sum, r) => sum + (parseFloat(r.overallRating) || 0),
    0,
  )
  const averageRating =
    ratings.length > 0
      ? (Math.round((sumRatings / ratings.length) * 10) / 10).toFixed(1)
      : '0.0'

  return {
    player,
    currentMonthStats: stats ?? {
      goals: 0,
      assists: 0,
      errors: 0,
      monthKey: targetMonth,
    },
    recentAttendance: attendance,
    recentExcuses: excuses,
    recentLeaves: leaves,
    recentRatings: ratings,
    averageRating,
  }
}

/**
 * Admin: Permanently deletes a player and all associated records from the database.
 */
export async function deletePlayerAdmin(
  id: string,
): Promise<{ success: boolean; id: string }> {
  const db = getDatabase()

  const [player] = await db
    .select({ id: players.id, authUserId: players.authUserId })
    .from(players)
    .where(eq(players.id, id))
    .limit(1)

  if (!player) {
    throw new Error('Ciyaartoygan lama helin (Player not found)')
  }

  // Delete all dependent records to ensure clean deletion
  await db.delete(attendanceRecords).where(eq(attendanceRecords.playerId, id))
  await db.delete(attendanceExcuses).where(eq(attendanceExcuses.playerId, id))
  await db.delete(excuseRequests).where(eq(excuseRequests.playerId, id))
  await db.delete(leaveRequests).where(eq(leaveRequests.playerId, id))
  await db.delete(suggestions).where(eq(suggestions.playerId, id))
  await db.delete(playerMonthlyStats).where(eq(playerMonthlyStats.playerId, id))
  await db.delete(playerMatchRatings).where(eq(playerMatchRatings.playerId, id))
  await db.delete(playerFeeRecords).where(eq(playerFeeRecords.playerId, id))

  // Nullify references in chat and logs so chat history remains readable with snapshot names
  await db
    .update(chatMessages)
    .set({ playerId: null })
    .where(eq(chatMessages.playerId, id))
  await db
    .update(loginLogs)
    .set({ playerId: null })
    .where(eq(loginLogs.playerId, id))

  // Nullify or delete sessions
  await db.delete(authSessions).where(eq(authSessions.playerId, id))

  // Delete player
  await db.delete(players).where(eq(players.id, id))

  // If there was an associated authUser, clean it up
  if (player.authUserId) {
    await db.delete(authUsers).where(eq(authUsers.id, player.authUserId))
  }

  return { success: true, id }
}

/**
 * Player: Returns authenticated player's full profile info for Profile modal.
 */
export async function getMyPlayerProfile(playerId: string) {
  const db = getDatabase()
  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1)

  if (!player) {
    throw new Error('Ciyaartoyga lama helin (Player not found)')
  }

  return {
    id: player.id,
    name: player.name,
    nickname: player.nickname,
    jerseyNumber: player.jerseyNumber,
    position: player.position,
    whatsapp: player.whatsapp,
    pin: player.legacyPin,
    isActive: player.isActive,
    createdAt: player.createdAt,
  }
}
