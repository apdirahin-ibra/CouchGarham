import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import {
  destroySession,
  loginAdmin,
  loginPlayer,
  resolveActorFromToken,
} from '../lib/auth.server'
import {
  requireAdmin,
  requirePlayer,
  requireSession,
} from '../lib/authorization'
import {
  getAttendanceForDate,
  getPlayerAttendanceHistory,
  saveAttendanceExcuse,
  saveAttendanceStatus,
} from './attendance.server'
import {
  addGalleryPhoto,
  addTip,
  bulkImport100Tips,
  deleteTip,
  getAdminDashboardSummary,
  getChatMessages,
  getClubSettings,
  getGalleryPhotos,
  getPlayerDashboardSummary,
  getTeamDirectory,
  getTips,
  postChatMessage,
  resetToOfficialClubRules,
  updateClubSettings,
  updateTip,
} from './content.server'
import {
  addFinanceEntry,
  deleteFinanceEntry,
  getFinanceLedger,
} from './finance.server'
import {
  createPlayerAdmin,
  getAllPlayersAdmin,
  getPlayerDetailAdmin,
  getRosterForLogin,
  togglePlayerActiveAdmin,
  updatePlayerAdmin,
} from './players.server'
import {
  adminCreateLeave,
  getPlayerLeaves,
  getPlayerSuggestions,
  getRequestsInboxAdmin,
  reviewExcuseRequest,
  reviewJoinRequest,
  reviewLeaveRequest,
  submitExcuseRequest,
  submitJoinRequest,
  submitLeaveRequest,
  submitSuggestion,
} from './requests.server'
import {
  createScheduleEntry,
  deleteScheduleEntry,
  getScheduleAttendanceBreakdown,
  getScheduleList,
  updateScheduleEntry,
} from './schedule.server'
import {
  getCurrentMonthRosterStats,
  updatePlayerMonthlyStats,
} from './stats.server'
import {
  deleteGalleryPhotoServer,
  deleteVoiceAnnouncementServer,
  uploadGalleryPhotoServer,
  uploadVoiceAnnouncementServer,
} from './storage.server'

/* ==================== AUTHENTICATION FUNCTIONS ==================== */

/**
 * Public minimal player projection for login dropdown (M-03).
 */
export const getRosterForLoginFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getRosterForLogin()
  },
)

export const loginAdminFn = createServerFn({ method: 'POST' })
  .validator((data: { username: string; password: string }) =>
    z
      .object({
        username: z.string().trim().min(1).max(100),
        password: z.string().min(1).max(128),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    return loginAdmin(data.username, data.password)
  })

export const loginPlayerFn = createServerFn({ method: 'POST' })
  .validator((data: { playerId: string }) =>
    z.object({ playerId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    return loginPlayer(data.playerId)
  })

export const resolveCurrentSessionFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken?: string | null }) =>
    z
      .object({
        sessionToken: z.string().max(256).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    if (!data.sessionToken) return null
    return resolveActorFromToken(data.sessionToken)
  })

export const logoutFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    await destroySession(data.sessionToken)
    return { success: true }
  })

/* ==================== ADMIN OPERATIONS ==================== */

export const getAdminDashboardFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return getAdminDashboardSummary()
  })

export const getAdminPlayersFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return getAllPlayersAdmin()
  })

export const createPlayerAdminFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      sessionToken: string
      name: string
      nickname?: string | null
      jerseyNumber?: number | null
      position?: string | null
      whatsapp?: string | null
      isActive?: boolean
    }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          name: z.string().trim().min(2).max(100),
          nickname: z.string().trim().max(50).optional().nullable(),
          jerseyNumber: z.number().int().min(1).max(99).optional().nullable(),
          position: z.string().trim().max(50).optional().nullable(),
          whatsapp: z.string().trim().max(30).optional().nullable(),
          isActive: z.boolean().optional(),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return createPlayerAdmin({
      name: data.name,
      nickname: data.nickname,
      jerseyNumber: data.jerseyNumber,
      position: data.position,
      whatsapp: data.whatsapp,
      isActive: data.isActive ?? true,
    })
  })

