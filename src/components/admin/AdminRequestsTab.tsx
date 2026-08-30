import { useCallback, useEffect, useState } from 'react'
import { Check, Clock, Plus, UserCheck, UserPlus, X } from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { formatSomaliDate, getTodayDateString } from '../../lib/dates'
import {
  adminCreateLeaveFn,
  getRequestsInboxAdminFn,
  reviewExcuseRequestFn,
  reviewJoinRequestFn,
  reviewLeaveRequestFn,
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

type ExcuseItem = {
  id: string
  playerName: string
  requestDate: string
  attendanceType: 'maqan' | 'daahay'
  reason: string
  status: 'pending' | 'approved' | 'denied'
}

type LeaveItem = {
  id: string
  playerName: string
  leaveDate: string
  reason: string
  status: 'pending' | 'approved' | 'denied'
}

type JoinItem = {
  id: string
  name: string
  phone: string
  message: string | null
  status: 'pending' | 'approved' | 'denied'
}

export function AdminRequestsTab() {
  const { token } = useAuth()
  const { notify } = useToast()
  const [activeCategory, setActiveCategory] = useState<
    'excuses' | 'leaves' | 'joins'
  >('excuses')

  const [excuses, setExcuses] = useState<ExcuseItem[]>([])
  const [leaves, setLeaves] = useState<LeaveItem[]>([])
  const [joins, setJoins] = useState<JoinItem[]>([])

  // Direct Admin Leave Modal State
  const [isDirectLeaveOpen, setIsDirectLeaveOpen] = useState(false)
  const [directPlayerId, setDirectPlayerId] = useState('')
  const [directLeaveDate, setDirectLeaveDate] = useState(getTodayDateString())
  const [directReason, setDirectReason] = useState('')
  const [isSavingDirectLeave, setIsSavingDirectLeave] = useState(false)

  const loadRequests = useCallback(async () => {
    if (!token) return
    try {
      const data = await getRequestsInboxAdminFn({
        data: { sessionToken: token },
      })
      if (data) {
        setExcuses(data.excuses as any)
        setLeaves(data.leaves as any)
        setJoins(data.joins as any)
      }
    } catch (err) {
      console.warn('Requests load notice:', err)
    }
  }, [token])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const handleExcuseDecision = async (
    id: string,
    decision: 'approved' | 'denied',
  ) => {
    if (!token) return
    try {
      await reviewExcuseRequestFn({
        data: { sessionToken: token, requestId: id, decision },
      })
      setExcuses((current) =>
        current.map((e) => (e.id === id ? { ...e, status: decision } : e)),
      )
      notify(
        decision === 'approved'
          ? 'Cudurdaarkii waa la aqbalay (Permanent excuse recorded)'
          : 'Cudurdaarkii waa la diiday',
        decision === 'approved' ? 'success' : 'neutral',
      )
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay go’aanka cudurdaarka', 'danger')
    }
  }

  const handleLeaveDecision = async (
    id: string,
    decision: 'approved' | 'denied',
  ) => {
    if (!token) return
    try {
      await reviewLeaveRequestFn({
        data: { sessionToken: token, requestId: id, decision },
      })
      setLeaves((current) =>
        current.map((l) => (l.id === id ? { ...l, status: decision } : l)),
      )
      notify(
        decision === 'approved'
          ? 'Fasaxii waa la oggolaaday'
          : 'Fasaxii waa la diiday',
        decision === 'approved' ? 'success' : 'neutral',
      )
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay go’aanka fasaxa', 'danger')
    }
  }

  const handleJoinDecision = async (
    id: string,
    decision: 'approved' | 'denied',
  ) => {
    if (!token) return
    try {
      await reviewJoinRequestFn({
        data: { sessionToken: token, requestId: id, decision },
      })
      setJoins((current) =>
        current.map((j) => (j.id === id ? { ...j, status: decision } : j)),
      )
      notify(
        decision === 'approved'
          ? 'Xubinta cusub waa la aqbalay oo liiska ciyaartooyda ayaa lagu daray!'
          : 'Codsiga xubinnimada waa la diiday',
        decision === 'approved' ? 'success' : 'neutral',
      )
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay go’aanka ku biirista', 'danger')
    }
  }

  const handleDirectLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!directPlayerId || !directReason.trim() || !token) return
    setIsSavingDirectLeave(true)

    try {
      await adminCreateLeaveFn({
        data: {
          sessionToken: token,
          playerId: directPlayerId,
          leaveDate: directLeaveDate,
          reason: directReason.trim(),
        },
      })
      await loadRequests()
      setIsDirectLeaveOpen(false)
      setDirectReason('')
      notify(
        'Fasaxa tooska ah waa la keydiyay oo waa la oggolaaday!',
        'success',
      )
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay bixinta fasaxa', 'danger')
    } finally {
      setIsSavingDirectLeave(false)
    }
  }

  const pendingExcuses = excuses.filter((e) => e.status === 'pending').length
  const pendingLeaves = leaves.filter((l) => l.status === 'pending').length
  const pendingJoins = joins.filter((j) => j.status === 'pending').length

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionTitle eyebrow="SANDUUQA CODSIYADA" as="h2">
            Codsiyada iyo Oggolaanshaha
          </SectionTitle>
          <p className="text-xs text-chalk-dim">
            Maamul cudurdaarrada, fasaxyada, iyo codsiyada xubinnimada cusub
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => setIsDirectLeaveOpen(true)}
          className="gap-1.5 self-start text-xs"
        >
          <Plus className="h-4 w-4 text-gold" />
          <span>Fasax Toos ah Si (Admin)</span>
        </Button>
      </div>

      <div className="flex rounded-lg border border-club-border bg-pitch-deep p-1">
        <button
          type="button"
          onClick={() => setActiveCategory('excuses')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-bold transition-all ${
            activeCategory === 'excuses'
              ? 'bg-gold text-pitch font-bold shadow'
              : 'text-chalk-dim hover:text-chalk'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Cudurdaar ({pendingExcuses})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('leaves')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-bold transition-all ${
            activeCategory === 'leaves'
              ? 'bg-gold text-pitch font-bold shadow'
              : 'text-chalk-dim hover:text-chalk'
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          <span>Fasax ({pendingLeaves})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('joins')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-bold transition-all ${
            activeCategory === 'joins'
              ? 'bg-gold text-pitch font-bold shadow'
              : 'text-chalk-dim hover:text-chalk'
          }`}
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Ku Biirid ({pendingJoins})</span>
        </button>
      </div>

      {activeCategory === 'excuses' ? (
        <div className="space-y-3">
          {excuses.map((excuse) => (
            <TicketCard key={excuse.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <strong className="block text-base font-bold text-chalk">
                    {excuse.playerName}
                  </strong>
                  <span className="text-xs text-gold font-medium">
                    {formatSomaliDate(excuse.requestDate)} • Nooca:{' '}
                    <span className="capitalize">{excuse.attendanceType}</span>
                  </span>
                </div>

                <StatusBadge
                  tone={
                    excuse.status === 'approved'
                      ? 'success'
                      : excuse.status === 'denied'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {excuse.status === 'approved'
                    ? 'La Oggolaaday'
                    : excuse.status === 'denied'
                      ? 'La Diiday'
                      : 'La Sugayo'}
                </StatusBadge>
              </div>

              <div className="rounded-md bg-pitch-deep p-2.5 text-xs text-chalk-dim border border-club-border">
                <strong className="block text-gold mb-0.5">Sababta:</strong>
                <p className="m-0">{excuse.reason}</p>
              </div>

              {excuse.status === 'pending' ? (
                <div className="flex justify-end gap-2 pt-1 border-t border-club-border">
                  <Button
                    variant="danger"
                    className="text-xs py-1 px-3 h-8 gap-1"
                    onClick={() => handleExcuseDecision(excuse.id, 'denied')}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Diid</span>
                  </Button>
                  <Button
                    variant="primary"
                    className="text-xs py-1 px-3 h-8 gap-1"
                    onClick={() => handleExcuseDecision(excuse.id, 'approved')}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Oggolow</span>
                  </Button>
                </div>
              ) : null}
            </TicketCard>
          ))}
        </div>
      ) : null}

      {activeCategory === 'leaves' ? (
        <div className="space-y-3">
          {leaves.map((leave) => (
            <TicketCard key={leave.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <strong className="block text-base font-bold text-chalk">
                    {leave.playerName}
                  </strong>
                  <span className="text-xs text-gold font-medium">
                    Maalinta Fasaxa: {formatSomaliDate(leave.leaveDate)}
                  </span>
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

              <div className="rounded-md bg-pitch-deep p-2.5 text-xs text-chalk-dim border border-club-border">
                <strong className="block text-gold mb-0.5">Sababta:</strong>
                <p className="m-0">{leave.reason}</p>
              </div>

              {leave.status === 'pending' ? (
                <div className="flex justify-end gap-2 pt-1 border-t border-club-border">
                  <Button
                    variant="danger"
                    className="text-xs py-1 px-3 h-8 gap-1"
                    onClick={() => handleLeaveDecision(leave.id, 'denied')}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Diid</span>
                  </Button>
                  <Button
                    variant="primary"
                    className="text-xs py-1 px-3 h-8 gap-1"
                    onClick={() => handleLeaveDecision(leave.id, 'approved')}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Oggolow</span>
                  </Button>
                </div>
              ) : null}
            </TicketCard>
          ))}
        </div>
      ) : null}

      {activeCategory === 'joins' ? (
        <div className="space-y-3">
          {joins.map((join) => (
            <TicketCard key={join.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <strong className="block text-base font-bold text-chalk">
                    {join.name}
                  </strong>
                  <span className="text-xs text-gold font-medium">
                    WhatsApp: {join.phone}
                  </span>
                </div>

                <StatusBadge
                  tone={
                    join.status === 'approved'
                      ? 'success'
                      : join.status === 'denied'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {join.status === 'approved'
                    ? 'Xubin Noqday'
                    : join.status === 'denied'
                      ? 'La Diiday'
                      : 'La Sugayo'}
                </StatusBadge>
              </div>

              {join.message ? (
                <div className="rounded-md bg-pitch-deep p-2.5 text-xs text-chalk-dim border border-club-border">
                  <strong className="block text-gold mb-0.5">Fariin:</strong>
                  <p className="m-0">{join.message}</p>
                </div>
              ) : null}

              {join.status === 'pending' ? (
                <div className="flex justify-end gap-2 pt-1 border-t border-club-border">
                  <Button
                    variant="danger"
                    className="text-xs py-1 px-3 h-8 gap-1"
                    onClick={() => handleJoinDecision(join.id, 'denied')}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Diid</span>
                  </Button>
                  <Button
                    variant="primary"
                    className="text-xs py-1 px-3 h-8 gap-1"
                    onClick={() => handleJoinDecision(join.id, 'approved')}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Oggolow (Kudar Roster-ka)</span>
                  </Button>
                </div>
              ) : null}
            </TicketCard>
          ))}
        </div>
      ) : null}

      <Dialog
        open={isDirectLeaveOpen}
        onClose={() => setIsDirectLeaveOpen(false)}
        title="Fasax Toos ah Si Ciyaartoy (Admin)"
      >
        <form onSubmit={handleDirectLeaveSubmit} className="space-y-3.5">
          <TextField
            label="Player ID (UUID) *"
            value={directPlayerId}
            onChange={(e) => setDirectPlayerId(e.target.value)}
            placeholder="e.g. 11111111-1111-1111-1111-111111111111"
            required
          />
          <TextField
            label="Taariikhda Fasaxa *"
            type="date"
            value={directLeaveDate}
            onChange={(e) => setDirectLeaveDate(e.target.value)}
            required
          />
          <div>
            <label className="mb-1 block text-xs font-bold text-chalk">
              Sababta Fasaxa *
            </label>
            <textarea
              value={directReason}
              onChange={(e) => setDirectReason(e.target.value)}
              placeholder="Geli sababta fasaxa loo siiyay..."
              rows={3}
              className="ui-input text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsDirectLeaveOpen(false)}
            >
              Ka Noqo
            </Button>
            <Button variant="primary" type="submit" busy={isSavingDirectLeave}>
              Sii Fasaxa
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
