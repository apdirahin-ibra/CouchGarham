import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  CreditCard,
  DollarSign,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import {
  formatSomaliDate,
  getCurrentMonthKey,
  getTodayDateString,
} from '../../lib/dates'
import {
  addFinanceEntryFn,
  deleteFinanceEntryFn,
  getAllPlayerFeesAdminFn,
  getFinanceLedgerFn,
  recordPlayerFeePaymentAdminFn,
} from '../../server/api'
import {
  Button,
  Dialog,
  SectionTitle,
  StatusBadge,
  TextField,
  TicketCard,
} from '../ui'
import { useToast } from '../ui/toast-context'

type FinanceRow = {
  id: string
  type: 'income' | 'expense'
  amount: number
  note: string
  entryDate: string
}

type PlayerFeeItem = {
  playerId: string
  name: string
  nickname: string | null
  jerseyNumber: number | null
  position: string | null
  monthKey: string
  expectedAmount: number
  paidAmount: number
  debt: number
  status: string
  statusLabel: string
  paidAt: string | null
  note: string | null
}

export function AdminFinanceTab() {
  const { token } = useAuth()
  const { notify } = useToast()
  const currentMonth = getCurrentMonthKey()

  const [subTab, setSubTab] = useState<'ledger' | 'playerFees'>('ledger')
  const [entries, setEntries] = useState<FinanceRow[]>([])
  const [totals, setTotals] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  })

  // Player Fees State
  const [playerFees, setPlayerFees] = useState<PlayerFeeItem[]>([])
  const [isLoadingFees, setIsLoadingFees] = useState(false)
  const [payingPlayer, setPayingPlayer] = useState<PlayerFeeItem | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('10.00')
  const [paymentNote, setPaymentNote] = useState('')
  const [paymentDate, setPaymentDate] = useState(getTodayDateString())
  const [isSavingPayment, setIsSavingPayment] = useState(false)

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

  const loadPlayerFees = useCallback(async () => {
    if (!token) return
    setIsLoadingFees(true)
    try {
      const data = await getAllPlayerFeesAdminFn({
        data: { sessionToken: token, monthKey: currentMonth },
      })
      if (data) {
        setPlayerFees(data as any)
      }
    } catch (err) {
      console.warn('Player fees load notice:', err)
    } finally {
      setIsLoadingFees(false)
    }
  }, [token, currentMonth])

  useEffect(() => {
    if (subTab === 'playerFees') {
      loadPlayerFees()
    }
  }, [subTab, loadPlayerFees])

  const handleOpenPaymentModal = (player: PlayerFeeItem) => {
    setPayingPlayer(player)
    setPaymentAmount(player.debt > 0 ? String(player.debt) : '10.00')
    setPaymentNote(player.note || '')
    setPaymentDate(getTodayDateString())
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !payingPlayer) return
    const num = parseFloat(paymentAmount)
    if (isNaN(num) || num < 0) return
    setIsSavingPayment(true)

    try {
      await recordPlayerFeePaymentAdminFn({
        data: {
          sessionToken: token,
          playerId: payingPlayer.playerId,
          monthKey: currentMonth,
          expectedAmount: payingPlayer.expectedAmount || 10,
          paidAmount: num,
          note: paymentNote.trim() || null,
          paidAt: paymentDate,
        },
      })
      await loadPlayerFees()
      setPayingPlayer(null)
      notify(
        `Lacag-bixintii ${payingPlayer.name} si guul leh ayaa loo keydiyay`,
        'success',
      )
    } catch (err: any) {
      notify(
        err?.message || 'Qalad ayaa dhacay keydinta lacag-bixinta',
        'danger',
      )
    } finally {
      setIsSavingPayment(false)
    }
  }

  const handleQuickMarkPaid = async (player: PlayerFeeItem) => {
    if (!token) return
    try {
      await recordPlayerFeePaymentAdminFn({
        data: {
          sessionToken: token,
          playerId: player.playerId,
          monthKey: currentMonth,
          expectedAmount: player.expectedAmount || 10,
          paidAmount: player.expectedAmount || 10,
          note: 'Si toos ah ayaa loo xaqiijiyay',
          paidAt: getTodayDateString(),
        },
      })
      await loadPlayerFees()
      notify(
        `${player.name}: Khidmadda bishan waa la xaqiijiyay ($10.00)`,
        'success',
      )
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay xaqiijinta lacagta', 'danger')
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
            Dakhliga, kharashyada, haraaga sanduuqa, iyo khidmadda ciyaartooyda
          </p>
        </div>

        {subTab === 'ledger' ? (
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="gap-1.5 self-start text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Kudar Diiwaan Cusub</span>
          </Button>
        ) : null}
      </div>

      {/* SubTab Navigation */}
      <div className="flex border-b border-club-border gap-2">
        <button
          type="button"
          onClick={() => setSubTab('ledger')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            subTab === 'ledger'
              ? 'border-gold text-gold'
              : 'border-transparent text-chalk-dim hover:text-chalk'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Diiwaanka Guud (Ledger)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('playerFees')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            subTab === 'playerFees'
              ? 'border-gold text-gold'
              : 'border-transparent text-chalk-dim hover:text-chalk'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Khidmadda Ciyaartooyda ({currentMonth})</span>
        </button>
      </div>

      {subTab === 'ledger' ? (
        <>
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
                      {item.type === 'income' ? '+' : '-'}$
                      {item.amount.toFixed(2)}
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
        </>
      ) : (
        /* Player Fees SubTab */
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
            <div className="rounded-xl border border-club-border bg-surface-raised p-3">
              <span className="block text-[0.6875rem] font-bold uppercase text-chalk-dim">
                Wadarta Roster-ka
              </span>
              <strong className="font-display text-2xl font-bold text-chalk">
                {playerFees.length}
              </strong>
            </div>

            <div className="rounded-xl border border-success/30 bg-surface-raised p-3">
              <span className="block text-[0.6875rem] font-bold uppercase text-success">
                Wuu Dhiibay
              </span>
              <strong className="font-display text-2xl font-bold text-success">
                {playerFees.filter((p) => p.status === 'paid').length}
              </strong>
            </div>

            <div className="rounded-xl border border-danger/30 bg-surface-raised p-3">
              <span className="block text-[0.6875rem] font-bold uppercase text-danger">
                Waa Lagu Leeyahay
              </span>
              <strong className="font-display text-2xl font-bold text-danger">
                {playerFees.filter((p) => p.status !== 'paid').length}
              </strong>
            </div>

            <div className="rounded-xl border border-gold/30 bg-surface-raised p-3">
              <span className="block text-[0.6875rem] font-bold uppercase text-gold">
                La Ururiyay
              </span>
              <strong className="font-display text-2xl font-bold text-gold">
                $
                {playerFees
                  .reduce((acc, p) => acc + p.paidAmount, 0)
                  .toFixed(2)}
              </strong>
            </div>
          </div>

          <TicketCard className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <SectionTitle eyebrow="KHIDMADDA BISHAN" as="h3">
                  Xaaladda Khidmadda Ciyaartooyda ({currentMonth})
                </SectionTitle>
                <p className="text-xs text-chalk-dim m-0">
                  Ciyaartoy kasta waxaa laga rabaa $10.00 bishii. Halkan kaga
                  xaqiiji lacagta.
                </p>
              </div>

              <Button
                variant="secondary"
                className="text-xs py-1 px-2.5 h-8 gap-1.5"
                onClick={loadPlayerFees}
                disabled={isLoadingFees}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isLoadingFees ? 'animate-spin' : ''}`}
                />
                <span>Cusbooneysii</span>
              </Button>
            </div>

            {isLoadingFees ? (
              <div className="flex h-32 items-center justify-center text-xs text-gold">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                <span>Soo dejinaya xogta khidmadda ciyaartooyda...</span>
              </div>
            ) : playerFees.length === 0 ? (
              <p className="text-xs text-chalk-dim text-center py-6">
                Weli ma jiraan ciyaartooy firfircoon oo liiska ku jira.
              </p>
            ) : (
              <div className="divide-y divide-club-border">
                {playerFees.map((player) => (
                  <div
                    key={player.playerId}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30 font-display text-sm font-bold">
                        #{player.jerseyNumber ?? '-'}
                      </div>
                      <div>
                        <strong className="block text-sm font-bold text-chalk">
                          {player.name}
                        </strong>
                        <span className="text-xs text-chalk-dim">
                          {player.position ?? 'Ciyaartoy'} • Laga rabo: $
                          {player.expectedAmount.toFixed(2)} • Dhiibay: $
                          {player.paidAmount.toFixed(2)}
                        </span>
                        {player.paidAt ? (
                          <span className="block text-[0.6875rem] text-success italic mt-0.5">
                            La dhiibay: {formatSomaliDate(player.paidAt)}
                            {player.note ? ` (${player.note})` : ''}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <StatusBadge
                        tone={player.status === 'paid' ? 'success' : 'danger'}
                        className="text-xs font-bold"
                      >
                        {player.status === 'paid'
                          ? 'Wuu Dhiibay'
                          : `Lagu leeyahay: $${player.debt.toFixed(2)}`}
                      </StatusBadge>

                      {player.status !== 'paid' ? (
                        <Button
                          variant="primary"
                          className="text-xs py-1 px-2.5 h-8 gap-1 bg-success hover:bg-success-light text-pitch font-bold"
                          onClick={() => handleQuickMarkPaid(player)}
                          title="Si degdeg ah u xaqiiji inuu dhiibay $10"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Dhiibay ($10)</span>
                        </Button>
                      ) : null}

                      <Button
                        variant="secondary"
                        className="text-xs py-1 px-2.5 h-8 gap-1"
                        onClick={() => handleOpenPaymentModal(player)}
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>Qor Lacag</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TicketCard>
        </div>
      )}

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

      {/* Modal Qorida Lacag-bixinta Ciyaartoyga */}
      <Dialog
        open={payingPlayer !== null}
        onClose={() => setPayingPlayer(null)}
        title={`Qor Lacag-bixinta: ${payingPlayer?.name || ''}`}
      >
        <form onSubmit={handleSavePayment} className="space-y-3.5">
          <div className="rounded-lg border border-gold/30 bg-surface-raised p-3">
            <span className="block text-xs font-bold text-chalk">
              {payingPlayer?.name} (#{payingPlayer?.jerseyNumber ?? '-'} -{' '}
              {payingPlayer?.position ?? 'Ciyaartoy'})
            </span>
            <span className="text-[0.6875rem] text-chalk-dim">
              Bishan: {currentMonth} • Laga rabo: $
              {(payingPlayer?.expectedAmount ?? 10).toFixed(2)}
            </span>
          </div>

          <TextField
            label="Cadadka la dhiibay ($ USD) *"
            type="number"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="e.g. 10.00"
            min="0"
            required
          />

          <TextField
            label="Taariikhda Lacag-bixinta *"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />

          <TextField
            label="Faahfaahin / Xusuusin (Ikhtiyaari)"
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            placeholder="e.g. Lacag caddaan ah / EVC Plus"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setPayingPlayer(null)}
            >
              Ka Noqo
            </Button>
            <Button variant="primary" type="submit" busy={isSavingPayment}>
              Keydi Lacag-bixinta
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
