import '@tanstack/react-start/server-only'

import { asc, desc, eq, sql } from 'drizzle-orm'

import { getDatabase } from '../db/connection.server'
import {
  chatMessages,
  clubSettings,
  galleryPhotos,
  loginLogs,
  playerMonthlyStats,
  players,
  suggestions,
  tips,
  type ChatMessage,
  type ClubSettings,
  type GalleryPhoto,
  type Tip,
} from '../db/schema'
import {
  formatSomaliDate,
  getCurrentMonthKey,
  getMonthDateRange,
  getTodayDateString,
} from '../lib/dates'
import { getWhatsAppUrl } from '../lib/whatsapp'
import { getAttendanceForDate } from './attendance.server'
import { getActiveRoster } from './players.server'
import { getPlayerLeaves, getRequestsInboxAdmin } from './requests.server'
import { getPlayerMonthlyStats } from './stats.server'

/* ==================== WAANO (TIPS) ==================== */

export async function getTips(): Promise<Tip[]> {
  const db = getDatabase()
  return db
    .select()
    .from(tips)
    .orderBy(asc(tips.sortOrder), desc(tips.createdAt))
}

export async function addTip(text: string): Promise<Tip> {
  const db = getDatabase()
  const trimmed = text.trim()
  if (!trimmed) throw new Error('Qoraalka waanadu waa khasab')

  const [inserted] = await db.insert(tips).values({ text: trimmed }).returning()

  return inserted
}

export async function deleteTip(id: string): Promise<void> {
  const db = getDatabase()
  await db.delete(tips).where(eq(tips.id, id))
}

/* ==================== TEAM CHAT & DIRECTORY ==================== */

/**
 * Returns latest 100 chat messages ordered chronologically (M-01).
 */
export async function getChatMessages(): Promise<ChatMessage[]> {
  const db = getDatabase()
  const messages = await db
    .select()
    .from(chatMessages)
    .orderBy(desc(chatMessages.createdAt))
    .limit(100)

  return messages.reverse()
}

export async function postChatMessage(input: {
  authorRole: 'admin' | 'player'
  playerId?: string | null
  authorNameSnapshot: string
  text: string
}): Promise<ChatMessage> {
  const db = getDatabase()
  const trimmed = input.text.trim()
  if (!trimmed) throw new Error('Fariintu ma noqon karto maran')

  const [inserted] = await db
    .insert(chatMessages)
    .values({
      authorRole: input.authorRole,
      playerId: input.playerId ?? null,
      authorNameSnapshot: input.authorNameSnapshot,
      text: trimmed,
    })
    .returning()

  return inserted
}

export async function getTeamDirectory() {
  const activePlayers = await getActiveRoster()
  return activePlayers.map((player) => ({
    id: player.id,
    name: player.name,
    nickname: player.nickname,
    jerseyNumber: player.jerseyNumber,
    position: player.position,
    whatsapp: player.whatsapp,
    whatsappUrl: player.whatsapp ? getWhatsAppUrl(player.whatsapp) : null,
  }))
}

/* ==================== RULES & ANNOUNCEMENTS (SHARCI) ==================== */

export async function getClubSettings(): Promise<ClubSettings> {
  const db = getDatabase()
  let [settings] = await db
    .select()
    .from(clubSettings)
    .where(eq(clubSettings.id, 'default'))
    .limit(1)

  if (!settings) {
    const [inserted] = await db
      .insert(clubSettings)
      .values({
        id: 'default',
        rulesText:
          '1. Ilaali waqtiga tababarka iyo kulamada.\n2. Ixtiraam maamulka iyo asxaabta kooxda.\n3. Haysashada direyska iyo agabka kooxda waa muhiim.',
        announcementText:
          'Kusoo dhowaada Best Official App. Dhammaan ciyaartooyda waa inay la socdaan jadwalka iyo xaadiriska.',
      })
      .returning()
    settings = inserted
  }

  return settings
}

export async function updateClubSettings(input: {
  rulesText?: string
  announcementText?: string
  announcementAudioPath?: string | null
  adminWhatsapp?: string | null
}): Promise<ClubSettings> {
  const db = getDatabase()
  // Ensure default exists first
  await getClubSettings()

  const [updated] = await db
    .update(clubSettings)
    .set({
      ...(input.rulesText !== undefined ? { rulesText: input.rulesText } : {}),
      ...(input.announcementText !== undefined
        ? { announcementText: input.announcementText }
        : {}),
      ...(input.announcementAudioPath !== undefined
        ? { announcementAudioPath: input.announcementAudioPath }
        : {}),
      ...(input.adminWhatsapp !== undefined
        ? { adminWhatsapp: input.adminWhatsapp }
        : {}),
    })
    .where(eq(clubSettings.id, 'default'))
    .returning()

  return updated
}

/* ==================== GALLERY (SAWIRO) ==================== */

export async function getGalleryPhotos(): Promise<
  (GalleryPhoto & { url: string })[]
