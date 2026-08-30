import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { formatSomaliDate } from '../../lib/dates'
import { getFinanceLedgerFn } from '../../server/api'
import { Button, SectionTitle, TicketCard } from '../ui'

type FinanceRow = {
  id: string
  type: 'income' | 'expense'
  amount: number
  note: string
  entryDate: string
}

export function PlayerFinanceTab() {
  const { token } = useAuth()
  const [entries, setEntries] = useState<FinanceRow[]>([])
  const [totals, setTotals] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadFinance = () => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    getFinanceLedgerFn({ data: { sessionToken: token } })
      .then((data) => {
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
      })
      .catch((err: any) => {
        setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta xisaabta')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    loadFinance()
  }, [token])

  return (
    <div className="space-y-6 pb-12">
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
