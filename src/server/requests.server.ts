import '@tanstack/react-start/server-only'

import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'

import { getDatabase } from '../db/connection.server'
import {
  attendanceExcuses,
  attendanceRecords,
  excuseRequests,
  joinRequests,
  leaveRequests,
  players,
  suggestions,
} from '../db/schema'
import { getTodayDateString } from '../lib/dates'

export const excuseRequestInputSchema = z.object({
  playerId: z.string().uuid(),
  requestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  attendanceType: z.enum(['maqan', 'daahay']),
  reason: z.string().min(2),
})

export const leaveRequestInputSchema = z.object({
  playerId: z.string().uuid(),
  leaveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(2),
})

export const joinRequestInputSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  message: z.string().optional().nullable(),
})

/**
 * Player: Submits an excuse request for a specific date.
 */
export async function submitExcuseRequest(
  input: z.infer<typeof excuseRequestInputSchema>,
) {
  const db = getDatabase()
  const validated = excuseRequestInputSchema.parse(input)

  const [inserted] = await db
    .insert(excuseRequests)
    .values({
      playerId: validated.playerId,
      requestDate: validated.requestDate,
      attendanceType: validated.attendanceType,
      reason: validated.reason.trim(),
      status: 'pending',
    })
    .returning()

  return inserted
}

/**
 * Player: Submits a leave request with concurrency-safe transactional lock.
 */
export async function submitLeaveRequest(
  input: z.infer<typeof leaveRequestInputSchema>,
) {
  const db = getDatabase()
  const validated = leaveRequestInputSchema.parse(input)
  const monthPrefix = validated.leaveDate.slice(0, 7)

  return db.transaction(async (tx) => {
    // Acquire transactional advisory lock to prevent race conditions on player's monthly cap
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`leave_${validated.playerId}_${monthPrefix}`}))`,
    )

    const existingMonthLeaves = await tx
      .select()
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.playerId, validated.playerId),
          inArray(leaveRequests.status, ['pending', 'approved']),
        ),
      )

    const usedLeavesThisMonth = existingMonthLeaves.filter((l) =>
      l.leaveDate.startsWith(monthPrefix),
    ).length

    if (usedLeavesThisMonth >= 3) {
      throw new Error(
        'Waxaad gaartay xadka fasaxa bishan (Ugu badnaan 3 maalmood oo codsi/la oggolaaday)',
      )
    }

    const [inserted] = await tx
      .insert(leaveRequests)
      .values({
        playerId: validated.playerId,
        leaveDate: validated.leaveDate,
        reason: validated.reason.trim(),
        status: 'pending',
      })
      .returning()

    return { request: inserted, usedLeavesThisMonth: usedLeavesThisMonth + 1 }
  })
}

/**
 * Player: Queries their own leave requests history.
 */
export async function getPlayerLeaves(playerId: string) {
  const db = getDatabase()
  return db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.playerId, playerId))
    .orderBy(desc(leaveRequests.leaveDate))
}

/**
 * Admin: Grants a direct leave to a player with transactional concurrency lock.
 */
export async function adminCreateLeave(input: {
  playerId: string
  leaveDate: string
  reason: string
  reviewedBy?: string
}) {
  const db = getDatabase()
  const validated = leaveRequestInputSchema.parse({
    playerId: input.playerId,
    leaveDate: input.leaveDate,
    reason: input.reason,
  })

  const monthPrefix = validated.leaveDate.slice(0, 7)

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`leave_${validated.playerId}_${monthPrefix}`}))`,
    )

    const existingApproved = await tx
      .select()
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.playerId, validated.playerId),
          eq(leaveRequests.status, 'approved'),
        ),
      )

    const approvedThisMonth = existingApproved.filter((l) =>
      l.leaveDate.startsWith(monthPrefix),
    ).length

    if (approvedThisMonth >= 3) {
      throw new Error(
        'Ciyaartoygan wuxuu horey u qaatay 3 maalmood oo fasax ah bishan',
      )
    }

    const [inserted] = await tx
      .insert(leaveRequests)
      .values({
        playerId: validated.playerId,
        leaveDate: validated.leaveDate,
        reason: validated.reason.trim(),
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: input.reviewedBy ?? 'Maamulaha',
      })
      .returning()

    return inserted
  })
}

