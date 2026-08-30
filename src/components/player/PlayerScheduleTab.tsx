import { useEffect, useState } from 'react'
import { AlertCircle, Clock, MapPin, RefreshCw } from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { getScheduleListFn } from '../../server/api'
import { Button, SectionTitle, TicketCard } from '../ui'

type ScheduleItem = {
  id: string
  dayName: string
  timeText: string
  place: string
}

export function PlayerScheduleTab() {
  const { token } = useAuth()
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadSchedule = () => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    getScheduleListFn({ data: { sessionToken: token } })
      .then((list) => {
        setSchedules(list || [])
      })
      .catch((err: any) => {
        setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta jadwalka')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    loadSchedule()
  }, [token])

  return (
    <div className="space-y-6 pb-12">
      <div>
        <SectionTitle eyebrow="JADWALKA TODOBATLADA" as="h2">
          Jadwalka Tababarka & Kulamada
        </SectionTitle>
        <p className="text-xs text-chalk-dim">
          Maalmaha, saacadaha, iyo goobaha uu ka dhacayo tababarka kooxdu
        </p>
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
            onClick={loadSchedule}
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
          {schedules.map((schedule) => (
            <TicketCard key={schedule.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-gold/20 border border-gold px-2.5 py-0.5 font-display text-sm font-bold text-gold">
                  {schedule.dayName}
                </span>

                <div className="flex items-center gap-1 text-xs text-chalk font-semibold">
                  <Clock className="h-3.5 w-3.5 text-gold" />
                  <span>{schedule.timeText}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-chalk-dim pt-1 border-t border-club-border">
                <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                <span className="text-chalk font-medium">{schedule.place}</span>
              </div>
            </TicketCard>
          ))}
        </div>
      )}
    </div>
  )
}
