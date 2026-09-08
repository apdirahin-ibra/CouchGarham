import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Save,
  XCircle,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { formatSomaliDate, getTodayDateString } from '../../lib/dates'
import {
  getAttendanceForDateFn,
  saveAttendanceReasonFn,
  saveAttendanceStatusFn,
} from '../../server/api'
import { Button, SectionTitle, StatusBadge, TicketCard } from '../ui'
import { useToast } from '../ui/toast-context'

type AttendanceStatus = 'xadir' | 'maqan' | 'daahay' | null

type AttendanceItem = {
  playerId: string
  name: string
  nickname: string | null
  jerseyNumber: number | null
  position: string | null
  status: AttendanceStatus
  reason: string
}

export function AdminAttendanceTab() {
  const { token } = useAuth()
  const { notify } = useToast()
  const [selectedDate, setSelectedDate] = useState(getTodayDateString())

  const [roster, setRoster] = useState<AttendanceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null)

  const loadAttendance = useCallback(
    async (date: string) => {
      if (!token) return
      setIsLoading(true)
      setLoadError('')
      try {
        const records = await getAttendanceForDateFn({
          data: { sessionToken: token, date },
        })
        if (records) {
          setRoster(
            records.map((r: any) => ({
              playerId: r.playerId,
              name: r.name,
              nickname: r.nickname,
              jerseyNumber: r.jerseyNumber,
              position: r.position,
              status: r.status,
              reason: r.reason || '',
            })),
          )
        }
      } catch (err: any) {
        setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta xaadiriska')
      } finally {
        setIsLoading(false)
      }
    },
    [token],
  )

  useEffect(() => {
    loadAttendance(selectedDate)
  }, [selectedDate, loadAttendance])

  const handleStatusChange = async (
    playerId: string,
    newStatus: AttendanceStatus,
  ) => {
    if (!token) return
    setSavingPlayerId(playerId)

    const prevItem = roster.find((r) => r.playerId === playerId)
    const prevStatus = prevItem?.status ?? null
    const nextStatus = prevStatus === newStatus ? null : newStatus

    setRoster((current) =>
      current.map((item) =>
        item.playerId === playerId
          ? {
              ...item,
              status: nextStatus,
              reason: nextStatus === null ? '' : item.reason,
            }
          : item,
      ),
    )

    try {
      await saveAttendanceStatusFn({
        data: {
          sessionToken: token,
          playerId,
          date: selectedDate,
          status: nextStatus,
        },
      })
      notify('Xaadiriska si toos ah ayaa loo keydiyay', 'success')
    } catch (err: any) {
      // Revert optimistic update on failure
      setRoster((current) =>
        current.map((item) =>
          item.playerId === playerId ? { ...item, status: prevStatus } : item,
        ),
      )
      notify(err?.message || 'Qalad ayaa dhacay keydinta xaadiriska', 'danger')
    } finally {
      setSavingPlayerId(null)
    }
  }

  const handleReasonChange = (playerId: string, text: string) => {
    setRoster((current) =>
      current.map((item) =>
        item.playerId === playerId ? { ...item, reason: text } : item,
      ),
    )
  }

  const handleReasonBlur = async (playerId: string) => {
    if (!token) return
    const player = roster.find((r) => r.playerId === playerId)
    if (!player) return

    try {
      await saveAttendanceReasonFn({
        data: {
          sessionToken: token,
          playerId,
          date: selectedDate,
          reason: player.reason,
        },
      })
      notify('Sababta cudurdaarka waa la keydiyay', 'success')
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay keydinta cudurdaarka', 'danger')
    }
  }

  const handleSaveAll = () => {
    notify(
      'Dhammaan xaadiriska maalinta waa la xaqiijiyay oo la keydiyay!',
      'success',
    )
  }

  const summary = {
    xadir: roster.filter((r) => r.status === 'xadir').length,
    maqan: roster.filter((r) => r.status === 'maqan').length,
    daahay: roster.filter((r) => r.status === 'daahay').length,
    unrecorded: roster.filter((r) => !r.status).length,
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionTitle eyebrow="XAADIRISKA KOOXDA" as="h2">
            Qaadashada Xaadiriska
          </SectionTitle>
          <span className="text-xs font-semibold text-gold">
            {formatSomaliDate(selectedDate)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="ui-input h-10 w-auto text-sm font-semibold text-chalk"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
        <div className="rounded-lg border border-success/40 bg-surface p-1.5 sm:p-2 flex flex-col items-center justify-center">
          <span className="block text-[0.625rem] font-bold uppercase text-success">
            Xadir
          </span>
          <strong className="block my-0.5 font-display text-lg sm:text-xl text-chalk leading-none">
            {summary.xadir}
          </strong>
        </div>
        <div className="rounded-lg border border-danger/40 bg-surface p-1.5 sm:p-2 flex flex-col items-center justify-center">
          <span className="block text-[0.625rem] font-bold uppercase text-danger">
            Maqan
          </span>
          <strong className="block my-0.5 font-display text-lg sm:text-xl text-chalk leading-none">
            {summary.maqan}
          </strong>
        </div>
        <div className="rounded-lg border border-warning/40 bg-surface p-1.5 sm:p-2 flex flex-col items-center justify-center">
          <span className="block text-[0.625rem] font-bold uppercase text-warning">
            Daahay
          </span>
          <strong className="block my-0.5 font-display text-lg sm:text-xl text-chalk leading-none">
            {summary.daahay}
          </strong>
        </div>
        <div className="rounded-lg border border-club-border bg-surface p-1.5 sm:p-2 flex flex-col items-center justify-center">
          <span className="block text-[0.625rem] font-bold uppercase text-chalk-dim">
            Haray
          </span>
          <strong className="block my-0.5 font-display text-lg sm:text-xl text-chalk leading-none">
            {summary.unrecorded}
          </strong>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-club-border bg-surface text-gold">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          <span>Soo dejinaya xogta xaadiriska...</span>
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-danger/40 bg-surface p-6 text-center space-y-3">
          <AlertCircle className="h-6 w-6 text-danger mx-auto" />
          <p className="text-sm text-danger m-0">{loadError}</p>
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={() => loadAttendance(selectedDate)}
          >
            Dib u tijaabi
          </Button>
        </div>
      ) : roster.length === 0 ? (
        <div className="rounded-xl border border-club-border bg-surface p-6 text-center text-sm text-chalk-dim">
          Weli ma jiraan ciyaartooy firfircoon oo liiska ku jira.
        </div>
      ) : (
        <div className="space-y-3">
          {roster.map((player) => {
            const isSaving = savingPlayerId === player.playerId
            const showReasonField =
              player.status === 'maqan' || player.status === 'daahay'

            return (
              <TicketCard key={player.playerId} className="p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pitch-deep font-display text-sm font-bold text-gold border border-gold/30">
                      {player.jerseyNumber ?? '#'}
                    </span>
                    <div>
                      <strong className="block text-sm font-bold text-chalk">
                        {player.name}
                      </strong>
                      {player.position ? (
                        <span className="text-[0.6875rem] text-chalk-dim">
                          {player.position}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {isSaving ? (
                    <span className="text-xs text-gold animate-pulse">
                      Keydinaya...
                    </span>
                  ) : player.status ? (
                    <StatusBadge
                      tone={
                        player.status === 'xadir'
                          ? 'success'
                          : player.status === 'maqan'
                            ? 'danger'
                            : 'warning'
                      }
                      className="capitalize text-xs font-bold"
                    >
                      {player.status}
                    </StatusBadge>
                  ) : (
                    <span className="text-xs text-chalk-dim">
                      Aan la qaadin
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(player.playerId, 'xadir')}
                    className={`flex h-11 items-center justify-center gap-1.5 rounded-lg border font-display text-sm font-bold transition-all cursor-pointer ${
                      player.status === 'xadir'
                        ? 'border-success bg-success/30 text-chalk shadow-md ring-1 ring-success'
                        : 'border-club-border bg-surface-raised text-chalk-dim hover:border-success/50 hover:text-chalk'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>Xadir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(player.playerId, 'maqan')}
                    className={`flex h-11 items-center justify-center gap-1.5 rounded-lg border font-display text-sm font-bold transition-all cursor-pointer ${
                      player.status === 'maqan'
                        ? 'border-danger bg-danger/30 text-chalk shadow-md ring-1 ring-danger'
                        : 'border-club-border bg-surface-raised text-chalk-dim hover:border-danger/50 hover:text-chalk'
                    }`}
                  >
                    <XCircle className="h-4 w-4 text-danger" />
                    <span>Maqan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(player.playerId, 'daahay')
                    }
                    className={`flex h-11 items-center justify-center gap-1.5 rounded-lg border font-display text-sm font-bold transition-all cursor-pointer ${
                      player.status === 'daahay'
                        ? 'border-warning bg-warning/30 text-chalk shadow-md ring-1 ring-warning'
                        : 'border-club-border bg-surface-raised text-chalk-dim hover:border-warning/50 hover:text-chalk'
                    }`}
                  >
                    <Clock className="h-4 w-4 text-warning" />
                    <span>Daahay</span>
                  </button>
                </div>

                {showReasonField ? (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={player.reason}
                      onChange={(e) =>
                        handleReasonChange(player.playerId, e.target.value)
                      }
                      onBlur={() => handleReasonBlur(player.playerId)}
                      placeholder={`Geli sababta ${player.status === 'maqan' ? 'maqnaanshaha' : 'dib-u-dhaca'}...`}
                      className="ui-input h-9 text-xs"
                    />
                  </div>
                ) : null}
              </TicketCard>
            )
          })}
        </div>
      )}

      {roster.length > 0 && (
        <div className="sticky bottom-20 z-30 pt-4">
          <Button
            variant="primary"
            onClick={handleSaveAll}
            className="w-full justify-center py-3 text-base shadow-2xl"
          >
            <Save className="h-4 w-4" />
            <span>Keydi Dhammaan (Confirm All)</span>
          </Button>
        </div>
      )}
    </div>
  )
}