export const updatePlayerAdminFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      sessionToken: string
      id: string
      name?: string
      nickname?: string | null
      jerseyNumber?: number | null
      position?: string | null
      whatsapp?: string | null
      isActive?: boolean
    }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          id: z.string().uuid(),
          name: z.string().trim().min(2).max(100).optional(),
          nickname: z.string().trim().max(50).optional().nullable(),
          jerseyNumber: z.number().int().min(1).max(99).optional().nullable(),
          position: z.string().trim().max(50).optional().nullable(),
          whatsapp: z.string().trim().max(30).optional().nullable(),
          isActive: z.boolean().optional(),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return updatePlayerAdmin(data.id, data)
  })

export const togglePlayerActiveAdminFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string; id: string; isActive: boolean }) =>
    z
      .object({
        sessionToken: z.string().max(256),
        id: z.string().uuid(),
        isActive: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return togglePlayerActiveAdmin(data.id, data.isActive)
  })

export const getPlayerDetailAdminFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string; id: string; monthKey?: string }) =>
    z
      .object({
        sessionToken: z.string().max(256),
        id: z.string().uuid(),
        monthKey: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return getPlayerDetailAdmin(data.id, data.monthKey)
  })

/* ==================== ATTENDANCE FUNCTIONS ==================== */

/**
 * Team attendance for date is Admin only (C-03).
 */
export const getAttendanceForDateFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string; date: string }) =>
    z
      .object({
        sessionToken: z.string().max(256),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return getAttendanceForDate(data.date)
  })

export const saveAttendanceStatusFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      sessionToken: string
      playerId: string
      date: string
      status: 'xadir' | 'maqan' | 'daahay' | null
    }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          playerId: z.string().uuid(),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          status: z.enum(['xadir', 'maqan', 'daahay']).nullable(),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return saveAttendanceStatus(data)
  })

export const saveAttendanceReasonFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      sessionToken: string
      playerId: string
      date: string
      reason: string
    }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          playerId: z.string().uuid(),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          reason: z.string().max(500),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return saveAttendanceExcuse(data)
  })

/* ==================== STATS FUNCTIONS ==================== */

/**
 * Team monthly roster stats is Admin only (C-03).
 */
export const getCurrentMonthRosterStatsFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string; monthKey?: string }) =>
    z
      .object({
        sessionToken: z.string().max(256),
        monthKey: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return getCurrentMonthRosterStats(data.monthKey)
  })

export const updatePlayerMonthlyStatsFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      sessionToken: string
      playerId: string
      monthKey: string
      goals: number
      assists: number
      errors: number
    }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          playerId: z.string().uuid(),
          monthKey: z.string().regex(/^\d{4}-\d{2}$/),
          goals: z.number().int().min(0).max(999),
          assists: z.number().int().min(0).max(999),
          errors: z.number().int().min(0).max(999),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return updatePlayerMonthlyStats(data)
  })

/* ==================== REQUESTS & APPROVALS ==================== */

export const getRequestsInboxAdminFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return getRequestsInboxAdmin()
  })

export const reviewExcuseRequestFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      sessionToken: string
      requestId: string
      decision: 'approved' | 'denied'
    }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          requestId: z.string().uuid(),
          decision: z.enum(['approved', 'denied']),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    const admin = requireAdmin(actor)
    return reviewExcuseRequest({
      requestId: data.requestId,
      decision: data.decision,
      reviewedBy: admin.name,
    })
  })

export const reviewLeaveRequestFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      sessionToken: string
      requestId: string
      decision: 'approved' | 'denied'
    }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          requestId: z.string().uuid(),
          decision: z.enum(['approved', 'denied']),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    const admin = requireAdmin(actor)
    return reviewLeaveRequest({
      requestId: data.requestId,
      decision: data.decision,
      reviewedBy: admin.name,
    })
  })

export const reviewJoinRequestFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      sessionToken: string
      requestId: string
      decision: 'approved' | 'denied'
    }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          requestId: z.string().uuid(),
          decision: z.enum(['approved', 'denied']),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    const admin = requireAdmin(actor)
    return reviewJoinRequest({
      requestId: data.requestId,
      decision: data.decision,
      reviewedBy: admin.name,
    })
  })

export const adminCreateLeaveFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      sessionToken: string
      playerId: string
      leaveDate: string
      reason: string
    }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          playerId: z.string().uuid(),
          leaveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          reason: z.string().trim().min(2).max(500),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    const admin = requireAdmin(actor)
    return adminCreateLeave({
      playerId: data.playerId,
      leaveDate: data.leaveDate,
      reason: data.reason,
      reviewedBy: admin.name,
    })
  })