/**
 * Admin: Reviews a leave request atomically with transactional concurrency lock (M-07 & H3-01 & H4-03).
 */
export async function reviewLeaveRequest(input: {
  requestId: string
  decision: 'approved' | 'denied'
  reviewedBy?: string
}) {
  const db = getDatabase()

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.id, input.requestId),
          eq(leaveRequests.status, 'pending'),
        ),
      )
      .limit(1)

    if (!existing) {
      throw new Error('Codsigan fasaxa lama helin ama horey ayaa loo eegay')
    }

    const monthPrefix = existing.leaveDate.slice(0, 7)
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`leave_${existing.playerId}_${monthPrefix}`}))`,
    )

    if (input.decision === 'approved') {
      const approvedRecords = await tx
        .select()
        .from(leaveRequests)
        .where(
          and(
            eq(leaveRequests.playerId, existing.playerId),
            eq(leaveRequests.status, 'approved'),
          ),
        )
      const count = approvedRecords.filter((l) =>
        l.leaveDate.startsWith(monthPrefix),
      ).length
      if (count >= 3) {
        throw new Error(
          'Ciyaartoygu wuxuu horey u gaaray xadka 3 maalmood ee fasaxa bishan',
        )
      }
    }

    const [updated] = await tx
      .update(leaveRequests)
      .set({
        status: input.decision,
        reviewedAt: new Date(),
        reviewedBy: input.reviewedBy ?? 'Maamulaha',
      })
      .where(
        and(
          eq(leaveRequests.id, input.requestId),
          eq(leaveRequests.status, 'pending'),
        ),
      )
      .returning()

    if (!updated) {
      throw new Error(
        'Codsigan horey ayaa loo eegay (State conflict / Already reviewed)',
      )
    }

    return updated
  })
}

/**
 * Public/Prospective: Submits a join request.
 */
export async function submitJoinRequest(input: {
  name: string
  phone: string
  message?: string | null
}) {
  const db = getDatabase()
  const validated = joinRequestInputSchema.parse(input)

  const [inserted] = await db
    .insert(joinRequests)
    .values({
      name: validated.name.trim(),
      phone: validated.phone.trim(),
      message: validated.message?.trim() || null,
      status: 'pending',
    })
    .returning()

  return inserted
}

/**
 * Admin: Reviews an excuse request atomically and writes to permanent excuses table (H3-01).
 */
export async function reviewExcuseRequest(input: {
  requestId: string
  decision: 'approved' | 'denied'
  reviewedBy?: string
}) {
  const db = getDatabase()

  return db.transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(excuseRequests)
      .where(
        and(
          eq(excuseRequests.id, input.requestId),
          eq(excuseRequests.status, 'pending'),
        ),
      )
      .limit(1)

    if (!request) {
      throw new Error('Codsigan lama helin ama horey ayaa loo eegay')
    }

    const [updated] = await tx
      .update(excuseRequests)
      .set({
        status: input.decision,
        reviewedAt: new Date(),
        reviewedBy: input.reviewedBy ?? 'Maamulaha',
      })
      .where(
        and(
          eq(excuseRequests.id, input.requestId),
          eq(excuseRequests.status, 'pending'),
        ),
      )
      .returning()

    if (!updated) {
      throw new Error(
        'Codsigan horey ayaa loo eegay (State conflict / Already reviewed)',
      )
    }

    if (input.decision === 'approved') {
      // Ensure matching attendance status is saved
      await tx
        .insert(attendanceRecords)
        .values({
          playerId: request.playerId,
          attendanceDate: request.requestDate,
          status: request.attendanceType,
        })
        .onConflictDoUpdate({
          target: [
            attendanceRecords.playerId,
            attendanceRecords.attendanceDate,
          ],
          set: {
            status: request.attendanceType,
            updatedAt: new Date(),
          },
        })

      // Insert or update permanent excuse note
      await tx
        .insert(attendanceExcuses)
        .values({
          playerId: request.playerId,
          attendanceDate: request.requestDate,
          reason: request.reason,
          createdBy: 'player',
        })
        .onConflictDoUpdate({
          target: [
            attendanceExcuses.playerId,
            attendanceExcuses.attendanceDate,
          ],
          set: {
            reason: request.reason,
            createdBy: 'player',
            updatedAt: new Date(),
          },
        })
    }

    return updated
  })
}

/**
 * Admin: Reviews a join request and creates the player record atomically (H3-01).
 */
export async function reviewJoinRequest(input: {
  requestId: string
  decision: 'approved' | 'denied'
  reviewedBy?: string
}) {
  const db = getDatabase()

  return db.transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(joinRequests)
      .where(
        and(
          eq(joinRequests.id, input.requestId),
          eq(joinRequests.status, 'pending'),
        ),
      )
      .limit(1)

    if (!request) {
      throw new Error('Codsigan lama helin ama horey ayaa loo eegay')
    }

    const [updated] = await tx
      .update(joinRequests)
      .set({
        status: input.decision,
        reviewedAt: new Date(),
        reviewedBy: input.reviewedBy ?? 'Maamulaha',
      })
      .where(
        and(
          eq(joinRequests.id, input.requestId),
          eq(joinRequests.status, 'pending'),
        ),
      )
      .returning()

    if (!updated) {
      throw new Error(
        'Codsigan horey ayaa loo eegay (State conflict / Already reviewed)',
      )
    }

    let newPlayer = null
    if (input.decision === 'approved') {
      const [insertedPlayer] = await tx
        .insert(players)
        .values({
          name: request.name,
          whatsapp: request.phone,
          isActive: true,
        })
        .returning()
      newPlayer = insertedPlayer
    }

    return { request: updated, newPlayer }
  })
}

/**
 * Admin: Returns consolidated requests inbox.
 */
export async function getRequestsInboxAdmin() {
  const db = getDatabase()

  const [excuses, leaves, joins] = await Promise.all([
    db
      .select({
        id: excuseRequests.id,
        playerId: excuseRequests.playerId,
        playerName: players.name,
        requestDate: excuseRequests.requestDate,
        attendanceType: excuseRequests.attendanceType,
        reason: excuseRequests.reason,
        status: excuseRequests.status,
        createdAt: excuseRequests.createdAt,
      })
      .from(excuseRequests)
      .innerJoin(players, eq(excuseRequests.playerId, players.id))
      .orderBy(desc(excuseRequests.createdAt)),

    db
      .select({
        id: leaveRequests.id,
        playerId: leaveRequests.playerId,
        playerName: players.name,
        leaveDate: leaveRequests.leaveDate,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        createdAt: leaveRequests.createdAt,
      })
      .from(leaveRequests)
      .innerJoin(players, eq(leaveRequests.playerId, players.id))
      .orderBy(desc(leaveRequests.createdAt)),

    db.select().from(joinRequests).orderBy(desc(joinRequests.createdAt)),
  ])

  return {
    excuses,
    leaves,
    joins,
  }
}

/**
 * Player: Returns suggestions submitted by player.
 */
export async function getPlayerSuggestions(playerId: string) {
  const db = getDatabase()
  return db
    .select()
    .from(suggestions)
    .where(eq(suggestions.playerId, playerId))
    .orderBy(desc(suggestions.createdAt))
}

/**
 * Player: Submits a new suggestion to coaching staff.
 */
export async function submitSuggestion(input: {
  playerId: string
  text: string
}) {
  const db = getDatabase()
  const today = getTodayDateString()

  const [inserted] = await db
    .insert(suggestions)
    .values({
      playerId: input.playerId,
      text: input.text.trim(),
      submissionDate: today,
    })
    .returning()

  return inserted
}
