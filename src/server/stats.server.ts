import '@tanstack/react-start/server-only'

import { and, desc, eq, gte, lt, sql } from 'drizzle-orm'

import { getDatabase } from '../db/connection.server'
import {
  attendanceRecords,
  playerMatchRatings,
  playerMonthlyStats,
  type PlayerMatchRating,
} from '../db/schema'
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

import {
  PLAYER_RATING_CRITERIA,
  computeOverallRatingScore,
  type RatingCriterionKey,
  type RatingCriterionValues,
} from '../lib/ratings'

export {
  PLAYER_RATING_CRITERIA,
  computeOverallRatingScore,
  type RatingCriterionKey,
  type RatingCriterionValues,
}

export type PlayerMatchRatingInput = {
  playerId: string
  matchDate: string
  matchTitle?: string | null
  dhankaGoolka: number
  caawinta: number
  anshaxaCiyaarta: number
  kalsoonida: number
  laDhaqankaMacalinka: number
  laDhaqankaCiyaartoydaKale: number
  shaqadaLooDiray: number
  waajibaadkaBooska: number
  masuuliyadda: number
  taktikada: number
  coachNotes?: string | null
}

/**
 * Admin: Saves or updates a player's rating for a specific match date.
 */
export async function savePlayerMatchRating(input: PlayerMatchRatingInput) {
  const db = getDatabase()

  const clamped = {
    dhankaGoolka: Math.max(0, Math.min(5, input.dhankaGoolka || 0)),
    caawinta: Math.max(0, Math.min(5, input.caawinta || 0)),
    anshaxaCiyaarta: Math.max(0, Math.min(5, input.anshaxaCiyaarta || 0)),
    kalsoonida: Math.max(0, Math.min(5, input.kalsoonida || 0)),
    laDhaqankaMacalinka: Math.max(
      0,
      Math.min(5, input.laDhaqankaMacalinka || 0),
    ),
    laDhaqankaCiyaartoydaKale: Math.max(
      0,
      Math.min(5, input.laDhaqankaCiyaartoydaKale || 0),
    ),
    shaqadaLooDiray: Math.max(0, Math.min(5, input.shaqadaLooDiray || 0)),
    waajibaadkaBooska: Math.max(0, Math.min(5, input.waajibaadkaBooska || 0)),
    masuuliyadda: Math.max(0, Math.min(5, input.masuuliyadda || 0)),
    taktikada: Math.max(0, Math.min(5, input.taktikada || 0)),
  }

  const { formatted } = computeOverallRatingScore(clamped)

  const [saved] = await db
    .insert(playerMatchRatings)
    .values({
      playerId: input.playerId,
      matchDate: input.matchDate,
      matchTitle: input.matchTitle?.trim() || null,
      ...clamped,
      overallRating: formatted,
      coachNotes: input.coachNotes?.trim() || null,
    })
    .onConflictDoUpdate({
      target: [playerMatchRatings.playerId, playerMatchRatings.matchDate],
      set: {
        matchTitle: input.matchTitle?.trim() || null,
        ...clamped,
        overallRating: formatted,
        coachNotes: input.coachNotes?.trim() || null,
        updatedAt: new Date(),
      },
    })
    .returning()

  return saved
}

/**
 * Returns a player's rating for a specific match date.
 */
export async function getPlayerMatchRating(
  playerId: string,
  matchDate: string,
): Promise<PlayerMatchRating | null> {
  const db = getDatabase()

  const [rating] = await db
    .select()
    .from(playerMatchRatings)
    .where(
      and(
        eq(playerMatchRatings.playerId, playerId),
        eq(playerMatchRatings.matchDate, matchDate),
      ),
    )
    .limit(1)

  return rating || null
}

/**
 * Returns a player's most recent match rating.
 */
export async function getPlayerLatestRating(
  playerId: string,
): Promise<PlayerMatchRating | null> {
  const db = getDatabase()

  const [latest] = await db
    .select()
    .from(playerMatchRatings)
    .where(eq(playerMatchRatings.playerId, playerId))
    .orderBy(desc(playerMatchRatings.matchDate))
    .limit(1)

  return latest || null
}

/**
 * Returns all match ratings history for a player.
 */
export async function getPlayerMatchRatingsHistory(playerId: string): Promise<{
  ratings: PlayerMatchRating[]
  averageRating: string
  totalMatches: number
}> {
  const db = getDatabase()

  const ratings = await db
    .select()
    .from(playerMatchRatings)
    .where(eq(playerMatchRatings.playerId, playerId))
    .orderBy(desc(playerMatchRatings.matchDate))

  if (ratings.length === 0) {
    return {
      ratings: [],
      averageRating: '0.0',
      totalMatches: 0,
    }
  }

  const sum = ratings.reduce(
    (acc, r) => acc + (parseFloat(r.overallRating) || 0),
    0,
  )
  const averageRating = (Math.round((sum / ratings.length) * 10) / 10).toFixed(
    1,
  )

  return {
    ratings,
    averageRating,
    totalMatches: ratings.length,
  }
}

/**
 * Admin: Returns all ratings for all players on a given match date.
 */
export async function getAllPlayersRatingsForDate(
  matchDate: string,
): Promise<PlayerMatchRating[]> {
  const db = getDatabase()

  return db
    .select()
    .from(playerMatchRatings)
    .where(eq(playerMatchRatings.matchDate, matchDate))
}

/**
 * Admin: Returns team-wide rating summaries (total matches evaluated and cumulative average score).
 */
export async function getRosterRatingsSummary(): Promise<
  Array<{
    playerId: string
    name: string
    nickname: string | null
    jerseyNumber: number | null
    position: string | null
    averageRating: string
    totalMatchesEvaluated: number
    latestRatingDate: string | null
    latestOverallRating: string | null
  }>
> {
  const db = getDatabase()
  const activePlayers = await getActiveRoster()

  const allRatings = await db
    .select()
    .from(playerMatchRatings)
    .orderBy(desc(playerMatchRatings.matchDate))

  const ratingsByPlayer = new Map<string, PlayerMatchRating[]>()
  for (const r of allRatings) {
    if (!ratingsByPlayer.has(r.playerId)) {
      ratingsByPlayer.set(r.playerId, [])
    }
    ratingsByPlayer.get(r.playerId)!.push(r)
  }

  return activePlayers.map((player) => {
    const playerRatings = ratingsByPlayer.get(player.id) || []
    if (playerRatings.length === 0) {
      return {
        playerId: player.id,
        name: player.name,
        nickname: player.nickname,
        jerseyNumber: player.jerseyNumber,
        position: player.position,
        averageRating: '0.0',
        totalMatchesEvaluated: 0,
        latestRatingDate: null,
        latestOverallRating: null,
      }
    }

    const sum = playerRatings.reduce(
      (acc, r) => acc + (parseFloat(r.overallRating) || 0),
      0,
    )
    const avg = (Math.round((sum / playerRatings.length) * 10) / 10).toFixed(1)

    return {
      playerId: player.id,
      name: player.name,
      nickname: player.nickname,
      jerseyNumber: player.jerseyNumber,
      position: player.position,
      averageRating: avg,
      totalMatchesEvaluated: playerRatings.length,
      latestRatingDate: playerRatings[0]?.matchDate || null,
      latestOverallRating: playerRatings[0]?.overallRating || null,
    }
  })
}
