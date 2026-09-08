import { useCallback, useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Plus, Trash2 } from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { formatSomaliDate, getTodayDateString } from '../../lib/dates'
import {
  addFinanceEntryFn,
  deleteFinanceEntryFn,
  getFinanceLedgerFn,
} from '../../server/api'
import { Button, Dialog, SectionTitle, TextField, TicketCard } from '../ui'
import { useToast } from '../ui/toast-context'

type FinanceRow = {
  id: string
  type: 'income' | 'expense'
  amount: number
  note: string
  entryDate: string
}

export function AdminFinanceTab() {
  const { token } = useAuth()
  const { notify } = useToast()

  const [entries, setEntries] = useState<FinanceRow[]>([])
  const [totals, setTotals] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [type, setType] = useState<'income' | 'expense'>('income')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [entryDate, setEntryDate] = useState(getTodayDateString())
  const [isSaving, setIsSaving] = useState(false)

  const loadLedger = useCallback(async () => {
    if (!token) return
    try {
      const data = await getFinanceLedgerFn({ data: { sessionToken: token } })
      if (data) {
        setEntries(
          data.entries.map((e: any) => ({
            id: e.id,
            type: e.type,
            amount: parseFloat(e.amount),
            note: e.note,
            entryDate: e.entryDate,
          })),
        )
        setTotals(data.totals)
      }
    } catch (err) {
      console.warn('Finance load notice:', err)
    }
  }, [token])

  useEffect(() => {
    loadLedger()
  }, [loadLedger])

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0 || !note.trim() || !token) return
    setIsSaving(true)

    try {
      await addFinanceEntryFn({
        data: {
          sessionToken: token,
          type,
          amount: num,
          note: note.trim(),
          entryDate,
        },
      })
      await loadLedger()
      setIsModalOpen(false)
      setAmount('')
      setNote('')
      notify(
        type === 'income'
          ? 'Dakhli cusub ayaa lagu daray'
          : 'Kharash cusub ayaa la keydiyay',
        'success',
      )
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay keydinta xisaabta', 'danger')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!token) return
    try {
      await deleteFinanceEntryFn({ data: { sessionToken: token, id } })
      await loadLedger()
      notify('Diiwaankii lacagta waa la tirtiray', 'neutral')
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay tirtirista', 'danger')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionTitle eyebrow="MAAMULKA LACAGTA & DIIWAANKA" as="h2">
            Xisaabta Kooxda (Finance)
          </SectionTitle>
          <p className="text-xs text-chalk-dim">
            Dakhliga soo galay, kharashyada baxay, iyo haraaga sanduuqa
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5 self-start text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Kudar Diiwaan Cusub</span>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-success/30 bg-surface-raised p-3 text-center">
          <span className="block text-xs font-bold uppercase text-success">
            Dakhliga Guud
          </span>
          <strong className="font-display text-2xl font-bold text-chalk">
            ${totals.totalIncome.toFixed(2)}
          </strong>
        </div>

        <div className="rounded-xl border border-danger/30 bg-surface-raised p-3 text-center">
          <span className="block text-xs font-bold uppercase text-danger">
            Kharashka Guud
          </span>
          <strong className="font-display text-2xl font-bold text-chalk">
            ${totals.totalExpense.toFixed(2)}
          </strong>
        </div>

        <div className="rounded-xl border border-gold/30 bg-surface-raised p-3 text-center">
          <span className="block text-xs font-bold uppercase text-gold">
            Haraaga Sanduuqa
          </span>
          <strong
            className={`font-display text-2xl font-bold ${
              totals.balance >= 0 ? 'text-gold' : 'text-danger'
            }`}
          >
            ${totals.balance.toFixed(2)}
          </strong>
        </div>
      </div>

      <TicketCard className="p-4 space-y-3">
        <SectionTitle eyebrow="DIIWAANKA XISAABTA" as="h3">
          Dhaqdhaqaaqii Ugu Dambeeyay
        </SectionTitle>

        <div className="divide-y divide-club-border">
          {entries.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    item.type === 'income'
                      ? 'bg-success/20 text-success'
                      : 'bg-danger/20 text-danger'
                  }`}
                >
                  {item.type === 'income' ? (
                    <ArrowDownCircle className="h-5 w-5" />
                  ) : (
                    <ArrowUpCircle className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <strong className="block text-sm font-bold text-chalk">
                    {item.note}
                  </strong>
                  <span className="text-xs text-chalk-dim">
                    {formatSomaliDate(item.entryDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <strong
                  className={`font-display text-lg font-bold ${
                    item.type === 'income' ? 'text-success' : 'text-danger'
                  }`}
                >
                  {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                </strong>

                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20 hover:border-danger transition-colors cursor-pointer"
                  onClick={() => handleDeleteEntry(item.id)}
                  title="Tirtir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </TicketCard>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Kudar Xisaab Cusub (Finance Entry)"
      >
        <form onSubmit={handleAddEntry} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-bold text-chalk">
              Nooca Diiwaanka *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-bold transition-all cursor-pointer ${
                  type === 'income'
                    ? 'border-success bg-success/20 text-success ring-1 ring-success'
                    : 'border-club-border bg-surface-raised text-chalk-dim'
                }`}
              >
                <ArrowDownCircle className="h-4 w-4" />
                <span>Dakhli (Income)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-bold transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'border-danger bg-danger/20 text-danger ring-1 ring-danger'
                    : 'border-club-border bg-surface-raised text-chalk-dim'
                }`}
              >
                <ArrowUpCircle className="h-4 w-4" />
                <span>Kharash (Expense)</span>
              </button>
            </div>
          </div>

          <TextField
            label="Cadadka Lacagta ($ USD) *"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 50.00"
            min="0.01"
            required
          />

          <TextField
            label="Faahfaahinta / Sababta *"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Iibsashada kubbadaha cusub"
            required
          />

          <TextField
            label="Taariikhda *"
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Ka Noqo
            </Button>
            <Button variant="primary" type="submit" busy={isSaving}>
              Keydi Xisaabta
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
