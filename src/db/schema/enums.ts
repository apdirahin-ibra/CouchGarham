import { pgEnum } from 'drizzle-orm/pg-core'

/** Authoritative application roles used by authenticated actor records. */
export const roleValues = ['admin', 'player'] as const
export const roleEnum = pgEnum('app_role', roleValues)

/** Attendance states preserved from the existing Somali-first product. */
export const attendanceStatusValues = ['xadir', 'maqan', 'daahay'] as const
export const attendanceStatusEnum = pgEnum(
  'attendance_status',
  attendanceStatusValues,
)

/** Shared moderation lifecycle for excuse, leave, and join requests. */
export const requestStatusValues = ['pending', 'approved', 'denied'] as const
export const requestStatusEnum = pgEnum('request_status', requestStatusValues)

/** Ledger direction; amounts remain positive and this value supplies the sign. */
export const financeTypeValues = ['income', 'expense'] as const
export const financeTypeEnum = pgEnum('finance_type', financeTypeValues)

/** Actor that originated a request, kept distinct from authenticated role use. */
export const requestOriginValues = ['admin', 'player'] as const
export const requestOriginEnum = pgEnum('request_origin', requestOriginValues)

export type Role = (typeof roleValues)[number]
export type AttendanceStatus = (typeof attendanceStatusValues)[number]
export type RequestStatus = (typeof requestStatusValues)[number]
export type FinanceType = (typeof financeTypeValues)[number]
export type RequestOrigin = (typeof requestOriginValues)[number]
