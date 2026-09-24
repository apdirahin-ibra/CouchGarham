import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  BellRing,
  CheckCircle,
  Clock,
  Edit,
  Flame,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { getDateForSomaliWeekday, SOMALI_WEEKDAYS } from '../../lib/dates'
import {
  createScheduleEntryFn,
  deleteScheduleEntryFn,
  getScheduleAttendanceBreakdownFn,
  getScheduleListFn,
  setMatchCountdownAlertFn,
  updateScheduleEntryFn,
} from '../../server/api'
import { Button, Dialog, SectionTitle, TextField, TicketCard } from '../ui'
import { useToast } from '../ui/toast-context'

type ScheduleItem = {
  id: string
  dayName: string
  timeText: string
  place: string
  eventType?: string | null
  opponent?: string | null
  matchDate?: string | null
  matchTime?: string | null
  customHoursRemaining?: string | null
}

export function AdminScheduleTab({
  onNavigateToTab,
}: {
  onNavigateToTab?: (tab: string, date?: string) => void
}) {
  const { token } = useAuth()
  const { notify } = useToast()

  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [expandedDay, setExpandedDay] = useState<string | null>('Isniin')
  const [dayAttendanceBreakdown, setDayAttendanceBreakdown] =
    useState<any>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(
    null,
  )
  const [dayName, setDayName] = useState<string>('Isniin')
  const [timeText, setTimeText] = useState('')
  const [place, setPlace] = useState('')
  const [eventType, setEventType] = useState<'tababar' | 'ciyaar'>('tababar')
  const [opponent, setOpponent] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [matchTime, setMatchTime] = useState('')
  const [customHoursRemaining, setCustomHoursRemaining] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [activeAlert, setActiveAlert] = useState<any>(null)
  const [customRemainingInput, setCustomRemainingInput] = useState('')
  const [isUpdatingAlert, setIsUpdatingAlert] = useState(false)

  const loadSchedules = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    try {
      const list = await getScheduleListFn({ data: { sessionToken: token } })
      setSchedules(list || [])
    } catch (err: any) {
      setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta jadwalka')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  const loadDayBreakdown = useCallback(
    async (day: string) => {
      if (!token) return
      try {
        const data = await getScheduleAttendanceBreakdownFn({
          data: { sessionToken: token, dayName: day },
        })
        setDayAttendanceBreakdown(data)
      } catch (err) {
        console.warn('Day breakdown load notice:', err)
      }
    },
    [token],
  )

  useEffect(() => {
    if (expandedDay) {
      loadDayBreakdown(expandedDay)
    }
  }, [expandedDay, loadDayBreakdown])

  const handleSetCountdownAlert = async (
    mode: 'auto' | 'custom' | 'match_day' | 'urgent_12h' | 'warning_24h',
    customHours?: string,
  ) => {
    if (!token) return
    setIsUpdatingAlert(true)
    try {
      const updated = await setMatchCountdownAlertFn({
        data: {
          sessionToken: token,
          mode,
          customHours:
            customHours ?? (mode === 'custom' ? customRemainingInput.trim() : null),
        },
      })
      setActiveAlert(updated)
      notify(
        mode === 'auto'
          ? 'Digniinta ciyaarta waxaa si toos ah loogu xiray jadwalka!'
          : `Waqtiga ciyaarta waa la cusbooneysiiyay: ${customHours || customRemainingInput || mode}`,
        'success',
      )
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay dejinta waqtiga', 'danger')
    } finally {
      setIsUpdatingAlert(false)
    }
  }

  const openAddModal = () => {
    setEditingSchedule(null)
    setDayName('Isniin')
    setTimeText('4:30 PM - 6:30 PM')
    setPlace('Garoonka Weyn ee Degmada')
    setEventType('tababar')
    setOpponent('')
    setMatchDate('')
    setMatchTime('16:30')
    setCustomHoursRemaining('')
    setIsModalOpen(true)
  }

  const openEditModal = (item: ScheduleItem) => {
    setEditingSchedule(item)
    setDayName(item.dayName)
    setTimeText(item.timeText)
    setPlace(item.place)
    setEventType(item.eventType === 'ciyaar' ? 'ciyaar' : 'tababar')
    setOpponent(item.opponent || '')
    setMatchDate(item.matchDate || '')
    setMatchTime(item.matchTime || '')
    setCustomHoursRemaining(item.customHoursRemaining || '')
    setIsModalOpen(true)
  }

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!timeText.trim() || !place.trim() || !token) return
    setIsSaving(true)

    const payload = {
      sessionToken: token,
      dayName,
      timeText: timeText.trim(),
      place: place.trim(),
      eventType,
      opponent: eventType === 'ciyaar' && opponent.trim() ? opponent.trim() : null,
      matchDate:
        eventType === 'ciyaar' && matchDate.trim() ? matchDate.trim() : null,
      matchTime:
        eventType === 'ciyaar' && matchTime.trim() ? matchTime.trim() : null,
      customHoursRemaining:
        eventType === 'ciyaar' && customHoursRemaining.trim()
          ? customHoursRemaining.trim()
          : null,
    }

    try {
      if (editingSchedule) {
        const updated = await updateScheduleEntryFn({
          data: {
            ...payload,
            id: editingSchedule.id,
          },
        })
        setSchedules((current) =>
          current.map((s) => (s.id === editingSchedule.id ? updated : s)),
        )
        notify(
          eventType === 'ciyaar'
            ? 'Ciyaarta jadwalka waa la cusbooneysiiyay!'
            : 'Jadwalka tababarka waa la cusbooneysiiyay',
          'success',
        )
      } else {
        const created = await createScheduleEntryFn({
          data: payload,
        })
        setSchedules((current) => [...current, created])
        notify(
          eventType === 'ciyaar'
            ? 'Ciyaar cusub ayaa lagu daray jadwalka!'
            : 'Jadwal cusub ayaa lagu daray',
          'success',
        )
      }
      setIsModalOpen(false)
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay keydinta jadwalka', 'danger')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    if (!token) return
    try {
      await deleteScheduleEntryFn({ data: { sessionToken: token, id } })
      setSchedules((current) => current.filter((s) => s.id !== id))
      notify('Jadwalkii waa la tirtiray', 'neutral')
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay tirtirista jadwalka', 'danger')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Qaybta Digniinta Ciyaarta & Waqtiga ka Dhiman (Admin Match Alarm Controls) */}
      <div className="rounded-2xl border-2 border-danger/60 bg-gradient-to-r from-danger/20 via-pitch-deep to-surface-raised p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-club-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-danger/25 text-danger border border-danger/60 animate-pulse">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[0.6875rem] font-black uppercase tracking-wider text-danger flex items-center gap-1.5">
                <BellRing className="h-3.5 w-3.5" />
                <span>Digniinta Ciyaarta & Waqtiga ka Dhiman (Admin Controls)</span>
              </span>
              <h3 className="font-display text-base sm:text-lg font-bold text-chalk">
                Dejinta Alarm-ka Ciyaarta & Countdown-ka
              </h3>
            </div>
          </div>
          <span className="text-xs text-chalk-dim self-start sm:self-auto bg-pitch-deep px-3 py-1.5 rounded-lg border border-club-border">
            Ku xir jadwalka ama toos u geli waqtiga
          </span>
        </div>

        {/* Current status banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-pitch-deep/90 border border-gold/40 p-3 rounded-xl">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-4 w-4 text-gold shrink-0" />
            <span className="text-chalk-dim">Xaaladda hadda:</span>
            <strong className="text-gold font-bold">
              {activeAlert?.hoursRemainingText ||
                'Jadwalka ciyaarta ayaa toos u xisaabinaya waqtiga ka dhiman'}
            </strong>
          </div>
          {activeAlert?.isCustomAdminTime && (
            <span className="text-[0.6875rem] font-bold px-2 py-0.5 rounded bg-danger/20 text-danger border border-danger/40">
              Gacan ku Geli (Admin Override)
            </span>
          )}
        </div>

        {/* Preset 1-click buttons */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-chalk-dim block">
            Dooro habka digniinta (1-Guji):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              disabled={isUpdatingAlert}
              onClick={() => handleSetCountdownAlert('auto')}
              className="py-2.5 px-3 rounded-xl border border-gold/50 bg-gold/15 text-gold hover:bg-gold/25 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>🔄 Toos Jadwalka (Auto)</span>
            </button>
            <button
              type="button"
              disabled={isUpdatingAlert}
              onClick={() =>
                handleSetCountdownAlert(
                  'match_day',
                  'Maanta waa Maalintii Ciyaarta! (0 saac)',
                )
              }
              className="py-2.5 px-3 rounded-xl border border-danger/60 bg-danger/20 text-danger hover:bg-danger/30 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Flame className="h-4 w-4" />
              <span>⚽ Maanta (0 Saac)</span>
            </button>
            <button
              type="button"
              disabled={isUpdatingAlert}
              onClick={() => handleSetCountdownAlert('urgent_12h', '12 saac')}
              className="py-2.5 px-3 rounded-xl border border-danger/60 bg-danger/20 text-danger hover:bg-danger/30 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <BellRing className="h-4 w-4 animate-pulse" />
              <span>🔥 12 Saac ka Dhiman</span>
            </button>
            <button
              type="button"
              disabled={isUpdatingAlert}
              onClick={() => handleSetCountdownAlert('warning_24h', '24 saac')}
              className="py-2.5 px-3 rounded-xl border border-amber-500/60 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Clock className="h-4 w-4" />
              <span>⚠️ 24 Saac ka Dhiman</span>
            </button>
          </div>
        </div>

        {/* Custom input form */}
        <div className="pt-2 border-t border-club-border/60">
          <label className="block text-xs font-bold text-chalk mb-1.5">
            Ama geli waqti gaar ah oo ka dhiman ciyaarta (Custom Remaining Time):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customRemainingInput}
              onChange={(e) => setCustomRemainingInput(e.target.value)}
              placeholder="e.g. 4 saac, 2 saac iyo 30 daqiiqo, ama 45 daqiiqo"
              className="ui-input flex-1 text-xs"
            />
            <Button
              type="button"
              variant="primary"
              disabled={!customRemainingInput.trim() || isUpdatingAlert}
              busy={isUpdatingAlert}
              onClick={() => handleSetCountdownAlert('custom')}
              className="text-xs px-4"
            >
              Keydi Waqtiga
            </Button>
          </div>
          <p className="text-[0.625rem] text-chalk-dim mt-1.5 m-0">
            Marka aad keydiso, dhammaan ciyaartoyda dashboard-kooda waxaa markiiba uga soo muuqan doona waqtigan alarm-ka iyo badhanka boodboodaya.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionTitle eyebrow="JADWALKA TABABARKA & KULAMADA" as="h2">
            Jadwalka Todobaadlaha ah
          </SectionTitle>
          <p className="text-xs text-chalk-dim">
            Maalmaha tababarka, saacadaha, goobta, iyo xogta xaadiriska
            maalintaas
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openAddModal}
          className="gap-1.5 self-start text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Kudar Maalin Cusub</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-club-border bg-surface text-gold">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          <span>Soo dejinaya jadwalka tababarka...</span>
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-danger/40 bg-surface p-6 text-center space-y-3">
          <AlertCircle className="h-6 w-6 text-danger mx-auto" />
          <p className="text-sm text-danger m-0">{loadError}</p>
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={loadSchedules}
          >
            Dib u tijaabi
          </Button>
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-xl border border-club-border bg-surface p-6 text-center text-sm text-chalk-dim">
          Weli ma jiro jadwal tababar oo la galiyay.
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => {
            const isExpanded = expandedDay === schedule.dayName

            return (
              <TicketCard key={schedule.id} className="p-4 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateToTab?.(
                            'attendance',
                            getDateForSomaliWeekday(schedule.dayName),
                          )
                        }
                        className="rounded-md bg-gold/20 border border-gold px-2.5 py-0.5 font-display text-sm font-bold text-gold hover:bg-gold hover:text-pitch transition-all cursor-pointer"
                        title="Guji si aad xaadiris ugu qaaddo maalintan"
                      >
                        {schedule.dayName}
                      </button>
                      <strong className="text-sm font-semibold text-chalk">
                        {schedule.timeText}
                      </strong>
                      {schedule.eventType === 'ciyaar' ? (
                        <span className="rounded-full border border-danger/40 bg-danger/15 px-2 py-0.5 text-[0.6875rem] font-bold text-danger animate-pulse flex items-center gap-1">
                          ⚽ CIYAAR RASMI AH
                        </span>
                      ) : (
                        <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[0.6875rem] font-medium text-gold">
                          🏃 TABABAR
                        </span>
                      )}
                    </div>
                    {schedule.eventType === 'ciyaar' && schedule.opponent ? (
                      <div className="mt-1 text-xs font-semibold text-amber-300">
                        VS {schedule.opponent}
                        {schedule.matchDate ? ` (${schedule.matchDate})` : ''}
                      </div>
                    ) : null}
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-chalk-dim">
                      <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                      <span>{schedule.place}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      className="text-xs py-1 px-2.5 h-8 gap-1.5"
                      onClick={() =>
                        onNavigateToTab?.(
                          'attendance',
                          getDateForSomaliWeekday(schedule.dayName),
                        )
                      }
                      title="U gudub xaadiriska maalintan"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Qaad Xaadiriska</span>
                    </Button>

                    <button
                      type="button"
                      onClick={() => openEditModal(schedule)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold transition-colors cursor-pointer"
                      title="Wax ka beddel"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20 hover:border-danger transition-colors cursor-pointer"
                      title="Tirtir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-club-border pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedDay(isExpanded ? null : schedule.dayName)
                    }
                    className="flex w-full items-center justify-between text-xs font-bold text-gold hover:underline cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>
                        {isExpanded
                          ? 'Qari Xaadiriskii Maalintan'
                          : `Eeg Xaadiriskii ${schedule.dayName}-tii Ugu Dambeysay`}
                      </span>
                    </span>
                    <span>{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {isExpanded && dayAttendanceBreakdown ? (
                    <div className="mt-3 rounded-lg border border-club-border bg-pitch-deep p-3 space-y-2 text-xs">
                      <span className="block text-[0.6875rem] font-semibold text-chalk-dim">
                        Taariikhda: {dayAttendanceBreakdown.formattedDate}
                      </span>

                      <div className="grid grid-cols-3 gap-2 text-center py-1">
                        <div className="rounded bg-surface p-1 border border-success/30">
                          <span className="block text-[0.625rem] text-success font-bold">
                            Xadir
                          </span>
                          <strong className="text-sm text-chalk">
                            {dayAttendanceBreakdown.counts?.xadir ?? 0}
                          </strong>
                        </div>
                        <div className="rounded bg-surface p-1 border border-danger/30">
                          <span className="block text-[0.625rem] text-danger font-bold">
                            Maqan
                          </span>
                          <strong className="text-sm text-chalk">
                            {dayAttendanceBreakdown.counts?.maqan ?? 0}
                          </strong>
                        </div>
                        <div className="rounded bg-surface p-1 border border-warning/30">
                          <span className="block text-[0.625rem] text-warning font-bold">
                            Daahay
                          </span>
                          <strong className="text-sm text-chalk">
                            {dayAttendanceBreakdown.counts?.daahay ?? 0}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </TicketCard>
            )
          })}
        </div>
      )}

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingSchedule ? 'Wax Ka Beddel Jadwalka' : 'Kudar Jadwal Cusub'
        }
      >
        <form onSubmit={handleSaveSchedule} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-bold text-chalk">
              Nooca Dhacdada (Event Type) *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEventType('tababar')}
                className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                  eventType === 'tababar'
                    ? 'border-gold bg-gold/20 text-gold shadow-sm'
                    : 'border-club-border bg-pitch-deep text-chalk-dim hover:text-chalk'
                }`}
              >
                🏃 Tababar Caadi ah
              </button>
              <button
                type="button"
                onClick={() => setEventType('ciyaar')}
                className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                  eventType === 'ciyaar'
                    ? 'border-danger bg-danger/20 text-danger shadow-sm animate-pulse'
                    : 'border-club-border bg-pitch-deep text-chalk-dim hover:text-chalk'
                }`}
              >
                ⚽ Ciyaar Rasmi ah (Match)
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-chalk">
              Maalinta Todobaadka *
            </label>
            <select
              value={dayName}
              onChange={(e) => setDayName(e.target.value)}
              className="ui-input text-sm"
            >
              {SOMALI_WEEKDAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {eventType === 'ciyaar' && (
            <>
              <TextField
                label="Kooxda Kasoo Horjeeda (Opponent Team) *"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="e.g. Banaadir FC ama Horseed SC"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <TextField
                  label="Taariikhda Kulanka (YYYY-MM-DD)"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  placeholder="e.g. 2026-09-25"
                />
                <TextField
                  label="Saacadda Bilaabashada (Kickoff)"
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  placeholder="e.g. 16:30 ama 4:30 PM"
                />
              </div>
              <TextField
                label="Waqtiga ka Dhiman Ciyaarta (Admin Override / Ikhtiyaari)"
                value={customHoursRemaining}
                onChange={(e) => setCustomHoursRemaining(e.target.value)}
                placeholder="e.g. 4 saac, 12 saac (haddii kale toos ayuu u xisaabinayaa)"
              />
            </>
          )}

          <TextField
            label="Waqtiga Tababarka / Ciyaarta *"
            value={timeText}
            onChange={(e) => setTimeText(e.target.value)}
            placeholder="e.g. 4:30 PM - 6:30 PM"
            required
          />

          <TextField
            label="Goobta / Garoonka *"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="e.g. Garoonka Weyn ee Degmada"
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Ka Noqo
            </Button>
            <Button variant="primary" type="submit" busy={isSaving}>
              Keydi Jadwalka
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
