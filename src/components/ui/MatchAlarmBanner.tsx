import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  BellRing,
  Calendar,
  Clock,
  Flame,
  MapPin,
  RefreshCw,
  Settings,
  ShieldAlert,
  Volume2,
  VolumeX,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { formatSomaliDate } from '../../lib/dates'
import { setMatchCountdownAlertFn } from '../../server/api'
import type { UpcomingMatchAlert } from '../../server/schedule.server'
import { Button, Dialog } from './index'
import { useToast } from './toast-context'

interface MatchAlarmBannerProps {
  alert: UpcomingMatchAlert | null | undefined
  onNavigateToTab?: (tab: string) => void
}

/**
 * Web Audio API synthesized football whistle / alarm siren sound.
 * Guarantees zero external network dependencies and works on all browsers.
 */
function playAlarmChime() {
  if (typeof window === 'undefined') return
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)

      gain.gain.setValueAtTime(0.2, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + start + duration,
      )

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration)
    }

    // Two-pulse warning chime (High pitch whistle alert)
    playTone(880, 0, 0.25)
    playTone(1174, 0.28, 0.35)
    playTone(880, 0.68, 0.25)
    playTone(1320, 0.95, 0.45)
  } catch (err) {
    console.warn('Audio alarm playback notice:', err)
  }
}

