import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Edit2,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { SOMALI_WEEKDAYS } from '../../lib/dates'
import {
  createScheduleEntryFn,
  deleteScheduleEntryFn,
  getScheduleAttendanceBreakdownFn,
  getScheduleListFn,
  updateScheduleEntryFn,
} from '../../server/api'
import { Button, Dialog, SectionTitle, TextField, TicketCard } from '../ui'
import { useToast } from '../ui/toast-context'

type ScheduleItem = {
  id: string
  dayName: string
  timeText: string
  place: string
}

export function AdminScheduleTab() {
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
  const [isSaving, setIsSaving] = useState(false)

  const loadSchedules = async () => {
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
  }

  useEffect(() => {
    loadSchedules()
  }, [token])

  const loadDayBreakdown = async (day: string) => {
    if (!token) return
    try {
      const data = await getScheduleAttendanceBreakdownFn({
        data: { sessionToken: token, dayName: day },
      })
      setDayAttendanceBreakdown(data)
    } catch (err) {
      console.warn('Day breakdown load notice:', err)
    }
  }

  useEffect(() => {
    if (expandedDay) {
      loadDayBreakdown(expandedDay)
    }
  }, [expandedDay, token])

  const openAddModal = () => {
    setEditingSchedule(null)
    setDayName('Isniin')
    setTimeText('4:30 PM - 6:30 PM')
    setPlace('Garoonka Weyn ee Degmada')
    setIsModalOpen(true)
  }

  const openEditModal = (item: ScheduleItem) => {
    setEditingSchedule(item)
    setDayName(item.dayName)
    setTimeText(item.timeText)
    setPlace(item.place)
    setIsModalOpen(true)
  }

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!timeText.trim() || !place.trim() || !token) return
    setIsSaving(true)

    try {
      if (editingSchedule) {
        const updated = await updateScheduleEntryFn({
          data: {
            sessionToken: token,
            id: editingSchedule.id,
            dayName,
            timeText: timeText.trim(),
            place: place.trim(),
          },
        })
        setSchedules((current) =>
          current.map((s) => (s.id === editingSchedule.id ? updated : s)),
        )
        notify('Jadwalka tababarka waa la cusbooneysiiyay', 'success')
      } else {
        const created = await createScheduleEntryFn({
          data: {
            sessionToken: token,
            dayName,
            timeText: timeText.trim(),
            place: place.trim(),
          },
        })
        setSchedules((current) => [...current, created])
        notify('Jadwal cusub ayaa lagu daray', 'success')
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
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-gold/20 border border-gold px-2.5 py-0.5 font-display text-sm font-bold text-gold">
                        {schedule.dayName}
                      </span>
                      <strong className="text-sm font-semibold text-chalk">
                        {schedule.timeText}
                      </strong>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-chalk-dim">
                      <MapPin className="h-3.5 w-3.5 text-gold" />
                      <span>{schedule.place}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => openEditModal(schedule)}
                      title="Wax ka beddel"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 text-danger hover:text-danger"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      title="Tirtir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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

          <TextField
            label="Waqtiga Tababarka *"
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
