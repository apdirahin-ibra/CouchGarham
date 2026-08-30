import { describe, expect, it } from 'vitest'

import {
  formatSomaliDate,
  getCurrentMonthKey,
  getRecentDateForWeekday,
  jsDayToSomaliDay,
  somaliDayToJsDay,
} from '#/lib/dates'
import { getWhatsAppUrl, normalizeWhatsAppNumber } from '#/lib/whatsapp'

describe('dates and Somali calendar utilities', () => {
  it('maps Somali weekdays to JS days correctly', () => {
    expect(somaliDayToJsDay('Axad')).toBe(0)
    expect(somaliDayToJsDay('Isniin')).toBe(1)
    expect(somaliDayToJsDay('Talaado')).toBe(2)
    expect(somaliDayToJsDay('Arbaco')).toBe(3)
    expect(somaliDayToJsDay('Khamiis')).toBe(4)
    expect(somaliDayToJsDay('Jimco')).toBe(5)
    expect(somaliDayToJsDay('Sabti')).toBe(6)
  })

  it('maps JS days to Somali weekdays correctly', () => {
    expect(jsDayToSomaliDay(0)).toBe('Axad')
    expect(jsDayToSomaliDay(1)).toBe('Isniin')
    expect(jsDayToSomaliDay(5)).toBe('Jimco')
    expect(jsDayToSomaliDay(6)).toBe('Sabti')
  })

  it('formats dates in Somali', () => {
    // 2026-08-30 is Sunday (Axad)
    const formatted = formatSomaliDate(new Date(2026, 7, 30))
    expect(formatted).toBe('Axad, 30 Ogosto 2026')
  })

  it('generates correct month keys', () => {
    expect(getCurrentMonthKey(new Date(2026, 7, 30))).toBe('2026-08')
    expect(getCurrentMonthKey(new Date(2026, 0, 5))).toBe('2026-01')
  })

  it('resolves the most recent weekday date', () => {
    // Reference date: 2026-08-30 (Sunday, JS day 0)
    const ref = new Date(2026, 7, 30)
    // Most recent Sunday is 2026-08-30
    expect(getRecentDateForWeekday(0, ref)).toBe('2026-08-30')
    // Most recent Saturday (6) is 2026-08-29
    expect(getRecentDateForWeekday(6, ref)).toBe('2026-08-29')
    // Most recent Friday (5) is 2026-08-28
    expect(getRecentDateForWeekday(5, ref)).toBe('2026-08-28')
  })
})

describe('WhatsApp utilities', () => {
  it('normalizes phone numbers to digits only', () => {
    expect(normalizeWhatsAppNumber('+252 61 555 1234')).toBe('252615551234')
    expect(normalizeWhatsAppNumber('(252) 61-555-1234')).toBe('252615551234')
    expect(normalizeWhatsAppNumber('252615551234')).toBe('252615551234')
  })

  it('builds wa.me deep links with optional messages', () => {
    expect(getWhatsAppUrl('+252 61 555 1234')).toBe(
      'https://wa.me/252615551234',
    )
    expect(getWhatsAppUrl('252615551234', 'Asc, macallin')).toBe(
      'https://wa.me/252615551234?text=Asc%2C%20macallin',
    )
  })
})
