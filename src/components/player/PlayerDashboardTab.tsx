import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Award,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  History,
  Pause,
  Play,
  RefreshCw,
  Star,
  Volume2,
  XCircle,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import {
  formatSomaliDate,
  getCurrentMonthKey,
  getTodayDateString,
} from '../../lib/dates'
import {
  computeOverallRatingScore,
  PLAYER_RATING_CRITERIA,
} from '../../lib/ratings'
import { getPlayerDashboardSummaryFn } from '../../server/api'
import {
  Button,
  Dialog,
  SectionTitle,
  StarRating,
  StatTile,
  StatusBadge,
  TicketCard,
} from '../ui'

const CACHED_PLAYER_DASHBOARD_KEY = 'best_official_cached_player_dashboard'

function getInitialPlayerDashboard(): any {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(CACHED_PLAYER_DASHBOARD_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore storage parse failure
  }
  return null
}

export function PlayerDashboardTab({
  onNavigateToTab,
}: {
  onNavigateToTab: (tab: any) => void
}) {
  const { token, user } = useAuth()
  const today = getTodayDateString()
  const formattedToday = formatSomaliDate(today)
  const currentMonth = getCurrentMonthKey()

  const initialDashboard = getInitialPlayerDashboard()
  const [dashboard, setDashboard] = useState<any>(initialDashboard)
  const [isLoading, setIsLoading] = useState(!initialDashboard)
  const [loadError, setLoadError] = useState('')
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [showRatingsHistoryModal, setShowRatingsHistoryModal] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const loadDashboard = useCallback(() => {
    if (!token) return
    if (!dashboard) {
      setIsLoading(true)
    }
    setLoadError('')
    getPlayerDashboardSummaryFn({ data: { sessionToken: token } })
      .then((data) => {
        setDashboard(data)
        if (typeof window !== 'undefined' && data) {
          window.sessionStorage.setItem(
            CACHED_PLAYER_DASHBOARD_KEY,
            JSON.stringify(data),
          )
        }
      })
      .catch((err: any) => {
        if (!dashboard) {
          setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta xogtaada')
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [token, dashboard])

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
  const latestRating = dashboard?.latestRating ?? null
  const ratingAverage = dashboard?.ratingAverage ?? null
  const totalRatingsCount = dashboard?.totalRatingsCount ?? 0
  const ratingHistoryList = dashboard?.ratingHistoryList ?? []
  const latestScore = latestRating
    ? computeOverallRatingScore(latestRating)
    : null

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

      <TicketCard className="border-gold/40 p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-gold">
            <Bell className="h-4 w-4 shrink-0" />
            <SectionTitle eyebrow="OGEYSIISKA MACALLINKA" as="h3">
              Ogeysiiska Kooxda
            </SectionTitle>
          </div>

          {announcementAudioPath ? (
            <Button
              variant="secondary"
              className="h-8 px-2.5 text-xs gap-1.5 self-start sm:self-auto text-gold border-gold/40 hover:bg-gold/20"
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
            <span className="flex items-center gap-1 text-[0.6875rem] text-chalk-dim self-start sm:self-auto">
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

      {/* Qiimeynta Ciyaartii Ugu Dambeysay */}
      <TicketCard className="p-4 space-y-4 border-gold/40">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/30">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <SectionTitle eyebrow="QIIMEYNTA CIYAARTA" as="h3">
                Qiimeyntaadii Ciyaartii Ugu Dambeysay
              </SectionTitle>
              {latestRating ? (
                <span className="text-xs text-chalk-dim">
                  Taariikhda: {formatSomaliDate(latestRating.matchDate)}
                  {latestRating.matchTitle
                    ? ` — ${latestRating.matchTitle}`
                    : ''}
                </span>
              ) : null}
            </div>
          </div>

          {latestScore ? (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="text-right">
                <div className="flex items-center gap-1 font-display text-lg font-bold text-gold">
                  <Star className="h-4 w-4 fill-gold text-gold" />
                  <span>{latestScore.formatted}</span>
                  <span className="text-xs text-chalk-dim font-normal">
                    / 5.0
                  </span>
                </div>
                <span className="inline-block rounded px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider bg-gold/20 text-gold border border-gold/30">
                  {latestScore.badge}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {latestRating ? (
          <div className="space-y-3 pt-1">
            {latestRating.coachNotes ? (
              <div className="rounded-lg border border-club-border bg-pitch-deep p-3 text-xs leading-relaxed">
                <span className="block font-bold text-gold mb-1 uppercase tracking-wider text-[0.625rem]">
                  Faallada Macallinka:
                </span>
                <p className="m-0 italic text-chalk">
                  "{latestRating.coachNotes}"
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {PLAYER_RATING_CRITERIA.map((criterion) => {
                const val = (latestRating as any)[criterion.key] ?? 0
                return (
                  <div
                    key={criterion.key}
                    className="flex items-center justify-between rounded-lg border border-club-border/60 bg-surface-raised px-3 py-2"
                  >
                    <div className="pr-2 truncate">
                      <span className="text-xs font-semibold text-chalk">
                        {criterion.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StarRating value={val} readOnly size="sm" />
                      <span className="text-[0.6875rem] font-bold text-gold w-6 text-right">
                        {val}/5
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-club-border/60">
              <div className="text-xs text-chalk-dim">
                <span>Celceliska Guud: </span>
                <strong className="text-gold font-bold">
                  ⭐ {ratingAverage || latestScore?.formatted || '0.0'} / 5.0
                </strong>
                <span className="text-[0.6875rem] text-chalk-dim ml-1">
                  ({totalRatingsCount} kulan la qiimeeyay)
                </span>
              </div>

              {ratingHistoryList.length > 0 ? (
                <Button
                  variant="secondary"
                  className="text-xs py-1.5 px-3 h-8 gap-1.5 self-start sm:self-auto"
                  onClick={() => setShowRatingsHistoryModal(true)}
                >
                  <History className="h-3.5 w-3.5 text-gold" />
                  <span>Taariikhda Qiimeynta ({totalRatingsCount})</span>
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-club-border bg-pitch-deep p-4 text-center">
            <Star className="h-7 w-7 text-gold/30 mx-auto mb-2" />
            <p className="text-sm font-semibold text-chalk mb-1">
              Weli ma jirto qiimeyn kulan
            </p>
            <p className="text-xs text-chalk-dim m-0 max-w-sm mx-auto">
              Macallinka ayaa ku qiimeyn doona ciyaar kasta ka dib marka aad ka
              qayb qaadato kulanka.
            </p>
          </div>
        )}
      </TicketCard>

      <div>
        <SectionTitle eyebrow="NATIIJADAADA BISHA" as="h3">
          Xogtaada Bishan ({currentMonth})
        </SectionTitle>

        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-2.5">
          <StatTile label="Goolal" value={stats.goals} detail="Bishan" />
          <StatTile label="Caawin" value={stats.assists} detail="Bishan" />
          <StatTile label="Qaladaad" value={stats.errors} detail="Bishan" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <TicketCard className="p-3 sm:p-4 text-center flex flex-col items-center justify-center">
          <span className="block text-[0.6875rem] font-bold uppercase tracking-wider text-gold">
            Xaadiriska Bishan
          </span>
          <strong className="block my-1 font-display text-2xl sm:text-3xl font-bold text-chalk leading-none">
            {stats.xadirCount}
          </strong>
          <span className="block text-[0.6875rem] text-success font-semibold leading-tight">
            Kulamadii aad timid
          </span>
        </TicketCard>

        <TicketCard className="p-3 sm:p-4 text-center flex flex-col items-center justify-center">
          <span className="block text-[0.6875rem] font-bold uppercase tracking-wider text-gold">
            Fasaxa Bishan
          </span>
          <strong className="block my-1 font-display text-2xl sm:text-3xl font-bold text-chalk leading-none">
            {leaveUsedThisMonth} / {leaveMaxPerMonth}
          </strong>
          <span className="block text-[0.6875rem] text-chalk-dim font-medium leading-tight">
            {Math.max(0, leaveMaxPerMonth - leaveUsedThisMonth)} maalmood haray
          </span>
        </TicketCard>
      </div>

      {/* Modal Taariikhda Qiimeynta */}
      <Dialog
        open={showRatingsHistoryModal}
        onClose={() => setShowRatingsHistoryModal(false)}
        title="Taariikhda Qiimeynta Kulamada"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {ratingHistoryList.length === 0 ? (
            <p className="text-sm text-chalk-dim text-center py-4">
              Weli ma jiro taariikh qiimeyn oo la diiwaangeliyay.
            </p>
          ) : (
            ratingHistoryList.map((rating: any) => {
              const score = computeOverallRatingScore(rating)
              return (
                <div
                  key={rating.id || rating.matchDate}
                  className="rounded-xl border border-club-border bg-surface-raised p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gold font-bold">
                        {formatSomaliDate(rating.matchDate)}
                      </span>
                      {rating.matchTitle ? (
                        <h4 className="text-sm font-bold text-chalk">
                          {rating.matchTitle}
                        </h4>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gold flex items-center gap-1 justify-end">
                        <Star className="h-4 w-4 fill-gold text-gold" />
                        {score.formatted} / 5.0
                      </span>
                      <span className="text-[0.625rem] text-chalk-dim uppercase font-semibold">
                        {score.badge}
                      </span>
                    </div>
                  </div>

                  {rating.coachNotes ? (
                    <div className="rounded-lg bg-pitch-deep border border-club-border p-2.5 text-xs text-chalk-dim">
                      <strong className="text-gold block mb-1">
                        Faallada Macallinka:
                      </strong>
                      <p className="m-0 italic text-chalk">
                        "{rating.coachNotes}"
                      </p>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-club-border text-xs">
                    {PLAYER_RATING_CRITERIA.map((criterion) => (
                      <div
                        key={criterion.key}
                        className="flex items-center justify-between bg-surface/50 px-2 py-1 rounded"
                      >
                        <span className="text-[0.6875rem] text-chalk truncate">
                          {criterion.label}
                        </span>
                        <span className="text-[0.6875rem] text-gold font-bold ml-1 shrink-0">
                          {(rating as any)[criterion.key] ?? 0}★
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Dialog>
    </div>
  )
}
