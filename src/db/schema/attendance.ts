import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { auditColumns } from './audit'
import { attendanceStatusEnum, requestStatusEnum } from './enums'
import { players } from './players'

export const attendanceRecords = pgTable(
  'attendance_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playerId: uuid('player_id')
      .references(() => players.id, { onDelete: 'cascade' })
      .notNull(),
    attendanceDate: date('attendance_date').notNull(),
    status: attendanceStatusEnum('status').notNull(),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('attendance_player_date_unique').on(
      table.playerId,
      table.attendanceDate,
    ),
    index('attendance_date_idx').on(table.attendanceDate),
  ],
)

export const attendanceExcuses = pgTable(
  'attendance_excuses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playerId: uuid('player_id')
      .references(() => players.id, { onDelete: 'cascade' })
      .notNull(),
    attendanceDate: date('attendance_date').notNull(),
    reason: text('reason').notNull(),
    createdBy: varchar('created_by', { length: 255 }).notNull(),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('excuse_player_date_unique').on(
      table.playerId,
      table.attendanceDate,
    ),
  ],
)

export const excuseRequests = pgTable(
  'excuse_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playerId: uuid('player_id')
      .references(() => players.id, { onDelete: 'cascade' })
      .notNull(),
    requestDate: date('request_date').notNull(),
    attendanceType: attendanceStatusEnum('attendance_type').notNull(),
    reason: text('reason').notNull(),
    status: requestStatusEnum('status').default('pending').notNull(),
    reviewedAt: timestamp('reviewed_at', {
      mode: 'date',
      precision: 3,
      withTimezone: true,
    }),
    reviewedBy: varchar('reviewed_by', { length: 255 }),
    ...auditColumns(),
  },
  (table) => [
    index('excuse_request_player_idx').on(table.playerId, table.status),
  ],
)

export type AttendanceRecord = typeof attendanceRecords.$inferSelect
export type NewAttendanceRecord = typeof attendanceRecords.$inferInsert
export type AttendanceExcuse = typeof attendanceExcuses.$inferSelect
export type NewAttendanceExcuse = typeof attendanceExcuses.$inferInsert
export type ExcuseRequest = typeof excuseRequests.$inferSelect
export type NewExcuseRequest = typeof excuseRequests.$inferInsert
