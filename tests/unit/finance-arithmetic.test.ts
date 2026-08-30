import { describe, expect, it } from 'vitest'

describe('finance ledger arithmetic', () => {
  it('correctly calculates total income, total expense, and net balance', () => {
    const entries = [
      { type: 'income' as const, amount: '50.00' },
      { type: 'income' as const, amount: '120.50' },
      { type: 'expense' as const, amount: '30.25' },
      { type: 'expense' as const, amount: '40.00' },
    ]

    let totalIncome = 0
    let totalExpense = 0

    for (const entry of entries) {
      const num = parseFloat(entry.amount) || 0
      if (entry.type === 'income') totalIncome += num
      else if (entry.type === 'expense') totalExpense += num
    }

    const balance = totalIncome - totalExpense

    expect(totalIncome).toBe(170.5)
    expect(totalExpense).toBe(70.25)
    expect(balance).toBe(100.25)
  })
})

describe('leave request policy logic', () => {
  it('identifies when player has reached the 3-leave monthly limit', () => {
    const currentMonth = '2026-08'
    const leaves = [
      { leaveDate: '2026-08-05', status: 'approved' },
      { leaveDate: '2026-08-12', status: 'pending' },
      { leaveDate: '2026-08-19', status: 'denied' }, // denied doesn't count towards used
      { leaveDate: '2026-08-25', status: 'approved' },
    ]

    const usedCount = leaves.filter(
      (r) => r.leaveDate.startsWith(currentMonth) && r.status !== 'denied',
    ).length

    expect(usedCount).toBe(3)
    const canSubmitMoreWithoutWarning = usedCount < 3
    expect(canSubmitMoreWithoutWarning).toBe(false)
  })
})
