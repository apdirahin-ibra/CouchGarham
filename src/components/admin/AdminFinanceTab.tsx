import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  CreditCard,
  DollarSign,
  Edit2,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
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
  quickTogglePlayerFeeAdminFn,
  recordPlayerFeePaymentAdminFn,
  setMonthlyFeeConfigAdminFn,
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

  const [isFeeConfigOpen, setIsFeeConfigOpen] = useState(false)
  const [feeConfigInput, setFeeConfigInput] = useState('0.50')
  const [isSavingFeeConfig, setIsSavingFeeConfig] = useState(false)
  const [feeFilter, setFeeFilter] = useState<'all' | 'paid' | 'unpaid'>('all')

  const configuredFee = playerFees[0]?.expectedAmount ?? 0.5
  const totalExpected = playerFees.reduce((acc, p) => acc + p.expectedAmount, 0)
  const totalCollected = playerFees.reduce((acc, p) => acc + p.paidAmount, 0)
  const totalDebt = playerFees.reduce((acc, p) => acc + p.debt, 0)
  const paidCount = playerFees.filter((p) => p.status === 'paid').length
  const unpaidCount = playerFees.filter((p) => p.status !== 'paid').length
  const collectionPercentage =
    totalExpected > 0
      ? Math.min(100, Math.round((totalCollected / totalExpected) * 100))
      : 0

  const filteredPlayerFees = playerFees.filter((p) => {
    if (feeFilter === 'paid') return p.status === 'paid'
    if (feeFilter === 'unpaid') return p.status !== 'paid'
    return true
  })

  useEffect(() => {
    if (subTab === 'playerFees') {
      loadPlayerFees()
    }
  }, [subTab, loadPlayerFees])

  const handleOpenPaymentModal = (player: PlayerFeeItem) => {
    setPayingPlayer(player)
    setPaymentAmount(
      player.debt > 0
        ? player.debt.toFixed(2)
        : player.expectedAmount.toFixed(2),
    )
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
          expectedAmount: payingPlayer.expectedAmount || 0.5,
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

  const handleQuickToggle = async (
    player: PlayerFeeItem,
    action: 'paid' | 'unpaid',
  ) => {
    if (!token) return

    // Optimistic update
    const nextStatus = action === 'paid' ? 'paid' : 'unpaid'
    const nextPaid = action === 'paid' ? player.expectedAmount : 0
    const nextDebt = action === 'paid' ? 0 : player.expectedAmount
    const today = getTodayDateString()

    setPlayerFees((prev) =>
      prev.map((p) =>
        p.playerId === player.playerId
          ? {
              ...p,
              status: nextStatus,
              paidAmount: nextPaid,
              debt: nextDebt,
              paidAt: action === 'paid' ? today : null,
              statusLabel:
                action === 'paid'
                  ? 'Wuu Dhiibay'
                  : `Waa Lagu Leeyahay: $${nextDebt.toFixed(2)}`,
            }
          : p,
      ),
    )

    try {
      await quickTogglePlayerFeeAdminFn({
        data: {
          sessionToken: token,
          playerId: player.playerId,
          monthKey: currentMonth,
          action,
        },
      })
      notify(
        action === 'paid'
          ? `${player.name}: Wuu bixiyay $${player.expectedAmount.toFixed(2)} ✅`
          : `${player.name}: Ma dhiibin (Waa lagu leeyahay $${player.expectedAmount.toFixed(2)}) ❌`,
        action === 'paid' ? 'success' : 'neutral',
      )
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay diiwaangelinta', 'danger')
      loadPlayerFees()
    }
  }

  const handleSaveFeeConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    const num = parseFloat(feeConfigInput)
    if (isNaN(num) || num < 0) {
      notify('Fadlan geli lacag sax ah', 'danger')
      return
    }

    setIsSavingFeeConfig(true)
    try {
      await setMonthlyFeeConfigAdminFn({
        data: {
          sessionToken: token,
          monthKey: currentMonth,
          expectedAmount: num,
        },
      })
      notify(`Khidmadda bishan waxaa loo dejiyay $${num.toFixed(2)}`, 'success')
      setIsFeeConfigOpen(false)
      await loadPlayerFees()
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay beddelista khidmadda', 'danger')
    } finally {
      setIsSavingFeeConfig(false)
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
          {/* Deji Khidmadda Bishan Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-gold/40 bg-surface-raised p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[0.6875rem] font-bold uppercase tracking-wider text-gold">
                  Khidmadda La Rabo Bishan ({currentMonth})
                </span>
                <strong className="font-display text-xl sm:text-2xl font-bold text-chalk">
                  ${configuredFee.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-chalk-dim">
                    / Ciyaartoygiiba
                  </span>
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="text-xs py-1.5 px-3 gap-1.5 border-gold/40 text-gold hover:bg-gold/20"
                onClick={() => {
                  setFeeConfigInput(configuredFee.toFixed(2))
                  setIsFeeConfigOpen(true)
                }}
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Beddel Khidmadda ($)</span>
              </Button>
              <Button
                variant="secondary"
                className="text-xs py-1.5 px-2.5 h-8 gap-1"
                onClick={loadPlayerFees}
                disabled={isLoadingFees}
                title="Cusbooneysii"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isLoadingFees ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
            <div className="rounded-xl border border-club-border bg-surface-raised p-3">
              <span className="block text-[0.6875rem] font-bold uppercase text-chalk-dim">
                Wadarta La Rabo
              </span>
              <strong className="font-display text-2xl font-bold text-chalk">
                ${totalExpected.toFixed(2)}
              </strong>
              <span className="block text-[0.625rem] text-chalk-dim mt-0.5">
                {playerFees.length} ciyaartoy
              </span>
            </div>

            <div className="rounded-xl border border-success/30 bg-surface-raised p-3">
              <span className="block text-[0.6875rem] font-bold uppercase text-success">
                La Bixiyay (Dhiibay)
              </span>
              <strong className="font-display text-2xl font-bold text-success">
                ${totalCollected.toFixed(2)}
              </strong>
              <span className="block text-[0.625rem] text-success font-semibold mt-0.5">
                {paidCount} dhiibay ✅
              </span>
            </div>

            <div className="rounded-xl border border-danger/30 bg-surface-raised p-3">
              <span className="block text-[0.6875rem] font-bold uppercase text-danger">
                Lagu Leeyahay (Dhiman)
              </span>
              <strong className="font-display text-2xl font-bold text-danger">
                ${totalDebt.toFixed(2)}
              </strong>
              <span className="block text-[0.625rem] text-danger font-semibold mt-0.5">
                {unpaidCount} ma dhiibin ❌
              </span>
            </div>

            <div className="rounded-xl border border-gold/30 bg-surface-raised p-3 flex flex-col justify-between">
              <div>
                <span className="block text-[0.6875rem] font-bold uppercase text-gold">
                  Heerka Ururinta
                </span>
                <strong className="font-display text-2xl font-bold text-gold">
                  {collectionPercentage}%
                </strong>
              </div>
              <div className="w-full bg-pitch-deep rounded-full h-1.5 mt-2 overflow-hidden border border-club-border">
                <div
                  className="bg-gold h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${collectionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <TicketCard className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2 border-b border-club-border">
              <div>
                <SectionTitle eyebrow="LIISKA CIYAARTOOYDA" as="h3">
                  Xaaladda Lacagta ee Ciyaartoy Kasta
                </SectionTitle>
                <p className="text-xs text-chalk-dim m-0">
                  U isticmaal badhamada degdegga ah ee Sax (✅ Dhiibay) iyo Khalad (❌ Ma Dhiibin) si xisaabtu si toos ah isugu darto.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center rounded-lg border border-club-border bg-pitch-deep p-1 self-start sm:self-auto text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFeeFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    feeFilter === 'all'
                      ? 'bg-gold text-pitch font-bold shadow'
                      : 'text-chalk-dim hover:text-chalk'
                  }`}
                >
                  Dhammaan ({playerFees.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFeeFilter('paid')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    feeFilter === 'paid'
                      ? 'bg-success text-pitch font-bold shadow'
                      : 'text-chalk-dim hover:text-success'
                  }`}
                >
                  Dhiibay ({paidCount} ✅)
                </button>
                <button
                  type="button"
                  onClick={() => setFeeFilter('unpaid')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    feeFilter === 'unpaid'
                      ? 'bg-danger text-pitch font-bold shadow'
                      : 'text-chalk-dim hover:text-danger'
                  }`}
                >
                  Ma Dhiibin ({unpaidCount} ❌)
                </button>
              </div>
            </div>

            {isLoadingFees ? (
              <div className="flex h-32 items-center justify-center text-xs text-gold">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                <span>Soo dejinaya xogta khidmadda ciyaartooyda...</span>
              </div>
            ) : filteredPlayerFees.length === 0 ? (
              <p className="text-xs text-chalk-dim text-center py-6">
                Ma jiraan ciyaartooy ku jira shaandhayntan.
              </p>
            ) : (
              <div className="divide-y divide-club-border">
                {filteredPlayerFees.map((player) => (
                  <div
                    key={player.playerId}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30 font-display text-sm font-bold">
                        #{player.jerseyNumber ?? '-'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="block text-sm font-bold text-chalk">
                            {player.name}
                          </strong>
                          {player.position ? (
                            <span className="text-[0.6875rem] text-chalk-dim">
                              ({player.position})
                            </span>
                          ) : null}
                        </div>
                        <span className="text-xs text-chalk-dim">
                          Laga rabo: <strong className="text-chalk font-semibold">${player.expectedAmount.toFixed(2)}</strong> • Dhiibay: <strong className={player.paidAmount > 0 ? 'text-success font-semibold' : 'text-chalk font-semibold'}>${player.paidAmount.toFixed(2)}</strong>
                        </span>
                        {player.paidAt && player.status === 'paid' ? (
                          <span className="block text-[0.6875rem] text-success italic mt-0.5">
                            La bixiyay: {formatSomaliDate(player.paidAt)}
                            {player.note ? ` (${player.note})` : ''}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                      <StatusBadge
                        tone={player.status === 'paid' ? 'success' : 'danger'}
                        className="text-xs font-bold"
                      >
                        {player.status === 'paid'
                          ? 'Wuu Dhiibay ✅'
                          : `Lagu leeyahay: $${player.debt.toFixed(2)} ❌`}
                      </StatusBadge>

                      {/* Button 1: Sax (Dhiibay) */}
                      <Button
                        variant="primary"
                        className={`text-xs py-1 px-2.5 h-8 gap-1 font-bold ${
                          player.status === 'paid'
                            ? 'bg-success/20 text-success border border-success/40 hover:bg-success/30'
                            : 'bg-success hover:bg-success-light text-pitch shadow-sm'
                        }`}
                        onClick={() => handleQuickToggle(player, 'paid')}
                        title={`Xaqiiji inuu dhiibay $${player.expectedAmount.toFixed(2)}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Dhiibay (${player.expectedAmount.toFixed(2)})</span>
                      </Button>

                      {/* Button 2: Khalad (Ma Dhiibin) */}
                      <Button
                        variant="secondary"
                        className={`text-xs py-1 px-2.5 h-8 gap-1 ${
                          player.status !== 'paid'
                            ? 'bg-danger/20 text-danger border border-danger/40'
                            : 'border-club-border text-chalk-dim hover:border-danger/50 hover:text-danger'
                        }`}
                        onClick={() => handleQuickToggle(player, 'unpaid')}
                        title="U calaamadee inaan la bixin"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Ma Dhiibin</span>
                      </Button>

                      {/* Button 3: Qor Lacag */}
                      <Button
                        variant="secondary"
                        className="text-xs py-1 px-2.5 h-8 gap-1"
                        onClick={() => handleOpenPaymentModal(player)}
                        title="Qor qaddar kale ama xusuusin"
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>Qor</span>
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

      {/* Modal: Beddel Khidmadda Bishan */}
      <Dialog
        open={isFeeConfigOpen}
        onClose={() => setIsFeeConfigOpen(false)}
        title="Deji Khidmadda Bishan ee Ciyaartooyda"
      >
        <form onSubmit={handleSaveFeeConfig} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-bold text-chalk">
              Khidmadda Laga Rabo Ciyaartoy Kasta Bishan ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={feeConfigInput}
              onChange={(e) => setFeeConfigInput(e.target.value)}
              placeholder="Tusaale: 0.50 ama 1.00 ama 10.00"
              className="ui-input text-base font-bold text-chalk"
              required
            />
            <p className="mt-1.5 text-[0.6875rem] text-chalk-dim leading-relaxed">
              Tusaale: Haddii aad qorto <strong>0.50</strong>, Ali iyo ciyaartoy kasta waxaa bishan laga rabi doonaa <strong>$0.50</strong>. Xisaabiyaashuna si toos ah ayay isu cusbooneysiin doonaan.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsFeeConfigOpen(false)}
            >
              Ka Noqo
            </Button>
            <Button variant="primary" type="submit" busy={isSavingFeeConfig}>
              Keydi Khidmadda
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
