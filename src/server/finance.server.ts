import '@tanstack/react-start/server-only'

import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { getDatabase } from '../db/connection.server'
import {
  financeEntries,
  playerFeeRecords,
  type FinanceEntry,
} from '../db/schema'
import { getCurrentMonthKey, getTodayDateString } from '../lib/dates'
import { getActiveRoster } from './players.server'

export const financeInputSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Cadadka lacagtu waa inuu ka weynaadaa 0'),
  note: z.string().min(2, 'Faahfaahinta lacagta waa khasab'),
  entryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Taariikhdu waa inay noqotaa YYYY-MM-DD'),
})

export type FinanceInput = z.infer<typeof financeInputSchema>

/**
 * Returns complete finance ledger along with total income, total expense, and balance using exact integer cents (M-02).
 */
export async function getFinanceLedger() {
  const db = getDatabase()
  const entries = await db
    .select()
    .from(financeEntries)
    .orderBy(desc(financeEntries.entryDate), desc(financeEntries.createdAt))

  let incomeCents = 0
  let expenseCents = 0

  for (const entry of entries) {
    const num = parseFloat(entry.amount) || 0
    const cents = Math.round(num * 100)
    if (entry.type === 'income') {
      incomeCents += cents
    } else if (entry.type === 'expense') {
      expenseCents += cents
    }
  }

  const totalIncome = incomeCents / 100
  const totalExpense = expenseCents / 100
  const balance = (incomeCents - expenseCents) / 100

  return {
    entries,
    totals: {
      totalIncome,
      totalExpense,
      balance,
    },
  }
}

/**
 * Admin: Adds an income or expense entry.
 */
export async function addFinanceEntry(
  input: FinanceInput,
): Promise<FinanceEntry> {
  const db = getDatabase()
  const validated = financeInputSchema.parse(input)

  const [inserted] = await db
    .insert(financeEntries)
    .values({
      type: validated.type,
      amount: validated.amount.toFixed(2),
      note: validated.note.trim(),
      entryDate: validated.entryDate,
    })
    .returning()

  return inserted
}

/**
 * Admin: Deletes a finance entry.
 */
export async function deleteFinanceEntry(id: string): Promise<void> {
  const db = getDatabase()
  await db.delete(financeEntries).where(eq(financeEntries.id, id))
}

export const playerFeePaymentSchema = z.object({
  playerId: z.string().uuid('Player ID khaldan'),
  monthKey: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Qaabka bisha waa inuu noqdaa YYYY-MM'),
  expectedAmount: z.number().min(0).default(10),
  paidAmount: z.number().min(0),
  note: z.string().optional().nullable(),
  paidAt: z.string().optional().nullable(),
})

export type PlayerFeePaymentInput = z.infer<typeof playerFeePaymentSchema>

/**
 * Player: Returns fee status for authenticated player for a given month.
 * Shows expected fee, paid amount, debt balance, and status ("Wuu Dhiibay" vs "Waa Lagu Leeyahay").
 */
export async function getPlayerFeeStatus(playerId: string, monthKey?: string) {
  const db = getDatabase()
  const targetMonth = monthKey || getCurrentMonthKey()

  const [record] = await db
    .select()
    .from(playerFeeRecords)
    .where(
      and(
        eq(playerFeeRecords.playerId, playerId),
        eq(playerFeeRecords.monthKey, targetMonth),
      ),
    )
    .limit(1)

  const expectedAmount = record ? parseFloat(record.expectedAmount) : 10.0
  const paidAmount = record ? parseFloat(record.paidAmount) : 0.0
  const debt = Math.max(0, expectedAmount - paidAmount)
  const isPaid = (debt === 0 && paidAmount > 0) || record?.status === 'paid'

  return {
    playerId,
    monthKey: targetMonth,
    expectedAmount,
    paidAmount,
    debt,
    status: isPaid
      ? 'paid'
      : (record?.status ?? (paidAmount > 0 ? 'partial' : 'unpaid')),
    statusLabel: isPaid
      ? 'Wuu Dhiibay'
      : debt > 0
        ? `Waa Lagu Leeyahay: $${debt.toFixed(2)}`
        : 'Wuu Dhiibay',
    paidAt: record?.paidAt ?? null,
    note: record?.note ?? null,
  }
}

/**
 * Admin: Returns all active players and their fee status for the selected month.
 */
export async function getAllPlayerFeesAdmin(monthKey?: string) {
  const db = getDatabase()
  const targetMonth = monthKey || getCurrentMonthKey()

  const [activePlayers, feeRecords] = await Promise.all([
    getActiveRoster(),
    db
      .select()
      .from(playerFeeRecords)
      .where(eq(playerFeeRecords.monthKey, targetMonth)),
  ])

  const feeMap = new Map(feeRecords.map((r) => [r.playerId, r]))

  return activePlayers.map((player) => {
    const record = feeMap.get(player.id)
    const expectedAmount = record ? parseFloat(record.expectedAmount) : 10.0
    const paidAmount = record ? parseFloat(record.paidAmount) : 0.0
    const debt = Math.max(0, expectedAmount - paidAmount)
    const isPaid = (debt === 0 && paidAmount > 0) || record?.status === 'paid'

    return {
      playerId: player.id,
      name: player.name,
      nickname: player.nickname,
      jerseyNumber: player.jerseyNumber,
      position: player.position,
      monthKey: targetMonth,
      expectedAmount,
      paidAmount,
      debt,
      status: isPaid
        ? 'paid'
        : (record?.status ?? (paidAmount > 0 ? 'partial' : 'unpaid')),
      statusLabel: isPaid
        ? 'Wuu Dhiibay'
        : debt > 0
          ? `Waa Lagu Leeyahay: $${debt.toFixed(2)}`
          : 'Wuu Dhiibay',
      paidAt: record?.paidAt ?? null,
      note: record?.note ?? null,
    }
  })
}

/**
 * Admin: Records or updates a player's fee payment for a given month.
 */
export async function recordPlayerFeePaymentAdmin(
  input: PlayerFeePaymentInput,
) {
  const db = getDatabase()
  const validated = playerFeePaymentSchema.parse(input)
  const status =
    validated.paidAmount >= validated.expectedAmount
      ? 'paid'
      : validated.paidAmount > 0
        ? 'partial'
        : 'unpaid'
  const today = getTodayDateString()

  const [record] = await db
    .insert(playerFeeRecords)
    .values({
      playerId: validated.playerId,
      monthKey: validated.monthKey,
      expectedAmount: validated.expectedAmount.toFixed(2),
      paidAmount: validated.paidAmount.toFixed(2),
      status,
      paidAt: validated.paidAt || today,
      note: validated.note?.trim() || null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [playerFeeRecords.playerId, playerFeeRecords.monthKey],
      set: {
        expectedAmount: validated.expectedAmount.toFixed(2),
        paidAmount: validated.paidAmount.toFixed(2),
        status,
        paidAt: validated.paidAt || today,
        note: validated.note?.trim() || null,
        updatedAt: new Date(),
      },
    })
    .returning()

  return record
}