export const submitJoinRequestFn = createServerFn({ method: 'POST' })
  .validator((data: { name: string; phone: string; message?: string | null }) =>
    z
      .object({
        name: z.string().trim().min(2).max(100),
        phone: z.string().trim().min(6).max(30),
        message: z.string().trim().max(500).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    return submitJoinRequest(data)
  })

/* ==================== SCHEDULE FUNCTIONS ==================== */

export const getScheduleListFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireSession(actor)
    return getScheduleList()
  })

export const createScheduleEntryFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      sessionToken: string
      dayName: string
      timeText: string
      place: string
    }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          dayName: z.string().trim().min(2).max(50),
          timeText: z.string().trim().min(2).max(100),
          place: z.string().trim().min(2).max(150),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return createScheduleEntry(data)
  })

export const updateScheduleEntryFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      sessionToken: string
      id: string
      dayName: string
      timeText: string
      place: string
    }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          id: z.string().uuid(),
          dayName: z.string().trim().min(2).max(50),
          timeText: z.string().trim().min(2).max(100),
          place: z.string().trim().min(2).max(150),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return updateScheduleEntry(data.id, data)
  })

export const deleteScheduleEntryFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string; id: string }) =>
    z
      .object({
        sessionToken: z.string().max(256),
        id: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return deleteScheduleEntry(data.id)
  })

/**
 * Schedule attendance breakdown requires authenticated session (C-04).
 */
export const getScheduleAttendanceBreakdownFn = createServerFn({
  method: 'POST',
})
  .validator((data: { sessionToken: string; dayName: string }) =>
    z
      .object({
        sessionToken: z.string().max(256),
        dayName: z.string().trim().min(2).max(50),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireSession(actor)
    return getScheduleAttendanceBreakdown(data.dayName)
  })

/* ==================== FINANCE FUNCTIONS ==================== */

export const getFinanceLedgerFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireSession(actor)
    return getFinanceLedger()
  })

export const addFinanceEntryFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      sessionToken: string
      type: 'income' | 'expense'
      amount: number
      note: string
      entryDate: string
    }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          type: z.enum(['income', 'expense']),
          amount: z.number().positive().max(1000000),
          note: z.string().trim().min(2).max(255),
          entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return addFinanceEntry(data)
  })

export const deleteFinanceEntryFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string; id: string }) =>
    z
      .object({
        sessionToken: z.string().max(256),
        id: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return deleteFinanceEntry(data.id)
  })

/* ==================== CHAT & DIRECTORY ==================== */

export const getChatMessagesFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireSession(actor)
    return getChatMessages()
  })

export const postChatMessageFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string; text: string }) =>
    z
      .object({
        sessionToken: z.string().max(256),
        text: z.string().trim().min(1).max(1000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    const session = requireSession(actor)
    return postChatMessage({
      authorRole: session.role,
      playerId: session.playerId,
      authorNameSnapshot: session.name,
      text: data.text,
    })
  })

export const getTeamDirectoryFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireSession(actor)
    return getTeamDirectory()
  })

/* ==================== GALLERY & WAANO & RULES ==================== */

export const getGalleryPhotosFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireSession(actor)
    return getGalleryPhotos()
  })

export const uploadGalleryPhotoFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      sessionToken: string
      base64Data: string
      mimeType: string
      caption?: string | null
    }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          base64Data: z
            .string()
            .min(1)
            .max(7 * 1024 * 1024),
          mimeType: z.string().min(3).max(100),
          caption: z.string().trim().max(255).optional().nullable(),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    const admin = requireAdmin(actor)
    return uploadGalleryPhotoServer({
      base64Data: data.base64Data,
      mimeType: data.mimeType,
      caption: data.caption,
      uploadedBy: admin.name || 'Maamulaha',
    })
  })

export const addGalleryPhotoFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      sessionToken: string
      storagePath: string
      caption?: string | null
    }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          storagePath: z.string().trim().min(2).max(1000),
          caption: z.string().trim().max(255).optional().nullable(),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    const admin = requireAdmin(actor)
    return addGalleryPhoto({
      storagePath: data.storagePath,
      caption: data.caption,
      uploadedBy: admin.name,
    })
  })

