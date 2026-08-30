import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Inbox,
  RefreshCw,
  Shield,
  User,
  XCircle,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import {
  formatSomaliDate,
  getCurrentMonthKey,
  getTodayDateString,
} from '../../lib/dates'
import { getAdminDashboardFn } from '../../server/api'
import { Button, Dialog, SectionTitle, StatTile, TicketCard } from '../ui'

type AttendanceListType = 'xadir' | 'maqan' | 'daahay' | 'unrecorded' | null

export function AdminDashboardTab({
  onNavigateToTab,
}: {
  onNavigateToTab: (tab: any) => void
}) {
  const { token } = useAuth()
  const today = getTodayDateString()
  const formattedToday = formatSomaliDate(today)
  const currentMonth = getCurrentMonthKey()

  const [activeListModal, setActiveListModal] =
    useState<AttendanceListType>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadDashboard = () => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    getAdminDashboardFn({ data: { sessionToken: token } })
      .then((data) => {
        setDashboardData(data)
      })
      .catch((err: any) => {
        setLoadError(
          err?.message || 'Qalad ayaa dhacay soo dejinta dashboard-ka',
        )
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    loadDashboard()
  }, [token])

  const attendanceCounts = dashboardData?.attendanceCounts ?? {
    total: 0,
    xadir: 0,
    maqan: 0,
    daahay: 0,
    unrecorded: 0,
  }

  const sampleLists = dashboardData?.attendanceLists ?? {
    xadir: [],
    maqan: [],
    daahay: [],
    unrecorded: [],
  }

  const pendingRequestsCount = dashboardData?.pendingRequests?.total ?? 0
  const monthTotals = dashboardData?.monthTotals ?? {
    goals: 0,
    assists: 0,
    errors: 0,
  }
  const recentLogins =
    dashboardData?.recentLogins?.map((l: any) => ({
      name: l.displayName,
      role: l.role,
      time: formatSomaliDate(l.loggedInAt),
    })) ?? []

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-club-border bg-surface text-gold">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Soo dejinaya xogta dashboard-ka...</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-danger/40 bg-surface p-6 text-center space-y-3">
        <AlertCircle className="h-6 w-6 text-danger mx-auto" />
        <p className="text-sm text-danger m-0">{loadError}</p>
        <Button
          type="button"
          variant="secondary"
          className="text-xs"
          onClick={loadDashboard}
        >
          Dib u tijaabi
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-xl border border-gold/30 bg-surface-raised p-4 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
          <Calendar className="h-4 w-4" />
          <span>Taariikhda Maanta</span>
        </div>
        <h2 className="mt-1 font-display text-2xl font-bold text-chalk">
          {formattedToday}
        </h2>
      </div>

      {pendingRequestsCount > 0 ? (
        <div className="flex items-center justify-between rounded-xl border border-warning/40 bg-surface p-4 shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20 text-warning">
              <Inbox className="h-5 w-5" />
            </div>
            <div>
              <strong className="block text-sm font-bold text-chalk">
                Waxaa jira {pendingRequestsCount} codsi oo cusub
              </strong>
              <span className="text-xs text-chalk-dim">
                Fasax, Cudurdaar, iyo Ku-biirid
              </span>
            </div>
          </div>
          <Button
            variant="secondary"
            className="text-xs py-1.5 px-3"
            onClick={() => onNavigateToTab('requests')}
          >
            Eeg Codsiyada
          </Button>
        </div>
      ) : null}

      <TicketCard>
        <SectionTitle eyebrow="XAADIRISKA MAANTA" as="h3">
          Koobka Xaadiriska Maanta
        </SectionTitle>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => setActiveListModal('xadir')}
            className="flex flex-col items-center justify-center rounded-lg border border-success/30 bg-surface-raised p-3 text-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-success">
              <CheckCircle className="h-3.5 w-3.5" />
              Xadir
            </span>
            <strong className="font-display text-2xl font-bold text-chalk">
              {attendanceCounts.xadir}
            </strong>
            <span className="text-[0.6875rem] text-chalk-dim">
              Guji si aad u aragto
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveListModal('maqan')}
            className="flex flex-col items-center justify-center rounded-lg border border-danger/30 bg-surface-raised p-3 text-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-danger">
              <XCircle className="h-3.5 w-3.5" />
              Maqan
            </span>
            <strong className="font-display text-2xl font-bold text-chalk">
              {attendanceCounts.maqan}
            </strong>
            <span className="text-[0.6875rem] text-chalk-dim">
              Guji si aad u aragto
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveListModal('daahay')}
            className="flex flex-col items-center justify-center rounded-lg border border-warning/30 bg-surface-raised p-3 text-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-warning">
              <Clock className="h-3.5 w-3.5" />
              Daahay
            </span>
            <strong className="font-display text-2xl font-bold text-chalk">
              {attendanceCounts.daahay}
            </strong>
            <span className="text-[0.6875rem] text-chalk-dim">
              Guji si aad u aragto
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveListModal('unrecorded')}
            className="flex flex-col items-center justify-center rounded-lg border border-club-border bg-surface-raised p-3 text-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-chalk-dim">
              <AlertCircle className="h-3.5 w-3.5" />
              Aan La Qaadin
            </span>
            <strong className="font-display text-2xl font-bold text-chalk">
              {attendanceCounts.unrecorded}
            </strong>
            <span className="text-[0.6875rem] text-chalk-dim">
              Guji si aad u aragto
            </span>
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="primary"
            className="text-xs py-2 px-4"
            onClick={() => onNavigateToTab('attendance')}
          >
            Qaad Xaadiriska Maanta
          </Button>
        </div>
      </TicketCard>

      <div>
        <SectionTitle eyebrow="NATIIJADA BISHA" as="h3">
          Wadarta Bishan ({currentMonth})
        </SectionTitle>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <StatTile
            label="Goolasha Kooxda"
            value={monthTotals.goals}
            detail="Bishan"
          />
          <StatTile
            label="Caawinta (Assists)"
            value={monthTotals.assists}
            detail="Bishan"
          />
          <StatTile
            label="Qaladaadka (Errors)"
            value={monthTotals.errors}
            detail="Bishan"
          />
        </div>
      </div>

      <TicketCard>
        <SectionTitle eyebrow="DHAQDHAQAAQA SOO GALITAANKA" as="h3">
          Soo Galitaankii Ugu Dambeeyay
        </SectionTitle>

        {recentLogins.length === 0 ? (
          <p className="text-xs text-chalk-dim my-3">
            Weli ma jiraan xog soo galitaan.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-club-border">
            {recentLogins.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-raised text-gold">
                    {item.role === 'admin' ? (
                      <Shield className="h-3.5 w-3.5" />
                    ) : (
                      <User className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <strong className="text-sm font-semibold text-chalk">
                    {item.name}
                  </strong>
                </div>
                <span className="text-xs text-chalk-dim">{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </TicketCard>

      <Dialog
        open={Boolean(activeListModal)}
        onClose={() => setActiveListModal(null)}
        title={
          activeListModal === 'xadir'
            ? 'Ciyaartooyda Xadirka ah Maanta'
            : activeListModal === 'maqan'
              ? 'Ciyaartooyda Maqan Maanta'
              : activeListModal === 'daahay'
                ? 'Ciyaartooyda Daahay Maanta'
                : 'Ciyaartooyda Aan Xaadiriska Loo Qaadin'
        }
      >
        <div className="max-h-72 overflow-y-auto space-y-2">
          {(activeListModal ? sampleLists[activeListModal] : []).length ===
          0 ? (
            <p className="text-xs text-chalk-dim text-center py-4">
              Liiskan wax xog ah kuma jiraan maanta.
            </p>
          ) : (
            (activeListModal ? sampleLists[activeListModal] : []).map(
              (player: any) => (
                <div
                  key={player.id || player.playerId}
                  className="flex items-center justify-between rounded-lg border border-club-border bg-surface-raised p-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pitch-deep text-xs font-bold text-gold">
                      {player.number || player.jerseyNumber || '#'}
                    </span>
                    <div>
                      <strong className="block text-sm text-chalk">
                        {player.name}
                      </strong>
                      <span className="text-xs text-chalk-dim">
                        {player.position}
                      </span>
                    </div>
                  </div>
                  {player.reason ? (
                    <span className="text-xs text-gold font-medium">
                      {player.reason}
                    </span>
                  ) : null}
                </div>
              ),
            )
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setActiveListModal(null)}>
            Xir
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
