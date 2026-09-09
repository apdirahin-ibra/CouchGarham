import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  RefreshCw,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { formatSomaliDate, getCurrentMonthKey } from '../../lib/dates'
import { getFinanceLedgerFn, getMyPlayerFeeStatusFn } from '../../server/api'
import { Button, SectionTitle, StatusBadge, TicketCard } from '../ui'

type FinanceRow = {
  id: string
  type: 'income' | 'expense'
  amount: number
  note: string
  entryDate: string
}

type PlayerFeeStatus = {
  expectedAmount: number
  paidAmount: number
  debt: number
  status: string
  statusLabel: string
  paidAt: string | null
  note: string | null
  monthKey: string
}

export function PlayerFinanceTab() {
  const { token } = useAuth()
  const currentMonth = getCurrentMonthKey()
  const [entries, setEntries] = useState<FinanceRow[]>([])
  const [totals, setTotals] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  })
  const [playerFee, setPlayerFee] = useState<PlayerFeeStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadFinance = useCallback(() => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')

    Promise.all([
      getFinanceLedgerFn({ data: { sessionToken: token } }),
      getMyPlayerFeeStatusFn({ data: { sessionToken: token } }),
    ])
      .then(([ledgerData, feeData]) => {
        if (ledgerData) {
          setEntries(
            ledgerData.entries.map((e: any) => ({
              id: e.id,
              type: e.type,
              amount: parseFloat(e.amount),
              note: e.note,
              entryDate: e.entryDate,
            })),
          )
          setTotals(ledgerData.totals)
        }
        if (feeData) {
          setPlayerFee(feeData as any)
        }
      })
      .catch((err: any) => {
        setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta xisaabta')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [token])

  useEffect(() => {
    loadFinance()
  }, [loadFinance])

  return (
    <div className="space-y-6 pb-12">
      {/* Xaaladdaada Lacagta Bishan */}
      <TicketCard className="p-4 space-y-3.5 border-gold/40">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <SectionTitle eyebrow="KHIDMADDA BISHAN" as="h2">
                Xaaladdaada Lacagta Bishan
              </SectionTitle>
              <p className="text-xs text-chalk-dim m-0">
                Bishan: {currentMonth} • Khidmadda bishii ee kooxda
              </p>
            </div>
          </div>

          <StatusBadge
            tone={playerFee?.status === 'paid' ? 'success' : 'danger'}
            className="text-xs font-bold py-1 px-3 self-start sm:self-auto"
          >
            {playerFee?.status === 'paid'
              ? 'Wuu Dhiibay'
              : `Waa Lagu Leeyahay: $${(playerFee?.debt ?? 10).toFixed(2)}`}
          </StatusBadge>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
          <div className="rounded-xl border border-club-border bg-pitch-deep p-3">
            <span className="block text-[0.6875rem] font-bold uppercase text-chalk-dim">
              Lagaa rabo
            </span>
            <strong className="font-display text-lg sm:text-xl font-bold text-chalk">
              ${(playerFee?.expectedAmount ?? 10).toFixed(2)}
            </strong>
          </div>

          <div className="rounded-xl border border-success/30 bg-pitch-deep p-3">
            <span className="block text-[0.6875rem] font-bold uppercase text-success">
              Aad dhiibtay
            </span>
            <strong className="font-display text-lg sm:text-xl font-bold text-success">
              ${(playerFee?.paidAmount ?? 0).toFixed(2)}
            </strong>
          </div>

          <div className="rounded-xl border border-club-border bg-pitch-deep p-3">
            <span className="block text-[0.6875rem] font-bold uppercase text-chalk-dim">
              Lagu leeyahay
            </span>
            <strong
              className={`font-display text-lg sm:text-xl font-bold ${
                (playerFee?.debt ?? 10) > 0 ? 'text-danger' : 'text-gold'
              }`}
            >
              ${(playerFee?.debt ?? 10).toFixed(2)}
            </strong>
          </div>
        </div>

        {playerFee?.paidAt ? (
          <p className="text-[0.6875rem] text-success italic text-right m-0">
            Taariikhda la dhiibay: {formatSomaliDate(playerFee.paidAt)}
            {playerFee.note ? ` (${playerFee.note})` : ''}
          </p>
        ) : (
          <p className="text-[0.6875rem] text-warning italic text-right m-0">
            Fadlan khidmadda u dhiib maamulka kooxda si laguu diiwaangeliyo.
          </p>
        )}
      </TicketCard>

      <div>
        <SectionTitle eyebrow="CADDAALADDA & DAACADNIMADA" as="h2">
          Xisaabta Guud ee Kooxda
        </SectionTitle>
        <p className="text-xs text-chalk-dim">
          Diiwaanka lacagaha kooxda soo galay iyo kuwa baxay
        </p>
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
          Dhaqdhaqaaqyadii Ugu Dambeeyay
        </SectionTitle>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-xs text-gold">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span>Soo dejinaya diiwaanka xisaabta...</span>
          </div>
        ) : loadError ? (
          <div className="rounded-lg border border-danger/40 bg-pitch-deep p-4 text-center space-y-2">
            <AlertCircle className="h-5 w-5 text-danger mx-auto" />
            <p className="text-xs text-danger m-0">{loadError}</p>
            <Button
              type="button"
              variant="secondary"
              className="text-xs py-1 px-3"
              onClick={loadFinance}
            >
              Dib u tijaabi
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <p className="text-xs text-chalk-dim text-center py-4">
            Weli ma jiro diiwaan xisaabeed oo la galiyay.
          </p>
        ) : (
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

                <strong
                  className={`font-display text-lg font-bold ${
                    item.type === 'income' ? 'text-success' : 'text-danger'
                  }`}
                >
                  {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </TicketCard>
    </div>
  )
}