> {
  const db = getDatabase()
  const photos = await db
    .select()
    .from(galleryPhotos)
    .orderBy(desc(galleryPhotos.createdAt))

  const supabaseUrl = process.env.SUPABASE_URL || 'https://supabase.co'

  return photos.map((p) => ({
    ...p,
    url:
      p.storagePath.startsWith('http://') ||
      p.storagePath.startsWith('https://')
        ? p.storagePath
        : `${supabaseUrl}/storage/v1/object/public/${p.storageBucket}/${p.storagePath}`,
  }))
}

export async function addGalleryPhoto(input: {
  storageBucket?: string
  storagePath: string
  caption?: string | null
  uploadedBy: string
}): Promise<GalleryPhoto> {
  const db = getDatabase()
  const [inserted] = await db
    .insert(galleryPhotos)
    .values({
      storageBucket: input.storageBucket || 'club-gallery',
      storagePath: input.storagePath,
      caption: input.caption?.trim() || null,
      uploadedBy: input.uploadedBy,
    })
    .returning()

  return inserted
}

export async function deleteGalleryPhoto(id: string): Promise<void> {
  const db = getDatabase()
  await db.delete(galleryPhotos).where(eq(galleryPhotos.id, id))
}

/* ==================== SUGGESTIONS (FIKRAD) ==================== */

export async function getAllSuggestionsAdmin() {
  const db = getDatabase()
  return db
    .select({
      id: suggestions.id,
      playerId: suggestions.playerId,
      playerName: players.name,
      text: suggestions.text,
      createdAt: suggestions.createdAt,
    })
    .from(suggestions)
    .innerJoin(players, eq(suggestions.playerId, players.id))
    .orderBy(desc(suggestions.createdAt))
}

/* ==================== DASHBOARDS (XOGTAADA) ==================== */

export async function getAdminDashboardSummary() {
  const db = getDatabase()
  const today = getTodayDateString()
  const currentMonth = getCurrentMonthKey()

  const todayAttendance = await getAttendanceForDate(today)
  const xadirList = todayAttendance.filter((p) => p.status === 'xadir')
  const maqanList = todayAttendance.filter((p) => p.status === 'maqan')
  const daahayList = todayAttendance.filter((p) => p.status === 'daahay')
  const unrecordedList = todayAttendance.filter((p) => !p.status)

  // Recent login logs
  const recentLogins = await db
    .select()
    .from(loginLogs)
    .orderBy(desc(loginLogs.loggedInAt))
    .limit(10)

  // Aggregate monthly goals/assists/errors
  const monthStats = await db
    .select({
      totalGoals: sql<number>`COALESCE(sum(goals), 0)::int`,
      totalAssists: sql<number>`COALESCE(sum(assists), 0)::int`,
      totalErrors: sql<number>`COALESCE(sum(errors), 0)::int`,
    })
    .from(playerMonthlyStats)
    .where(eq(playerMonthlyStats.monthKey, currentMonth))

  // Pending requests count
  const requestsInbox = await getRequestsInboxAdmin()
  const pendingExcuses = requestsInbox.excuses.filter(
    (e) => e.status === 'pending',
  ).length
  const pendingLeaves = requestsInbox.leaves.filter(
    (l) => l.status === 'pending',
  ).length
  const pendingJoins = requestsInbox.joins.filter(
    (j) => j.status === 'pending',
  ).length

  return {
    today,
    formattedToday: formatSomaliDate(today),
    currentMonth,
    attendanceCounts: {
      total: todayAttendance.length,
      xadir: xadirList.length,
      maqan: maqanList.length,
      daahay: daahayList.length,
      unrecorded: unrecordedList.length,
    },
    attendanceLists: {
      xadir: xadirList,
      maqan: maqanList,
      daahay: daahayList,
      unrecorded: unrecordedList,
    },
    monthTotals: {
      goals: monthStats[0]?.totalGoals ?? 0,
      assists: monthStats[0]?.totalAssists ?? 0,
      errors: monthStats[0]?.totalErrors ?? 0,
    },
    recentLogins,
    pendingRequests: {
      excuses: pendingExcuses,
      leaves: pendingLeaves,
      joins: pendingJoins,
      total: pendingExcuses + pendingLeaves + pendingJoins,
    },
  }
}

export async function getPlayerDashboardSummary(playerId: string) {
  const today = getTodayDateString()
  const currentMonth = getCurrentMonthKey()
  const { startDate, nextMonthStartDate } = getMonthDateRange(currentMonth)

  const settings = await getClubSettings()
  const monthStats = await getPlayerMonthlyStats(playerId)
  const leaves = await getPlayerLeaves(playerId)
  const todayAttendance = await getAttendanceForDate(today)

  const usedThisMonth = leaves.filter(
    (l) =>
      l.leaveDate >= startDate &&
      l.leaveDate < nextMonthStartDate &&
      l.status !== 'denied',
  ).length

  const myTodayRecord = todayAttendance.find((p) => p.playerId === playerId)

  return {
    today,
    formattedToday: formatSomaliDate(today),
    announcement: settings.announcementText,
    announcementAudio: settings.announcementAudioPath,
    announcementAudioPath: settings.announcementAudioPath,
    myTodayStatus: myTodayRecord?.status ?? null,
    myTodayReason: myTodayRecord?.reason ?? null,
    stats: monthStats,
    leaveUsedThisMonth: usedThisMonth,
    leaveMaxPerMonth: 3,
  }
}
