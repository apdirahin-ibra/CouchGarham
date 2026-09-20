import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  BellRing,
  Calendar,
  Clock,
  Flame,
  MapPin,
  ShieldAlert,
  Volume2,
  VolumeX,
} from 'lucide-react'

import { formatSomaliDate } from '../../lib/dates'
import type { UpcomingMatchAlert } from '../../server/schedule.server'
import { Button, Dialog } from './index'

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
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [isAudioActive, setIsAudioActive] = useState(false)
  const intervalRef = useRef<any>(null)

  if (!alert || !alert.hasUpcomingMatch) {
    return null
  }

  const {
    isMatchDay,
    isWithin12Hours,
    hoursRemainingText,
    matchTitle,
    opponent,
    timeText,
    place,
    matchDate,
    dayName,
  } = alert

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Theme styling based on urgency level
  const isEmergency = isMatchDay || isWithin12Hours

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border-2 transition-all shadow-xl ${
          isEmergency
            ? 'border-danger bg-gradient-to-r from-danger/25 via-pitch-deep to-danger/30 text-chalk'
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
                      : 'bg-gold text-pitch-black font-extrabold'
                  }`}
                >
                  <Bell className="h-3 w-3 inline" />
                  <span>
                    {isMatchDay
                      ? 'DIGNIIN: CIYAARTA MAANTA'
                      : isWithin12Hours
                        ? 'DIGNIIN DEGDEG AH (12 SAAC)'
                        : 'DIGNIIN CIYAAR (24 SAAC)'}
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
                    {dayName} {matchDate ? `(${formatSomaliDate(matchDate)})` : ''}
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

          {/* Right section: Bouncing Button & Alarm Sound Toggle */}
          <div className="flex items-center gap-2.5 sm:self-center shrink-0">
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
              Dhammaan ciyaartoyda naadiga waxaa lagu wargelinayaa inay si buuxda
              ugu diyaargaroobaan kulankaan muhiimka ah.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-lg border border-club-border bg-surface-raised p-3">
              <span className="text-chalk-dim flex items-center gap-1.5 font-bold">
                <Calendar className="h-4 w-4 text-gold" />
                <span>Maalinta & Taariikhda:</span>
              </span>
              <strong className="text-chalk font-semibold">
                {dayName}{' '}
                {matchDate ? `(${formatSomaliDate(matchDate)})` : ''}
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
              <li>Wadashada qalabka buuxa (garoorka, kabaha, iyo shin pads).</li>
              <li>Anshaxa ciyaarta iyo adeecidda talooyinka macallinka.</li>
            </ul>
          </div>

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
