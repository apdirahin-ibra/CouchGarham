import '@tanstack/react-start/server-only'

import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { getDatabase } from '../db/connection.server'
import { financeEntries, type FinanceEntry } from '../db/schema'

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
