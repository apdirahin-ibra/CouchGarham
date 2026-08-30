import { getTableColumns } from 'drizzle-orm'
import { pgTable, text } from 'drizzle-orm/pg-core'
import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  attendanceStatusEnum,
  attendanceStatusValues,
  auditColumns,
  financeTypeEnum,
  financeTypeValues,
  requestOriginEnum,
  requestOriginValues,
  requestStatusEnum,
  requestStatusValues,
  roleEnum,
  roleValues,
  type AttendanceStatus,
  type FinanceType,
  type RequestOrigin,
  type RequestStatus,
  type Role,
} from '#/db/schema'

describe('shared database enums', () => {
  it.each([
    ['app_role', roleEnum.enumName, roleValues, ['admin', 'player']],
    [
      'attendance_status',
      attendanceStatusEnum.enumName,
      attendanceStatusValues,
      ['xadir', 'maqan', 'daahay'],
    ],
    [
      'request_status',
      requestStatusEnum.enumName,
      requestStatusValues,
      ['pending', 'approved', 'denied'],
    ],
    [
      'finance_type',
      financeTypeEnum.enumName,
      financeTypeValues,
      ['income', 'expense'],
    ],
    [
      'request_origin',
      requestOriginEnum.enumName,
      requestOriginValues,
      ['admin', 'player'],
    ],
  ])(
    'defines %s with its exact constrained values',
    (name, enumName, values, expected) => {
      expect(enumName).toBe(name)
      expect(values).toEqual(expected)
    },
  )

  it('exports narrow domain value types', () => {
    expectTypeOf<Role>().toEqualTypeOf<'admin' | 'player'>()
    expectTypeOf<AttendanceStatus>().toEqualTypeOf<
      'xadir' | 'maqan' | 'daahay'
    >()
    expectTypeOf<RequestStatus>().toEqualTypeOf<
      'pending' | 'approved' | 'denied'
    >()
    expectTypeOf<FinanceType>().toEqualTypeOf<'income' | 'expense'>()
    expectTypeOf<RequestOrigin>().toEqualTypeOf<'admin' | 'player'>()
  })
})

describe('shared audit convention', () => {
  const auditProbe = pgTable('audit_probe', {
    id: text('id').primaryKey(),
    ...auditColumns(),
  })
  const columns = getTableColumns(auditProbe)

  it.each(['createdAt', 'updatedAt'] as const)(
    'uses required timezone-aware millisecond timestamps for %s',
    (columnName) => {
      const column = columns[columnName]

      expect(column.name).toBe(
        columnName === 'createdAt' ? 'created_at' : 'updated_at',
      )
      expect(column.notNull).toBe(true)
      expect(column.hasDefault).toBe(true)
      expect(column.getSQLType()).toBe('timestamp (3) with time zone')
    },
  )

  it('supplies an application update value for updated_at only', () => {
    expect(columns.createdAt.onUpdateFn).toBeUndefined()
    expect(columns.updatedAt.onUpdateFn?.()).toBeInstanceOf(Date)
  })
})
