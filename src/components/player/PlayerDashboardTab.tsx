import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Pause,
  Play,
  RefreshCw,
  Volume2,
  XCircle,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import {
  formatSomaliDate,
  getCurrentMonthKey,
  getTodayDateString,
} from '../../lib/dates'
import { getPlayerDashboardSummaryFn } from '../../server/api'
import { Button, SectionTitle, StatTile, StatusBadge, TicketCard } from '../ui'

export function PlayerDashboardTab({
  onNavigateToTab,
}: {
  onNavigateToTab: (tab: any) => void
}) {
  const { user, token } = useAuth()
  const today = getTodayDateString()
  const formattedToday = formatSomaliDate(today)
  const currentMonth = getCurrentMonthKey()

  const [dashboard, setDashboard] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const loadDashboard = useCallback(() => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    getPlayerDashboardSummaryFn({ data: { sessionToken: token } })
      .then((data) => {
        setDashboard(data)
      })
      .catch((err: any) => {
        setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta xogtaada')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [token])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const myTodayStatus = dashboard?.myTodayStatus ?? null
  const myTodayReason = dashboard?.myTodayReason ?? null
  const stats = dashboard?.stats ?? {
    goals: 0,
    assists: 0,
    errors: 0,
    xadirCount: 0,
    maqanCount: 0,
    daahayCount: 0,
  }
  const announcement =
    dashboard?.announcement ??
    'Kusoo dhowaada Best Official App. La soco dhammaan ogeysiisyada kooxda.'
  const announcementAudioPath =
    dashboard?.announcementAudioPath ?? dashboard?.announcementAudio ?? null
  const leaveUsedThisMonth = dashboard?.leaveUsedThisMonth ?? 0
  const leaveMaxPerMonth = dashboard?.leaveMaxPerMonth ?? 3

  const handleToggleVoice = () => {
    if (!audioRef.current) return
    if (isPlayingAudio) {
      audioRef.current.pause()
      setIsPlayingAudio(false)
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => setIsPlayingAudio(false))
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-club-border bg-surface text-gold">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Soo dejinaya xogtaada...</span>
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
        <span className="text-xs font-semibold text-gold">
          Ku soo dhowow, {user?.name || 'Ciyaartoy'}!
        </span>
      </div>

      <TicketCard className="border-gold/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gold">
            <Bell className="h-4 w-4" />
            <SectionTitle eyebrow="OGEYSIISKA MACALLINKA" as="h3">
              Ogeysiiska Kooxda
            </SectionTitle>
          </div>

          {announcementAudioPath ? (
            <Button
              variant="secondary"
              className="h-8 px-2.5 text-xs gap-1.5 text-gold border-gold/40 hover:bg-gold/20"
              onClick={handleToggleVoice}
            >
              {isPlayingAudio ? (
                <Pause className="h-3.5 w-3.5 text-gold" />
              ) : (
                <Play className="h-3.5 w-3.5 text-gold" />
              )}
              <span>{isPlayingAudio ? 'Jooji Codka' : 'Dhageyso Codka'}</span>
            </Button>
          ) : (
            <span className="flex items-center gap-1 text-[0.6875rem] text-chalk-dim">
              <Volume2 className="h-3.5 w-3.5" />
              <span>Cod ma jiro</span>
            </span>
          )}
        </div>

        <div className="rounded-lg border border-club-border bg-pitch-deep p-3 text-sm font-medium leading-relaxed text-chalk">
          <p className="m-0">{announcement}</p>
        </div>

        {announcementAudioPath ? (
          <audio
            ref={audioRef}
            src={announcementAudioPath}
            onEnded={() => setIsPlayingAudio(false)}
            onPause={() => setIsPlayingAudio(false)}
            onPlay={() => setIsPlayingAudio(true)}
            className="hidden"
          />
        ) : null}
      </TicketCard>

      <TicketCard className="p-4 space-y-3">
        <SectionTitle eyebrow="XAALADDAADA MAANTA" as="h3">
          Xaadiriskaaga Maanta
        </SectionTitle>

        <div className="flex items-center justify-between rounded-lg border border-club-border bg-surface-raised p-3">
          <div className="flex items-center gap-3">
            {myTodayStatus === 'xadir' ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20 text-success">
                <CheckCircle className="h-6 w-6" />
              </div>
            ) : myTodayStatus === 'maqan' ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/20 text-danger">
                <XCircle className="h-6 w-6" />
              </div>
            ) : myTodayStatus === 'daahay' ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/20 text-warning">
                <Clock className="h-6 w-6" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-chalk-dim">
                <AlertCircle className="h-6 w-6" />
              </div>
            )}

            <div>
              <strong className="block text-base font-bold text-chalk capitalize">
                {myTodayStatus
                  ? `Waad ${myTodayStatus} Tahay`
                  : 'Weli Lama Qaadin'}
              </strong>
              {myTodayReason ? (
                <span className="text-xs text-gold">
                  Sabab: {myTodayReason}
                </span>
              ) : (
                <span className="text-xs text-chalk-dim">
                  {myTodayStatus === 'xadir'
                    ? 'Waad ku mahadsantahay imaatinka'
                    : 'Xaadiriska tababarka maanta'}
                </span>
              )}
            </div>
          </div>

          <StatusBadge
            tone={
              myTodayStatus === 'xadir'
                ? 'success'
                : myTodayStatus === 'maqan'
                  ? 'danger'
                  : myTodayStatus === 'daahay'
                    ? 'warning'
                    : 'neutral'
            }
            className="capitalize text-xs font-bold"
          >
            {myTodayStatus ?? 'Haray'}
          </StatusBadge>
        </div>

        {myTodayStatus !== 'xadir' ? (
          <div className="flex justify-end pt-1">
            <Button
              variant="secondary"
              className="text-xs py-1.5 px-3"
              onClick={() => onNavigateToTab('attendance')}
            >
              Geli Cudurdaar
            </Button>
          </div>
        ) : null}
      </TicketCard>

      <div>
        <SectionTitle eyebrow="NATIIJADAADA BISHA" as="h3">
          Xogtaada Bishan ({currentMonth})
        </SectionTitle>

        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <StatTile label="Goolashaada" value={stats.goals} detail="Bishan" />
          <StatTile label="Caawintaada" value={stats.assists} detail="Bishan" />
          <StatTile
            label="Qaladaadkaaga"
            value={stats.errors}
            detail="Bishan"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TicketCard className="p-3.5 text-center">
          <span className="block text-[0.6875rem] font-bold uppercase text-gold">
            Xaadiriska Bishan
          </span>
          <strong className="font-display text-2xl font-bold text-chalk">
            {stats.xadirCount}
          </strong>
          <span className="text-[0.625rem] text-success">
            Kulamadii aad timid
          </span>
        </TicketCard>

        <TicketCard className="p-3.5 text-center">
          <span className="block text-[0.6875rem] font-bold uppercase text-gold">
            Fasaxa Bishan
          </span>
          <strong className="font-display text-2xl font-bold text-chalk">
            {leaveUsedThisMonth} / {leaveMaxPerMonth}
          </strong>
          <span className="text-[0.625rem] text-chalk-dim">
            {leaveMaxPerMonth - leaveUsedThisMonth} maalmood ayaa kuu haray
          </span>
        </TicketCard>
      </div>
    </div>
  )
}