export function MatchAlarmBanner({
  alert,
  onNavigateToTab,
}: MatchAlarmBannerProps) {
  const { user, token } = useAuth()
  const { notify } = useToast()
  const isAdmin = user?.role === 'admin'

  const [currentAlert, setCurrentAlert] = useState<
    UpcomingMatchAlert | null | undefined
  >(alert)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [isAudioActive, setIsAudioActive] = useState(false)
  const [adminCustomInput, setAdminCustomInput] = useState('')
  const [isSavingCountdown, setIsSavingCountdown] = useState(false)
  const intervalRef = useRef<any>(null)

  useEffect(() => {
    setCurrentAlert(alert)
  }, [alert])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const effectiveAlert = currentAlert || alert

  if (!effectiveAlert || !effectiveAlert.hasUpcomingMatch) {
    return null
  }

  const {
    isMatchDay,
    isWithin12Hours,
    isWithin24Hours,
    hoursRemainingText,
    matchTitle,
    opponent,
    timeText,
    place,
    matchDate,
    dayName,
  } = effectiveAlert

  const handleAdminSetCountdown = async (
    mode: 'auto' | 'custom' | 'match_day' | 'urgent_12h' | 'warning_24h',
    customHours?: string,
  ) => {
    if (!token) return
    setIsSavingCountdown(true)
    try {
      const updated = await setMatchCountdownAlertFn({
        data: {
          sessionToken: token,
          mode,
          customHours:
            customHours ?? (mode === 'custom' ? adminCustomInput.trim() : null),
        },
      })
      setCurrentAlert(updated)
      notify(
        mode === 'auto'
          ? 'Digniinta ciyaarta waxaa lagu xiray jadwalka tooska ah!'
          : `Waqtiga ciyaarta waa la cusbooneysiiyay: ${customHours || adminCustomInput || mode}`,
        'success',
      )
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay dejinta waqtiga', 'danger')
    } finally {
      setIsSavingCountdown(false)
    }
  }

  const toggleAlarmSound = () => {
    if (isAudioActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setIsAudioActive(false)
    } else {
      setIsAudioActive(true)
      playAlarmChime()
      // Repeat chime every 4 seconds while active
      intervalRef.current = setInterval(() => {
        playAlarmChime()
      }, 4000)
    }
  }

  // Theme styling based on urgency level
  const isEmergency = isMatchDay || isWithin12Hours

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border-2 transition-all shadow-xl ${
          isEmergency
            ? 'border-danger bg-gradient-to-r from-danger/25 via-pitch-deep to-danger/30 text-chalk'
            : isWithin24Hours
              ? 'border-amber-500/80 bg-gradient-to-r from-amber-500/20 via-pitch-deep to-amber-500/25 text-chalk'
              : 'border-gold/80 bg-gradient-to-r from-gold/20 via-pitch-deep to-gold/25 text-chalk'
        }`}
      >
        {/* Pulsing glow background effect */}
        <div
          className={`absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl pointer-events-none ${
            isEmergency ? 'bg-danger/40 animate-pulse' : 'bg-gold/30'
          }`}
        />

        <div className="relative p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left section: Siren Icon & Alert Text */}
          <div className="flex items-start gap-3 sm:gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-md ${
                isEmergency
                  ? 'bg-danger/25 border-danger/60 text-danger animate-pulse'
                  : isWithin24Hours
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-gold/20 border-gold/50 text-gold'
              }`}
            >
              {isEmergency ? (
                <Flame className="h-6 w-6 animate-bounce" />
              ) : (
                <BellRing className="h-6 w-6" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-black uppercase tracking-wider ${
                    isEmergency
                      ? 'bg-danger text-white animate-pulse'
                      : isWithin24Hours
                        ? 'bg-amber-500 text-pitch-black font-extrabold'
                        : 'bg-gold text-pitch-black font-extrabold'
                  }`}
                >
                  <Bell className="h-3 w-3 inline" />
                  <span>
                    {isMatchDay
                      ? 'DIGNIIN: CIYAARTA MAANTA (0 SAAC)'
                      : isWithin12Hours
                        ? 'DIGNIIN DEGDEG AH: 12 SAAC KA DHIMAN'
                        : isWithin24Hours
                          ? 'DIGNIIN CIYAAR: 24 SAAC KA DHIMAN'
                          : 'DIGNIIN: JADWALKA CIYAARTA SOO SOCOTA'}
                  </span>
                </span>

                <span className="text-xs font-semibold text-chalk-dim flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-gold" />
                  <span>{hoursRemainingText}</span>
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-display font-extrabold text-chalk leading-snug">
                {matchTitle}
              </h3>

              <div className="flex flex-wrap items-center gap-3 text-xs text-chalk-dim">
                <span className="flex items-center gap-1 font-medium text-chalk">
                  <Calendar className="h-3.5 w-3.5 text-gold" />
                  <span>
                    {dayName}{' '}
                    {matchDate ? `(${formatSomaliDate(matchDate)})` : ''}
                  </span>
                </span>

                <span className="flex items-center gap-1 font-medium text-chalk">
                  <Clock className="h-3.5 w-3.5 text-gold" />
                  <span>{timeText}</span>
                </span>

                <span className="flex items-center gap-1 font-medium text-chalk truncate max-w-xs">
                  <MapPin className="h-3.5 w-3.5 text-gold" />
                  <span className="truncate">{place}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right section: Bouncing Button, Settings & Alarm Sound Toggle */}
          <div className="flex items-center gap-2 sm:self-center shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowDetailsModal(true)}
                title="Deji Waqtiga ka Dhiman Ciyaarta (Admin Countdown Settings)"
                className="flex h-11 px-3 items-center justify-center gap-1.5 rounded-xl border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Deji Waqtiga</span>
              </button>
            )}

            {/* Alarm Sound Synthesizer Button */}
            <button
              type="button"
              onClick={toggleAlarmSound}
              title={
                isAudioActive
                  ? 'Jooji codka alarm-ka'
                  : 'Daar codka digniinta (Alarm Sound)'
              }
              className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all cursor-pointer shadow-md ${
                isAudioActive
                  ? 'bg-danger text-white border-danger animate-pulse'
                  : 'bg-surface-raised border-club-border text-gold hover:border-gold hover:bg-gold/10'
              }`}
            >
              {isAudioActive ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>

            {/* Bouncing Button (Boton Boodboodaya) */}
            <button
              type="button"
              onClick={() => setShowDetailsModal(true)}
              className={`animate-bounce py-2.5 px-4 rounded-xl font-display text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 shadow-2xl transition-transform active:scale-95 cursor-pointer border ${
                isEmergency
                  ? 'bg-gradient-to-r from-danger to-danger/90 text-white border-danger/80 hover:brightness-110 shadow-danger/40'
                  : 'bg-gradient-to-r from-gold to-gold-hover text-pitch-black border-gold hover:brightness-105 shadow-gold/30'
              }`}
            >
              <BellRing className="h-4 w-4 shrink-0 animate-spin" />
              <span>DIGNIIN CIYAAR: IS DIYAARI! ⚽</span>
            </button>
          </div>
        </div>
      </div>

      {/* Match Details & Preparation Modal */}
      <Dialog
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Digniinta & Faahfaahinta Ciyaarta"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-danger/40 bg-pitch-deep p-4 text-center space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase bg-danger/20 text-danger border border-danger/40">
              {hoursRemainingText}
            </span>
            <h4 className="font-display text-xl font-bold text-chalk">
              {matchTitle}
            </h4>
            <p className="text-xs text-chalk-dim max-w-sm mx-auto">
              Dhammaan ciyaartoyda naadiga waxaa lagu wargelinayaa inay si
              buuxda ugu diyaargaroobaan kulankaan muhiimka ah.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-lg border border-club-border bg-surface-raised p-3">
              <span className="text-chalk-dim flex items-center gap-1.5 font-bold">
                <Calendar className="h-4 w-4 text-gold" />
                <span>Maalinta & Taariikhda:</span>
              </span>
              <strong className="text-chalk font-semibold">
                {dayName} {matchDate ? `(${formatSomaliDate(matchDate)})` : ''}
              </strong>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-club-border bg-surface-raised p-3">
              <span className="text-chalk-dim flex items-center gap-1.5 font-bold">
                <Clock className="h-4 w-4 text-gold" />
                <span>Waqtiga Kulanka:</span>
              </span>
              <strong className="text-gold font-bold">{timeText}</strong>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-club-border bg-surface-raised p-3">
              <span className="text-chalk-dim flex items-center gap-1.5 font-bold">
                <MapPin className="h-4 w-4 text-gold" />
                <span>Goobta Garoonka:</span>
              </span>
              <strong className="text-chalk font-semibold">{place}</strong>
            </div>

            {opponent ? (
              <div className="flex items-center justify-between rounded-lg border border-club-border bg-surface-raised p-3">
                <span className="text-chalk-dim flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="h-4 w-4 text-danger" />
                  <span>Kooxda Kasoo Horjeeda:</span>
                </span>
                <strong className="text-danger font-bold">{opponent}</strong>
              </div>
            ) : null}
          </div>

          {/* Player Match Preparation Checklist */}
          <div className="rounded-xl border border-gold/30 bg-surface-raised p-3.5 space-y-2 text-xs">
            <span className="font-bold text-gold uppercase tracking-wider block text-[0.6875rem]">
              Xusuusin & Xeerka Diyaargaroowga:
            </span>
            <ul className="space-y-1.5 text-chalk-dim list-disc pl-4">
              <li>Imaan ugu yaraan 30 daqiiqo ka hor bilowga kulanka.</li>
              <li>
                Wadashada qalabka buuxa (garoorka, kabaha, iyo shin pads).
              </li>
              <li>Anshaxa ciyaarta iyo adeecidda talooyinka macallinka.</li>
            </ul>
          </div>

          {/* Admin Real Countdown Settings Section */}
          {isAdmin ? (
            <div className="rounded-xl border-2 border-danger/60 bg-gradient-to-r from-danger/20 via-pitch-deep to-surface-raised p-3.5 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-danger uppercase tracking-wider block text-[0.6875rem] flex items-center gap-1.5">
                  <Flame className="h-4 w-4" />
                  <span>
                    ⚙️ Deji Waqtiga ka Dhiman Ciyaarta (Admin Live Settings)
                  </span>
                </span>
                <span className="text-[0.625rem] text-gold font-bold">
                  Toos u gal dhammaan ciyaartoyda
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                <button
                  type="button"
                  disabled={isSavingCountdown}
                  onClick={() => handleAdminSetCountdown('auto')}
                  className="py-2 px-2 rounded-lg text-[0.6875rem] font-bold border border-gold/50 bg-gold/15 text-gold hover:bg-gold/25 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>🔄 Toos Jadwalka</span>
                </button>
                <button
                  type="button"
                  disabled={isSavingCountdown}
                  onClick={() =>
                    handleAdminSetCountdown(
                      'match_day',
                      'Maanta waa Maalintii Ciyaarta! (0 saac)',
                    )
                  }
                  className="py-2 px-2 rounded-lg text-[0.6875rem] font-bold border border-danger/60 bg-danger/20 text-danger hover:bg-danger/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                >
                  <Flame className="h-3.5 w-3.5" />
                  <span>⚽ Maanta (0h)</span>
                </button>
                <button
                  type="button"
                  disabled={isSavingCountdown}
                  onClick={() =>
                    handleAdminSetCountdown('urgent_12h', '12 saac')
                  }
                  className="py-2 px-2 rounded-lg text-[0.6875rem] font-bold border border-danger/60 bg-danger/20 text-danger hover:bg-danger/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                >
                  <BellRing className="h-3.5 w-3.5 animate-pulse" />
                  <span>🔥 12 Saac ka Dhiman</span>
                </button>
                <button
                  type="button"
                  disabled={isSavingCountdown}
                  onClick={() =>
                    handleAdminSetCountdown('warning_24h', '24 saac')
                  }
                  className="py-2 px-2 rounded-lg text-[0.6875rem] font-bold border border-amber-500/60 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>⚠️ 24 Saac ka Dhiman</span>
                </button>
              </div>

              <div className="pt-2 border-t border-club-border/40 flex gap-2">
                <input
                  type="text"
                  value={adminCustomInput}
                  onChange={(e) => setAdminCustomInput(e.target.value)}
                  placeholder="Geli waqti kale: e.g. 4 saac ama 30 daqiiqo"
                  className="ui-input flex-1 text-xs py-1.5"
                />
                <Button
                  type="button"
                  variant="primary"
                  disabled={!adminCustomInput.trim() || isSavingCountdown}
                  busy={isSavingCountdown}
                  onClick={() => handleAdminSetCountdown('custom')}
                  className="text-xs py-1.5 px-3"
                >
                  Keydi
                </Button>
              </div>
            </div>
          ) : (
            /* Player read-only note */
            <div className="rounded-xl border border-club-border bg-pitch-deep p-3 text-xs text-chalk-dim flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gold" />
                <span>Waqtiga ka dhiman:</span>
                <strong className="text-gold font-bold">
                  {effectiveAlert.hoursRemainingText}
                </strong>
              </span>
              <span className="text-[0.625rem] text-chalk-dim italic">
                Waqtiga jadwalka rasmiga ah
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-club-border">
            {onNavigateToTab ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDetailsModal(false)
                  onNavigateToTab('schedule')
                }}
                className="text-xs"
              >
                Eeg Jadwalka Guud
              </Button>
            ) : null}

            <Button
              variant="primary"
              onClick={() => setShowDetailsModal(false)}
              className="text-xs font-bold"
            >
              Waan Fahmay (Diyaar Ayaan Ahay) ✅
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
