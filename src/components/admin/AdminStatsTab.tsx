import { useEffect, useState } from 'react'
import { AlertCircle, Edit2, RefreshCw } from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { getCurrentMonthKey } from '../../lib/dates'
import {
  getCurrentMonthRosterStatsFn,
  updatePlayerMonthlyStatsFn,
} from '../../server/api'
import { Button, Dialog, SectionTitle, TextField, TicketCard } from '../ui'
import { useToast } from '../ui/toast-context'

type PlayerStat = {
  playerId: string
  name: string
  nickname: string | null
  jerseyNumber: number | null
  position: string | null
  goals: number
  assists: number
  errors: number
  xadirCount: number
  maqanCount: number
  daahayCount: number
}

export function AdminStatsTab() {
  const { token } = useAuth()
  const { notify } = useToast()
  const currentMonth = getCurrentMonthKey()

  const [stats, setStats] = useState<PlayerStat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editingStat, setEditingStat] = useState<PlayerStat | null>(null)
  const [editGoals, setEditGoals] = useState('')
  const [editAssists, setEditAssists] = useState('')
  const [editErrors, setEditErrors] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loadStats = async () => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    try {
      const data = await getCurrentMonthRosterStatsFn({
        data: { sessionToken: token, monthKey: currentMonth },
      })
      setStats(data || [])
    } catch (err: any) {
      setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta xogta bishan')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [token])

  const openEditModal = (player: PlayerStat) => {
    setEditingStat(player)
    setEditGoals(String(player.goals))
    setEditAssists(String(player.assists))
    setEditErrors(String(player.errors))
  }

  const handleSaveStat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStat || !token) return
    setIsSaving(true)

    const g = parseInt(editGoals, 10) || 0
    const a = parseInt(editAssists, 10) || 0
    const err = parseInt(editErrors, 10) || 0

    try {
      await updatePlayerMonthlyStatsFn({
        data: {
          sessionToken: token,
          playerId: editingStat.playerId,
          monthKey: currentMonth,
          goals: Math.max(0, g),
          assists: Math.max(0, a),
          errors: Math.max(0, err),
        },
      })

      setStats((current) =>
        current.map((p) =>
          p.playerId === editingStat.playerId
            ? {
                ...p,
                goals: Math.max(0, g),
                assists: Math.max(0, a),
                errors: Math.max(0, err),
              }
            : p,
        ),
      )
      notify('Natiijada ciyaartoyga waa la cusbooneysiiyay!', 'success')
      setEditingStat(null)
    } catch (error: any) {
      notify(error?.message || 'Qalad ayaa dhacay keydinta xogta', 'danger')
    } finally {
      setIsSaving(false)
    }
  }

  const teamTotals = {
    goals: stats.reduce((acc, s) => acc + s.goals, 0),
    assists: stats.reduce((acc, s) => acc + s.assists, 0),
    errors: stats.reduce((acc, s) => acc + s.errors, 0),
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <SectionTitle eyebrow="NATIIJADA IYO XOGTA CIYAARAHA" as="h2">
          Natiijada Ciyaartooyda ({currentMonth})
        </SectionTitle>
        <p className="text-xs text-chalk-dim">
          Goolasha, caawinta, qaladaadka, iyo tirada xaadiriska bishan
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gold/30 bg-surface-raised p-3 text-center">
          <span className="block text-xs font-bold uppercase text-gold">
            Goolasha Kooxda
          </span>
          <strong className="font-display text-2xl font-bold text-chalk">
            {teamTotals.goals}
          </strong>
        </div>
        <div className="rounded-xl border border-gold/30 bg-surface-raised p-3 text-center">
          <span className="block text-xs font-bold uppercase text-gold">
            Caawinta (Assists)
          </span>
          <strong className="font-display text-2xl font-bold text-chalk">
            {teamTotals.assists}
          </strong>
        </div>
        <div className="rounded-xl border border-danger/30 bg-surface-raised p-3 text-center">
          <span className="block text-xs font-bold uppercase text-danger">
            Qaladaadka (Errors)
          </span>
          <strong className="font-display text-2xl font-bold text-chalk">
            {teamTotals.errors}
          </strong>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-club-border bg-surface text-gold">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          <span>Soo dejinaya natiijada ciyaartooyda...</span>
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-danger/40 bg-surface p-6 text-center space-y-3">
          <AlertCircle className="h-6 w-6 text-danger mx-auto" />
          <p className="text-sm text-danger m-0">{loadError}</p>
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={loadStats}
          >
            Dib u tijaabi
          </Button>
        </div>
      ) : stats.length === 0 ? (
        <div className="rounded-xl border border-club-border bg-surface p-6 text-center text-sm text-chalk-dim">
          Weli ma jiraan xog ciyaareed oo bishan la diiwaangeliyay.
        </div>
      ) : (
        <div className="space-y-3">
          {stats.map((player) => (
            <TicketCard key={player.playerId} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pitch-deep font-display text-base font-bold text-gold border border-gold/30">
                    {player.jerseyNumber ?? '#'}
                  </span>
                  <div>
                    <strong className="block text-base font-bold text-chalk">
                      {player.name}
                    </strong>
                    <span className="text-xs text-chalk-dim">
                      {player.position ?? 'Ciyaartoy'}
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  className="text-xs py-1 px-3 h-8 gap-1.5"
                  onClick={() => openEditModal(player)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Wax Ka Beddel</span>
                </Button>
              </div>

              <div className="grid grid-cols-6 gap-1.5 text-center text-xs">
                <div className="rounded bg-surface-raised p-1.5 border border-club-border">
                  <span className="block text-[0.625rem] text-gold font-bold uppercase">
                    Gool
                  </span>
                  <strong className="text-sm text-chalk">{player.goals}</strong>
                </div>
                <div className="rounded bg-surface-raised p-1.5 border border-club-border">
                  <span className="block text-[0.625rem] text-gold font-bold uppercase">
                    Caawi
                  </span>
                  <strong className="text-sm text-chalk">
                    {player.assists}
                  </strong>
                </div>
                <div className="rounded bg-surface-raised p-1.5 border border-club-border">
                  <span className="block text-[0.625rem] text-danger font-bold uppercase">
                    Qalad
                  </span>
                  <strong className="text-sm text-chalk">
                    {player.errors}
                  </strong>
                </div>
                <div className="rounded bg-surface-raised p-1.5 border border-club-border">
                  <span className="block text-[0.625rem] text-success font-bold uppercase">
                    Xadir
                  </span>
                  <strong className="text-sm text-chalk">
                    {player.xadirCount}
                  </strong>
                </div>
                <div className="rounded bg-surface-raised p-1.5 border border-club-border">
                  <span className="block text-[0.625rem] text-danger font-bold uppercase">
                    Maqan
                  </span>
                  <strong className="text-sm text-chalk">
                    {player.maqanCount}
                  </strong>
                </div>
                <div className="rounded bg-surface-raised p-1.5 border border-club-border">
                  <span className="block text-[0.625rem] text-warning font-bold uppercase">
                    Daahay
                  </span>
                  <strong className="text-sm text-chalk">
                    {player.daahayCount}
                  </strong>
                </div>
              </div>
            </TicketCard>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(editingStat)}
        onClose={() => setEditingStat(null)}
        title={editingStat ? `Beddel Natiijada: ${editingStat.name}` : ''}
      >
        <form onSubmit={handleSaveStat} className="space-y-4">
          <TextField
            label="Goolasha (Goals)"
            type="number"
            value={editGoals}
            onChange={(e) => setEditGoals(e.target.value)}
            min={0}
            required
          />
          <TextField
            label="Caawinta (Assists)"
            type="number"
            value={editAssists}
            onChange={(e) => setEditAssists(e.target.value)}
            min={0}
            required
          />
          <TextField
            label="Qaladaadka (Errors)"
            type="number"
            value={editErrors}
            onChange={(e) => setEditErrors(e.target.value)}
            min={0}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setEditingStat(null)}
            >
              Ka Noqo
            </Button>
            <Button variant="primary" type="submit" busy={isSaving}>
              Keydi Natiijada
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
