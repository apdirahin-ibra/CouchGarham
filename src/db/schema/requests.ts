import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { auditColumns } from './audit'
import { requestStatusEnum, roleEnum } from './enums'
import { players } from './players'

export const leaveRequests = pgTable(
  'leave_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playerId: uuid('player_id')
      .references(() => players.id, { onDelete: 'cascade' })
      .notNull(),
    leaveDate: date('leave_date').notNull(),
    reason: text('reason').notNull(),
    status: requestStatusEnum('status').default('pending').notNull(),
    createdByRole: roleEnum('created_by_role').default('player').notNull(),
    reviewedAt: timestamp('reviewed_at', {
      mode: 'date',
      precision: 3,
      withTimezone: true,
    }),
    reviewedBy: varchar('reviewed_by', { length: 255 }),
    ...auditColumns(),
  },
  (table) => [
    index('leave_request_player_idx').on(table.playerId, table.leaveDate),
  ],
)

export const joinRequests = pgTable('join_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  message: text('message'),
  status: requestStatusEnum('status').default('pending').notNull(),
  reviewedAt: timestamp('reviewed_at', {
    mode: 'date',
    precision: 3,
    withTimezone: true,
  }),
  reviewedBy: varchar('reviewed_by', { length: 255 }),
  ...auditColumns(),
})

export const suggestions = pgTable('suggestions', {
  id: uuid('id').defaultRandom().primaryKey(),
  playerId: uuid('player_id')
    .references(() => players.id, { onDelete: 'cascade' })
    .notNull(),
  text: text('text').notNull(),
  submissionDate: date('submission_date').notNull(),
  ...auditColumns(),
})

export type LeaveRequest = typeof leaveRequests.$inferSelect
export type NewLeaveRequest = typeof leaveRequests.$inferInsert
export type JoinRequest = typeof joinRequests.$inferSelect
export type NewJoinRequest = typeof joinRequests.$inferInsert
export type Suggestion = typeof suggestions.$inferSelect
export type NewSuggestion = typeof suggestions.$inferInsert
