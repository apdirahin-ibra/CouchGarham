import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Calendar, Plus, RefreshCw } from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import {
  formatSomaliDate,
  getCurrentMonthKey,
  getTodayDateString,
} from '../../lib/dates'
import { getPlayerLeavesFn, submitLeaveRequestFn } from '../../server/api'
import {
  Button,
  Dialog,
  SectionTitle,
  StatusBadge,
  TextField,
  TicketCard,
} from '../ui'
import { useToast } from '../ui/toast-context'

type LeaveRow = {
  id: string
  leaveDate: string
  reason: string
  status: 'pending' | 'approved' | 'denied'
  createdAt: Date | string
}

export function PlayerLeaveTab() {
  const { token } = useAuth()
  const { notify } = useToast()
  const currentMonth = getCurrentMonthKey()

  const [leaves, setLeaves] = useState<LeaveRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [leaveDate, setLeaveDate] = useState(getTodayDateString())
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadLeaves = useCallback(() => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    getPlayerLeavesFn({ data: { sessionToken: token } })
      .then((data) => {
        setLeaves(data || [])
      })
      .catch((err: any) => {
        setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta fasaxa')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [token])

  useEffect(() => {
    loadLeaves()
  }, [loadLeaves])

  const usedThisMonth = leaves.filter(
    (l) => l.leaveDate.startsWith(currentMonth) && l.status !== 'denied',
  ).length
  const maxLeavesPerMonth = 3
  const isLimitReached = usedThisMonth >= maxLeavesPerMonth

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim() || !token) return
    if (isLimitReached) {
      notify('Waxaad gaartay xadka fasaxa bishan (3/3 maalmood)', 'danger')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await submitLeaveRequestFn({
        data: {
          sessionToken: token,
          leaveDate,
          reason: reason.trim(),
        },
      })
      setLeaves((current) => [res.request as any, ...current])
      setIsModalOpen(false)
      setReason('')
      notify('Codsigaaga fasaxa waa loo gudbiyay maamulaha!', 'success')
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay dirista fasaxa', 'danger')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionTitle eyebrow="MAAMULKA FASAXAAGA" as="h2">
            Codsashada Fasaxa
          </SectionTitle>
          <p className="text-xs text-chalk-dim">
            Fasax qaado marka aad leedahay duruuf gaar ah (Ugu badnaan 3
            maalmood bishii)
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          disabled={isLimitReached}
          className="gap-1.5 self-start text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Codso Fasax Cusub</span>
        </Button>
      </div>

      <div className="rounded-xl border border-gold/30 bg-surface-raised p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-gold">
              Fasaxa Bishan ({currentMonth})
            </span>
            <strong className="font-display text-2xl font-bold text-chalk">
              {usedThisMonth} / {maxLeavesPerMonth} Maalmood
            </strong>
          </div>

          <StatusBadge tone={isLimitReached ? 'danger' : 'success'}>
            {isLimitReached ? 'Xadkii Wuu Buuxsamay' : 'Weli Waad Coddankartaa'}
          </StatusBadge>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-pitch-deep">
          <div
            className={`h-full transition-all ${
              isLimitReached ? 'bg-danger' : 'bg-gold'
            }`}
            style={{ width: `${(usedThisMonth / maxLeavesPerMonth) * 100}%` }}
          />
        </div>
      </div>

      <TicketCard className="p-4 space-y-3">
        <SectionTitle eyebrow="TAARIIKHDA FASAXAAGA" as="h3">
          Codsiyadii Hore ee Fasaxa
        </SectionTitle>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-xs text-gold">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span>Soo dejinaya codsiyadaada fasaxa...</span>
          </div>
        ) : loadError ? (
          <div className="rounded-lg border border-danger/40 bg-pitch-deep p-4 text-center space-y-2">
            <AlertCircle className="h-5 w-5 text-danger mx-auto" />
            <p className="text-xs text-danger m-0">{loadError}</p>
            <Button
              type="button"
              variant="secondary"
              className="text-xs py-1 px-3"
              onClick={loadLeaves}
            >
              Dib u tijaabi
            </Button>
          </div>
        ) : leaves.length === 0 ? (
          <p className="text-xs text-chalk-dim text-center py-4">
            Weli ma aadan codsan wax fasax ah.
          </p>
        ) : (
          <div className="divide-y divide-club-border">
            {leaves.map((leave) => (
              <div key={leave.id} className="py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gold" />
                    <strong className="text-sm font-semibold text-chalk">
                      {formatSomaliDate(leave.leaveDate)}
                    </strong>
                  </div>

                  <StatusBadge
                    tone={
                      leave.status === 'approved'
                        ? 'success'
                        : leave.status === 'denied'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {leave.status === 'approved'
                      ? 'La Oggolaaday'
                      : leave.status === 'denied'
                        ? 'La Diiday'
                        : 'La Sugayo'}
                  </StatusBadge>
                </div>

                <p className="text-xs text-chalk-dim m-0">
                  <strong className="text-gold">Sababta:</strong> {leave.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </TicketCard>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Codso Fasax Cusub (Apply for Leave)"
      >
        <form onSubmit={handleSubmitLeave} className="space-y-3.5">
          <TextField
            label="Taariikhda Aad Fasaxa Rabto *"
            type="date"
            value={leaveDate}
            onChange={(e) => setLeaveDate(e.target.value)}
            required
          />

          <div>
            <label className="mb-1 block text-xs font-bold text-chalk">
              Sababta Fasaxa *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Qor sababta aad fasaxa u doonayso..."
              rows={3}
              className="ui-input text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Ka Noqo
            </Button>
            <Button variant="primary" type="submit" busy={isSubmitting}>
              Dir Codsiga Fasaxa
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
