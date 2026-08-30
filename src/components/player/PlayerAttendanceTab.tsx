import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
  XCircle,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { formatSomaliDate, getTodayDateString } from '../../lib/dates'
import {
  getPlayerAttendanceHistoryFn,
  submitExcuseRequestFn,
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

type AttendanceHistoryRow = {
  attendanceDate: string
  status: 'xadir' | 'maqan' | 'daahay'
  reason: string | null
}

export function PlayerAttendanceTab() {
  const { token } = useAuth()
  const { notify } = useToast()

  const [history, setHistory] = useState<AttendanceHistoryRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [requestDate, setRequestDate] = useState(getTodayDateString())
  const [attendanceType, setAttendanceType] = useState<'maqan' | 'daahay'>(
    'maqan',
  )
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadHistory = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    try {
      const data = await getPlayerAttendanceHistoryFn({
        data: { sessionToken: token },
      })
      setHistory(data || [])
    } catch (err: any) {
      setLoadError(
        err?.message || 'Qalad ayaa dhacay soo dejinta taariikhda xaadiriska',
      )
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleSubmitExcuse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim() || !token) return
    setIsSubmitting(true)

    try {
      await submitExcuseRequestFn({
        data: {
          sessionToken: token,
          requestDate,
          attendanceType,
          reason: reason.trim(),
        },
      })
      notify('Codsigaaga cudurdaarka waa loo diray maamulaha!', 'success')
      setIsModalOpen(false)
      setReason('')
      loadHistory()
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay dirista cudurdaarka', 'danger')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totals = {
    xadir: history.filter((h) => h.status === 'xadir').length,
    maqan: history.filter((h) => h.status === 'maqan').length,
    daahay: history.filter((h) => h.status === 'daahay').length,
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionTitle eyebrow="XAADIRISKAAGA SHAKHSIYEED" as="h2">
            Taariikhda Xaadiriskaaga
          </SectionTitle>
          <p className="text-xs text-chalk-dim">
            Kulamadii aad timid, kuwii aad maqnayd, iyo cudurdaarradaada
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5 self-start text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Geli Cudurdaar</span>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-success/30 bg-surface-raised p-3">
          <span className="block text-xs font-bold uppercase text-success">
            Xadir
          </span>
          <strong className="font-display text-2xl font-bold text-chalk">
            {totals.xadir}
          </strong>
        </div>
        <div className="rounded-xl border border-danger/30 bg-surface-raised p-3">
          <span className="block text-xs font-bold uppercase text-danger">
            Maqan
          </span>
          <strong className="font-display text-2xl font-bold text-chalk">
            {totals.maqan}
          </strong>
        </div>
        <div className="rounded-xl border border-warning/30 bg-surface-raised p-3">
          <span className="block text-xs font-bold uppercase text-warning">
            Daahay
          </span>
          <strong className="font-display text-2xl font-bold text-chalk">
            {totals.daahay}
          </strong>
        </div>
      </div>

      <TicketCard className="p-4 space-y-3">
        <SectionTitle eyebrow="DIIWAANKA TAARIIKHIYA" as="h3">
          Kulamadii Hore
        </SectionTitle>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-xs text-gold">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span>Soo dejinaya taariikhda xaadiriska...</span>
          </div>
        ) : loadError ? (
          <div className="rounded-lg border border-danger/40 bg-pitch-deep p-4 text-center space-y-2">
            <AlertCircle className="h-5 w-5 text-danger mx-auto" />
            <p className="text-xs text-danger m-0">{loadError}</p>
            <Button
              type="button"
              variant="secondary"
              className="text-xs py-1 px-3"
              onClick={loadHistory}
            >
              Dib u tijaabi
            </Button>
          </div>
        ) : history.length === 0 ? (
          <p className="text-xs text-chalk-dim text-center py-4">
            Weli ma jiro diiwaan xaadiris oo kuu diiwaangashan.
          </p>
        ) : (
          <div className="divide-y divide-club-border">
            {history.map((record, idx) => (
              <div key={idx} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {record.status === 'xadir' ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : record.status === 'maqan' ? (
                    <XCircle className="h-5 w-5 text-danger" />
                  ) : (
                    <Clock className="h-5 w-5 text-warning" />
                  )}

                  <div>
                    <strong className="block text-sm font-semibold text-chalk">
                      {formatSomaliDate(record.attendanceDate)}
                    </strong>
                    {record.reason ? (
                      <span className="text-xs text-gold">
                        Sabab: {record.reason}
                      </span>
                    ) : null}
                  </div>
                </div>

                <StatusBadge
                  tone={
                    record.status === 'xadir'
                      ? 'success'
                      : record.status === 'maqan'
                        ? 'danger'
                        : 'warning'
                  }
                  className="capitalize text-xs font-bold"
                >
                  {record.status}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </TicketCard>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Geli Cudurdaar Xaadiris (Submit Excuse)"
      >
        <form onSubmit={handleSubmitExcuse} className="space-y-3.5">
          <TextField
            label="Taariikhda Kulanka *"
            type="date"
            value={requestDate}
            onChange={(e) => setRequestDate(e.target.value)}
            required
          />

          <div>
            <label className="mb-1 block text-xs font-bold text-chalk">
              Nooca Cudurdaarka *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAttendanceType('maqan')}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-bold transition-all cursor-pointer ${
                  attendanceType === 'maqan'
                    ? 'border-danger bg-danger/20 text-danger ring-1 ring-danger'
                    : 'border-club-border bg-surface-raised text-chalk-dim'
                }`}
              >
                <XCircle className="h-4 w-4" />
                <span>Maqnaansho (Maqan)</span>
              </button>

              <button
                type="button"
                onClick={() => setAttendanceType('daahay')}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-bold transition-all cursor-pointer ${
                  attendanceType === 'daahay'
                    ? 'border-warning bg-warning/20 text-warning ring-1 ring-warning'
                    : 'border-club-border bg-surface-raised text-chalk-dim'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>Dib-u-dhac (Daahay)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-chalk">
              Sababta Cudurdaarka *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Qor sababta aad u maqnayd ama aad ugu daahday kulankan..."
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
              Dir Cudurdaarka
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