export const deleteGalleryPhotoFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string; id: string }) =>
    z
      .object({
        sessionToken: z.string().max(256),
        id: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return deleteGalleryPhotoServer(data.id)
  })

export const uploadVoiceAnnouncementFn = createServerFn({ method: 'POST' })
  .validator(
    (data: { sessionToken: string; base64Audio: string; mimeType: string }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          base64Audio: z
            .string()
            .min(1)
            .max(14 * 1024 * 1024),
          mimeType: z.string().min(3).max(100),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return uploadVoiceAnnouncementServer({
      base64Audio: data.base64Audio,
      mimeType: data.mimeType,
    })
  })

export const deleteVoiceAnnouncementFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return deleteVoiceAnnouncementServer()
  })

export const getTipsFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireSession(actor)
    return getTips()
  })

export const addTipFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string; text: string }) =>
    z
      .object({
        sessionToken: z.string().max(256),
        text: z.string().trim().min(2).max(500),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return addTip(data.text)
  })

export const deleteTipFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string; id: string }) =>
    z
      .object({
        sessionToken: z.string().max(256),
        id: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return deleteTip(data.id)
  })

export const updateTipFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string; id: string; text: string }) =>
    z
      .object({
        sessionToken: z.string().max(256),
        id: z.string().uuid(),
        text: z.string().trim().min(2).max(500),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return updateTip(data.id, data.text)
  })

export const bulkImport100TipsFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string; mode?: 'replace' | 'append' }) =>
    z
      .object({
        sessionToken: z.string().max(256),
        mode: z.enum(['replace', 'append']).optional().default('replace'),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return bulkImport100Tips(data.mode)
  })

export const getClubSettingsFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireSession(actor)
    return getClubSettings()
  })

export const updateClubSettingsFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      sessionToken: string
      rulesText?: string
      announcementText?: string
      announcementAudioPath?: string | null
    }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          rulesText: z.string().max(20000).optional(),
          announcementText: z.string().max(2000).optional(),
          announcementAudioPath: z.string().max(1000).optional().nullable(),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return updateClubSettings(data)
  })

export const resetOfficialClubRulesFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    requireAdmin(actor)
    return resetToOfficialClubRules()
  })

/* ==================== PLAYER PRIVATE ACTIONS ==================== */

export const getPlayerDashboardSummaryFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    const { playerId } = requirePlayer(actor)
    return getPlayerDashboardSummary(playerId)
  })

export const getPlayerAttendanceHistoryFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    const { playerId } = requirePlayer(actor)
    return getPlayerAttendanceHistory(playerId)
  })

export const submitExcuseRequestFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      sessionToken: string
      requestDate: string
      attendanceType: 'maqan' | 'daahay'
      reason: string
    }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          requestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          attendanceType: z.enum(['maqan', 'daahay']),
          reason: z.string().trim().min(2).max(500),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    const { playerId } = requirePlayer(actor)
    return submitExcuseRequest({
      playerId,
      requestDate: data.requestDate,
      attendanceType: data.attendanceType,
      reason: data.reason,
    })
  })

export const getPlayerLeavesFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    const { playerId } = requirePlayer(actor)
    return getPlayerLeaves(playerId)
  })

export const submitLeaveRequestFn = createServerFn({ method: 'POST' })
  .validator(
    (data: { sessionToken: string; leaveDate: string; reason: string }) =>
      z
        .object({
          sessionToken: z.string().max(256),
          leaveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          reason: z.string().trim().min(2).max(500),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    const { playerId } = requirePlayer(actor)
    return submitLeaveRequest({
      playerId,
      leaveDate: data.leaveDate,
      reason: data.reason,
    })
  })

export const getPlayerSuggestionsFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string }) =>
    z.object({ sessionToken: z.string().max(256) }).parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    const { playerId } = requirePlayer(actor)
    return getPlayerSuggestions(playerId)
  })

export const submitSuggestionFn = createServerFn({ method: 'POST' })
  .validator((data: { sessionToken: string; text: string }) =>
    z
      .object({
        sessionToken: z.string().max(256),
        text: z.string().trim().min(2).max(1000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const actor = await resolveActorFromToken(data.sessionToken)
    const { playerId } = requirePlayer(actor)
    return submitSuggestion({
      playerId,
      text: data.text,
    })
  })
