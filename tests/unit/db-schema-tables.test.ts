import { getTableColumns, getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import {
  attendanceExcuses,
  attendanceRecords,
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
  chatMessages,
  clubSettings,
  excuseRequests,
  financeEntries,
  galleryPhotos,
  joinRequests,
  leaveRequests,
  loginLogs,
  playerMonthlyStats,
  players,
  scheduleEntries,
  suggestions,
  tips,
} from '#/db/schema'

describe('database schema tables', () => {
  it('registers all domain and auth tables with expected names', () => {
    expect(getTableName(players)).toBe('players')
    expect(getTableName(attendanceRecords)).toBe('attendance_records')
    expect(getTableName(attendanceExcuses)).toBe('attendance_excuses')
    expect(getTableName(excuseRequests)).toBe('excuse_requests')
    expect(getTableName(playerMonthlyStats)).toBe('player_monthly_stats')
    expect(getTableName(leaveRequests)).toBe('leave_requests')
    expect(getTableName(joinRequests)).toBe('join_requests')
    expect(getTableName(suggestions)).toBe('suggestions')
    expect(getTableName(financeEntries)).toBe('finance_entries')
    expect(getTableName(tips)).toBe('tips')
    expect(getTableName(chatMessages)).toBe('chat_messages')
    expect(getTableName(loginLogs)).toBe('login_logs')
    expect(getTableName(scheduleEntries)).toBe('schedule_entries')
    expect(getTableName(galleryPhotos)).toBe('gallery_photos')
    expect(getTableName(clubSettings)).toBe('club_settings')
    expect(getTableName(authUsers)).toBe('user')
    expect(getTableName(authSessions)).toBe('session')
    expect(getTableName(authAccounts)).toBe('account')
    expect(getTableName(authVerifications)).toBe('verification')
  })

  it('verifies players table columns', () => {
    const cols = getTableColumns(players)
    expect(cols.id.notNull).toBe(true)
    expect(cols.name.notNull).toBe(true)
    expect(cols.isActive.notNull).toBe(true)
    expect(cols.createdAt.notNull).toBe(true)
    expect(cols.updatedAt.notNull).toBe(true)
  })

  it('verifies attendance table columns', () => {
    const cols = getTableColumns(attendanceRecords)
    expect(cols.id.notNull).toBe(true)
    expect(cols.playerId.notNull).toBe(true)
    expect(cols.attendanceDate.notNull).toBe(true)
    expect(cols.status.notNull).toBe(true)
  })

  it('verifies finance entries columns', () => {
    const cols = getTableColumns(financeEntries)
    expect(cols.id.notNull).toBe(true)
    expect(cols.type.notNull).toBe(true)
    expect(cols.amount.notNull).toBe(true)
    expect(cols.entryDate.notNull).toBe(true)
  })
})
