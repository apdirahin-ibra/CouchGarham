import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Award,
  Bell,
  Calendar,
  Camera,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  History,
  Info,
  Lightbulb,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  User,
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
import {
  getPlayerDashboardSummaryFn,
  submitExcuseRequestFn,
} from '../../server/api'
import {
  Button,
  Dialog,
  SectionTitle,
  StarRating,
  StatTile,
  StatusBadge,
  TicketCard,
} from '../ui'
import { useToast } from '../ui/toast-context'
import { PlayerProfileModal } from './PlayerProfileModal'

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
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showAttendanceDetailsModal, setShowAttendanceDetailsModal] =
    useState(false)
  const { notify } = useToast()
  const [isExcuseModalOpen, setIsExcuseModalOpen] = useState(false)
  const [excuseType, setExcuseType] = useState<'maqan' | 'daahay'>('maqan')
  const [excuseReason, setExcuseReason] = useState('')
  const [isSubmittingExcuse, setIsSubmittingExcuse] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleSubmitExcuse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !excuseReason.trim()) return
    setIsSubmittingExcuse(true)
    try {
      await submitExcuseRequestFn({
        data: {
          sessionToken: token,
          requestDate: today,
          attendanceType: excuseType,
          reason: excuseReason.trim(),
        },
      })
      notify(
        'Cudurdaarkaaga si guul leh ayaa loo gudbiyay, macallinka ayaa eegi doona!',
        'success',
      )
      setIsExcuseModalOpen(false)
      setExcuseReason('')
      loadDashboard()
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay gudbinta cudurdaarka', 'danger')
    } finally {
      setIsSubmittingExcuse(false)
    }
  }

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
  const monthAttendanceRecords: {
    attendanceDate: string
    status: 'xadir' | 'maqan' | 'daahay' | null
    reason: string | null
  }[] = dashboard?.monthAttendanceRecords ?? []
  const feeStatus = dashboard?.feeStatus ?? null

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
      {/* Header Pass Card */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gold/40 bg-gradient-to-r from-surface-raised via-pitch-deep to-surface-raised p-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold border border-gold/40 font-display text-lg font-bold shadow-inner">
            #{dashboard?.player?.jerseyNumber ?? '⚽'}
          </div>
          <div>
            <div className="flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-widest text-gold">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedToday}</span>
            </div>
            <h2 className="mt-0.5 font-display text-xl sm:text-2xl font-bold text-chalk">
              Ku soo dhowow, {user?.name || 'Ciyaartoy'}!
            </h2>
            <span className="text-xs text-chalk-dim">
              Best Official Football Club • Xubin Firfircoon
            </span>
          </div>
        </div>

        <Button
          variant="secondary"
          className="self-start sm:self-auto text-xs py-2 px-3.5 gap-1.5 border-gold/40 text-gold hover:bg-gold/20 font-bold"
          onClick={() => setShowProfileModal(true)}
        >
          <User className="h-3.5 w-3.5" />
          <span>Profile & Settings</span>
        </Button>
      </div>

      {/* Feed-ka Sare ee la Shuushuteynayo (Featured Stories & Highlights Carousel) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-gold">
            <Sparkles className="h-4 w-4" />
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider">
              Xogaha Degdegga ah & Fariimaha
            </span>
          </div>
          <span className="text-[0.625rem] text-chalk-dim italic">
            Dhanka bidix u shuushutee ➔
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-1 px-1">
          {/* Card 1: Wada Hadalka Kooxda */}
          <div
            onClick={() => onNavigateToTab('chat')}
            className="shrink-0 w-64 sm:w-72 snap-start rounded-2xl border border-gold/30 bg-gradient-to-br from-surface-raised via-pitch-deep to-surface p-4 shadow-md hover:border-gold transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gold/5 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-gold">
                  <MessageSquare className="h-4 w-4" />
                  <span>Wadahadalka Kooxda</span>
                </span>
                <span className="text-[0.625rem] text-gold bg-gold/15 px-2 py-0.5 rounded-full font-bold">
                  Fariin
                </span>
              </div>
              <p className="text-xs text-chalk line-clamp-2 italic font-medium leading-relaxed">
                "{dashboard?.latestChatMessage?.text || 'Kusoo dhowaada wadahadalka kooxda...'}"
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-club-border/60 flex items-center justify-between text-[0.6875rem]">
              <span className="text-chalk-dim truncate font-semibold">
                👤 {dashboard?.latestChatMessage?.authorName || 'Kooxda'}
              </span>
              <span className="text-gold font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                <span>Wadahadal</span>
                <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Card 2: Waanada & Dardaaranka */}
          <div
            onClick={() => onNavigateToTab('tips')}
            className="shrink-0 w-64 sm:w-72 snap-start rounded-2xl border border-gold/30 bg-gradient-to-br from-surface-raised via-pitch-deep to-surface p-4 shadow-md hover:border-gold transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gold/5 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-gold">
                  <Lightbulb className="h-4 w-4" />
                  <span>Waanada Macallinka</span>
                </span>
                <span className="text-[0.625rem] text-gold bg-gold/15 px-2 py-0.5 rounded-full font-bold">
                  Talada Maanta
                </span>
              </div>
              <p className="text-xs text-chalk line-clamp-2 font-medium leading-relaxed">
                "{dashboard?.topTip?.text || 'Joogteynta tababarka iyo anshaxa waa furaha guusha.'}"
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-club-border/60 flex items-center justify-between text-[0.6875rem]">
              <span className="text-chalk-dim font-semibold">
                💡 100 Talo Kooxeed
              </span>
              <span className="text-gold font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                <span>Eeg Waano</span>
                <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Card 3: Sharciyada & Xeerka Dahabiga ah */}
          <div
            onClick={() => onNavigateToTab('rules')}
            className="shrink-0 w-64 sm:w-72 snap-start rounded-2xl border border-gold/30 bg-gradient-to-br from-surface-raised via-pitch-deep to-surface p-4 shadow-md hover:border-gold transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gold/5 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-gold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Xeerka Kooxda</span>
                </span>
                <span className="text-[0.625rem] text-gold bg-gold/15 px-2 py-0.5 rounded-full font-bold">
                  Qaanuunka
                </span>
              </div>
              <p className="text-xs text-chalk line-clamp-2 font-medium leading-relaxed">
                "{dashboard?.keyRule || 'Ixtiraamka waqtiga, macallinka, iyo asxaabta kooxda waa waajib muqadas ah.'}"
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-club-border/60 flex items-center justify-between text-[0.6875rem]">
              <span className="text-chalk-dim font-semibold">
                📜 Shuruucda Naadiga
              </span>
              <span className="text-gold font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                <span>Akhri Xeerka</span>
                <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Card 4: Sawirrada Garoonka */}
          <div
            onClick={() => onNavigateToTab('gallery')}
            className="shrink-0 w-64 sm:w-72 snap-start rounded-2xl border border-gold/30 bg-gradient-to-br from-surface-raised via-pitch-deep to-surface p-4 shadow-md hover:border-gold transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gold/5 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-gold">
                  <Camera className="h-4 w-4" />
                  <span>Sawirrada Kooxda</span>
                </span>
                <span className="text-[0.625rem] text-gold bg-gold/15 px-2 py-0.5 rounded-full font-bold">
                  Garoonka
                </span>
              </div>
              <p className="text-xs text-chalk line-clamp-2 font-medium leading-relaxed">
                {dashboard?.latestPhoto?.caption || 'Muuqaallada iyo sawirrada tababarrada naadiga.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-club-border/60 flex items-center justify-between text-[0.6875rem]">
              <span className="text-chalk-dim font-semibold">
                📸 Sawirrada Naadiga
              </span>
              <span className="text-gold font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                <span>Gal Sawirrada</span>
                <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ogeysiiska Kooxda */}
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
              className="h-8 px-2.5 text-xs gap-1.5 self-start sm:self-auto text-gold border-gold/40 hover:bg-gold/20 font-bold"
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

      {/* Xaadiriskaaga Maanta Card */}
      <TicketCard className="p-4 space-y-3.5 border-gold/30">
        <div className="flex items-center justify-between">
          <SectionTitle eyebrow="XAALADDAADA MAANTA" as="h3">
            Xaadiriskaaga Maanta
          </SectionTitle>
          <span className="text-xs text-chalk-dim">{formattedToday}</span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-club-border bg-surface-raised p-3.5">
          <div className="flex items-center gap-3">
            {myTodayStatus === 'xadir' ? (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/20 text-success border border-success/30">
                <CheckCircle className="h-6 w-6" />
              </div>
            ) : myTodayReason ? (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/40">
                <ShieldCheck className="h-6 w-6" />
              </div>
            ) : myTodayStatus === 'maqan' ? (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger/20 text-danger border border-danger/30">
                <XCircle className="h-6 w-6" />
              </div>
            ) : myTodayStatus === 'daahay' ? (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/20 text-warning border border-warning/30">
                <Clock className="h-6 w-6" />
              </div>
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-chalk-dim border border-club-border">
                <AlertCircle className="h-6 w-6" />
              </div>
            )}

            <div>
              <strong className="block text-base font-bold text-chalk">
                {myTodayStatus === 'xadir'
                  ? 'Xaadir (Waad Joogtay) ✅'
                  : myTodayReason
                    ? `${myTodayStatus === 'daahay' ? 'Daahay' : 'Maqan'} (Cudurdaartay) 🛡️`
                    : myTodayStatus === 'maqan'
                      ? 'Maqan (Kama Qaybgelin) ❌'
                      : myTodayStatus === 'daahay'
                        ? 'Soo Daahay ⏱️'
                        : 'Weli Lama Qaadin ⚪'}
              </strong>
              {myTodayReason ? (
                <span className="text-xs text-gold block mt-0.5 font-semibold">
                  🛡️ Cudurdaar: {myTodayReason}
                </span>
              ) : (
                <span className="text-xs text-chalk-dim block mt-0.5">
                  {myTodayStatus === 'xadir'
                    ? 'Waad ku mahadsantahay imaatinka tababarka'
                    : myTodayStatus === 'maqan'
                      ? 'Haddii aad cudurdaar leedahay, fadlan geli sababta hoose'
                      : 'Xaadiriska tababarka iyo kulanka maanta'}
                </span>
              )}
            </div>
          </div>

          <StatusBadge
            tone={
              myTodayStatus === 'xadir'
                ? 'success'
                : myTodayReason
                  ? 'warning'
                  : myTodayStatus === 'maqan'
                    ? 'danger'
                    : myTodayStatus === 'daahay'
                      ? 'warning'
                      : 'neutral'
            }
            className="text-xs font-bold py-1 px-2.5"
          >
            {myTodayStatus === 'xadir'
              ? 'Xaadir'
              : myTodayReason
                ? 'Cudurdaartay'
                : myTodayStatus === 'maqan'
                  ? 'Maqan'
                  : myTodayStatus === 'daahay'
                    ? 'Daahay'
                    : 'Aan La Qaadin'}
          </StatusBadge>
        </div>

        {myTodayStatus !== 'xadir' ? (
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-club-border/60">
            <Button
              variant="secondary"
              className="text-xs py-1.5 px-3 gap-1.5 border-gold/40 text-gold hover:bg-gold/15 font-bold"
              onClick={() => setIsExcuseModalOpen(true)}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Cudurdaar Geli</span>
            </Button>
            <Button
              variant="secondary"
              className="text-xs py-1.5 px-3 gap-1.5 border-club-border text-chalk hover:bg-surface-raised"
              onClick={() => onNavigateToTab('leaves')}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Codso Fasax</span>
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

      {/* Xaaladdaada Lacagta Bishan */}
      <TicketCard className="p-4 space-y-3.5 border-gold/30">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <SectionTitle eyebrow="LACAGTA BISHAN" as="h3">
                Xaaladdaada Lacagta Bishan
              </SectionTitle>
              <span className="text-xs text-chalk-dim">
                Bishan: {currentMonth} • Khidmadda xisaabta naadiga
              </span>
            </div>
          </div>

          <StatusBadge
            tone={feeStatus?.status === 'paid' ? 'success' : 'danger'}
            className="text-xs font-bold py-1 px-3 self-start sm:self-auto"
          >
            {feeStatus?.status === 'paid'
              ? 'Wuu Dhiibay ✅'
              : `Waa Lagu Leeyahay: $${(feeStatus?.debt ?? 0.5).toFixed(2)} ❌`}
          </StatusBadge>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-center pt-1">
          <div className="rounded-xl border border-club-border bg-pitch-deep p-3">
            <span className="block text-[0.6875rem] text-chalk-dim uppercase font-bold">
              Lagaa rabo
            </span>
            <strong className="text-base sm:text-lg font-bold text-chalk">
              ${(feeStatus?.expectedAmount ?? 0.5).toFixed(2)}
            </strong>
          </div>
          <div className="rounded-xl border border-success/30 bg-pitch-deep p-3">
            <span className="block text-[0.6875rem] text-success uppercase font-bold">
              Aad dhiibtay
            </span>
            <strong className="text-base sm:text-lg font-bold text-success">
              ${(feeStatus?.paidAmount ?? 0).toFixed(2)}
            </strong>
          </div>
          <div className="rounded-xl border border-club-border bg-pitch-deep p-3">
            <span className="block text-[0.6875rem] text-chalk-dim uppercase font-bold">
              Lagu leeyahay
            </span>
            <strong
              className={`text-base sm:text-lg font-bold ${
                (feeStatus?.debt ?? 0.5) > 0 ? 'text-danger' : 'text-gold'
              }`}
            >
              ${(feeStatus?.debt ?? 0.5).toFixed(2)}
            </strong>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => onNavigateToTab('finance')}
            className="flex items-center gap-1 text-xs font-bold text-gold hover:underline cursor-pointer"
          >
            <span>Eeg Diiwaanka Xisaabta Guud</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
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
        <TicketCard
          className="p-3 sm:p-4 text-center flex flex-col items-center justify-center cursor-pointer hover:border-gold transition-all group"
          onClick={() => setShowAttendanceDetailsModal(true)}
          title="Guji si aad u aragto maalmaha aad timid iyo kuwa aad maqnayd"
        >
          <span className="block text-[0.6875rem] font-bold uppercase tracking-wider text-gold group-hover:underline">
            Xaadiriska Bishan
          </span>
          <strong className="block my-1 font-display text-2xl sm:text-3xl font-bold text-chalk leading-none">
            {stats.xadirCount}
          </strong>
          <span className="block text-[0.6875rem] text-success font-semibold leading-tight flex items-center gap-1 justify-center">
            <span>Kulamadii aad timid</span>
            <Info className="h-3 w-3 text-gold" />
          </span>
          <span className="text-[0.625rem] text-chalk-dim mt-1">
            Guji si aad u aragto diiwaanka
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

      {/* Modal Diiwaanka Xaadiriska Bishan */}
      <Dialog
        open={showAttendanceDetailsModal}
        onClose={() => setShowAttendanceDetailsModal(false)}
        title={`Diiwaanka Xaadiriskaaga Bishan (${currentMonth})`}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-success/30 bg-success/10 p-2.5">
              <span className="block text-[0.625rem] font-bold uppercase text-success">
                Xaadir (Timid)
              </span>
              <strong className="font-display text-xl font-bold text-success">
                {stats.xadirCount}
              </strong>
            </div>
            <div className="rounded-lg border border-danger/30 bg-danger/10 p-2.5">
              <span className="block text-[0.625rem] font-bold uppercase text-danger">
                Maqan
              </span>
              <strong className="font-display text-xl font-bold text-danger">
                {stats.maqanCount}
              </strong>
            </div>
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-2.5">
              <span className="block text-[0.625rem] font-bold uppercase text-warning">
                Daahay
              </span>
              <strong className="font-display text-xl font-bold text-warning">
                {stats.daahayCount}
              </strong>
            </div>
          </div>

          <div className="space-y-2">
            <SectionTitle eyebrow="TAARIIKHAHA KULAMADA" as="h3">
              Maalmihii la tababartay / ciyaaray
            </SectionTitle>

            {monthAttendanceRecords.length === 0 ? (
              <p className="text-xs text-chalk-dim text-center py-4">
                Weli ma jiraan kulamo la diiwaangeliyay bishan.
              </p>
            ) : (
              <div className="divide-y divide-club-border rounded-xl border border-club-border bg-surface-raised overflow-hidden">
                {monthAttendanceRecords.map((item, idx) => (
                  <div
                    key={`${item.attendanceDate}-${idx}`}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-2.5">
                      {item.status === 'xadir' ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/20 text-success">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      ) : item.status === 'maqan' ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/20 text-danger">
                          <XCircle className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/20 text-warning">
                          <Clock className="h-4 w-4" />
                        </div>
                      )}

                      <div>
                        <strong className="block text-xs font-bold text-chalk">
                          {formatSomaliDate(item.attendanceDate)}
                        </strong>
                        {item.reason ? (
                          <span className="text-[0.6875rem] text-gold">
                            Sabab: {item.reason}
                          </span>
                        ) : (
                          <span className="text-[0.6875rem] text-chalk-dim">
                            {item.status === 'xadir'
                              ? 'Waad joogtay tababarka'
                              : item.status === 'maqan'
                                ? 'Kama qaybgelin tababarka'
                                : 'Waad daahday'}
                          </span>
                        )}
                      </div>
                    </div>

                    <StatusBadge
                      tone={
                        item.status === 'xadir'
                          ? 'success'
                          : item.status === 'maqan'
                            ? 'danger'
                            : 'warning'
                      }
                      className="text-xs capitalize font-bold"
                    >
                      {item.status ?? 'Lama qaadin'}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-club-border">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="text-xs py-1 px-2.5"
                onClick={() => {
                  setShowAttendanceDetailsModal(false)
                  onNavigateToTab('attendance')
                }}
              >
                Geli Cudurdaar
              </Button>
              <Button
                variant="secondary"
                className="text-xs py-1 px-2.5 border-gold/40 text-gold hover:bg-gold/10"
                onClick={() => {
                  setShowAttendanceDetailsModal(false)
                  onNavigateToTab('leaves')
                }}
              >
                Codso Fasax
              </Button>
            </div>
            <Button
              variant="ghost"
              className="text-xs"
              onClick={() => setShowAttendanceDetailsModal(false)}
            >
              Xir
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Player Profile & Settings Modal */}
      <PlayerProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onNavigateToTab={onNavigateToTab}
      />

      {/* Cudurdaar Geli Modal */}
      <Dialog
        open={isExcuseModalOpen}
        onClose={() => setIsExcuseModalOpen(false)}
        title="Geli Cudurdaar Maanta"
      >
        <form onSubmit={handleSubmitExcuse} className="space-y-4">
          <p className="text-xs text-chalk-dim">
            Fadlan u sheeg macallinka sababta aad ku maqantahay ama aad ugu daahday tababarka/kulanka maanta ({formattedToday}).
          </p>

          <div>
            <label className="block text-xs font-semibold text-chalk-dim mb-1.5">
              Nooca Cudurdaarka
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExcuseType('maqan')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  excuseType === 'maqan'
                    ? 'border-danger/60 bg-danger/15 text-danger'
                    : 'border-club-border bg-surface text-chalk-dim hover:bg-surface-raised'
                }`}
              >
                <XCircle className="h-4 w-4" />
                <span>Waan Maqanahay</span>
              </button>
              <button
                type="button"
                onClick={() => setExcuseType('daahay')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  excuseType === 'daahay'
                    ? 'border-warning/60 bg-warning/15 text-warning'
                    : 'border-club-border bg-surface text-chalk-dim hover:bg-surface-raised'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>Waan Daahayaa</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="excuse-reason" className="block text-xs font-semibold text-chalk-dim mb-1.5">
              Sababta Cudurdaarka <span className="text-danger">*</span>
            </label>
            <textarea
              id="excuse-reason"
              required
              rows={3}
              value={excuseReason}
              onChange={(e) => setExcuseReason(e.target.value)}
              placeholder="Tusaale: Xanuun degdeg ah, howlo shaqo, ama cudurdaar qoys..."
              className="w-full rounded-xl border border-club-border bg-surface p-3 text-xs text-chalk placeholder:text-chalk-dim/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-club-border">
            <Button
              type="button"
              variant="ghost"
              className="text-xs"
              onClick={() => setIsExcuseModalOpen(false)}
            >
              Ka Noqo
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="text-xs font-bold"
              disabled={isSubmittingExcuse || !excuseReason.trim()}
            >
              {isSubmittingExcuse ? 'Waa la dirayaa...' : 'Gudbi Cudurdaarka'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
