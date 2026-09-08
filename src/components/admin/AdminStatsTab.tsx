import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Award,
  Edit2,
  RefreshCw,
  Star,
  TrendingUp,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { formatSomaliDate, getCurrentMonthKey } from '../../lib/dates'
import { getRatingBadgeInfo } from '../../lib/ratings'
import {
  getCurrentMonthRosterStatsFn,
  getRosterRatingsSummaryFn,
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

type PlayerRatingSummary = {
  playerId: string
  name: string
  nickname: string | null
  jerseyNumber: number | null
  position: string | null
  averageRating: string
  totalMatchesEvaluated: number
  latestRatingDate: string | null
  latestOverallRating: string | null
}

export function AdminStatsTab() {
  const { token } = useAuth()
  const { notify } = useToast()
  const currentMonth = getCurrentMonthKey()

  const [viewMode, setViewMode] = useState<'monthly' | 'ratings'>('monthly')

  // Monthly stats state
  const [stats, setStats] = useState<PlayerStat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editingStat, setEditingStat] = useState<PlayerStat | null>(null)
  const [editGoals, setEditGoals] = useState('')
  const [editAssists, setEditAssists] = useState('')
  const [editErrors, setEditErrors] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Ratings leaderboard state
  const [ratingsList, setRatingsList] = useState<PlayerRatingSummary[]>([])
  const [isLoadingRatings, setIsLoadingRatings] = useState(false)
  const [ratingsError, setRatingsError] = useState('')

  const loadStats = useCallback(async () => {
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
  }, [currentMonth, token])

  const loadRatings = useCallback(async () => {
    if (!token) return
    setIsLoadingRatings(true)
    setRatingsError('')
    try {
      const data = await getRosterRatingsSummaryFn({
        data: { sessionToken: token },
      })
      setRatingsList(data || [])
    } catch (err: any) {
      setRatingsError(
        err?.message || 'Qalad ayaa dhacay soo dejinta qiimeynta ciyaartooyda',
      )
    } finally {
      setIsLoadingRatings(false)
    }
  }, [token])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    if (viewMode === 'ratings' && ratingsList.length === 0) {
      loadRatings()
    }
  }, [viewMode, ratingsList.length, loadRatings])

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

  // Sorted Ratings Leaderboard
  const sortedRatings = useMemo(() => {
    return [...ratingsList].sort((a, b) => {
      const avgA = parseFloat(a.averageRating) || 0
      const avgB = parseFloat(b.averageRating) || 0
      if (avgB !== avgA) return avgB - avgA
      return b.totalMatchesEvaluated - a.totalMatchesEvaluated
    })
  }, [ratingsList])

  const evaluatedPlayers = ratingsList.filter(
    (p) => p.totalMatchesEvaluated > 0,
  )
  const teamOverallAvg =
    evaluatedPlayers.length > 0
      ? (
          evaluatedPlayers.reduce(
            (acc, p) => acc + (parseFloat(p.averageRating) || 0),
            0,
          ) / evaluatedPlayers.length
        ).toFixed(1)
      : '0.0'

  return (
    <div className="space-y-6 pb-12">
      {/* Subtab Toggle Buttons */}
      <div className="flex gap-2 rounded-xl bg-pitch-deep p-1.5 border border-club-border">
        <button
          type="button"
          onClick={() => setViewMode('monthly')}
          className={`flex-1 rounded-lg py-2.5 px-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
            viewMode === 'monthly'
              ? 'bg-gold text-pitch-black shadow-md'
              : 'text-chalk-dim hover:text-chalk hover:bg-surface-raised'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Natiijada Bishan</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('ratings')}
          className={`flex-1 rounded-lg py-2.5 px-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
            viewMode === 'ratings'
              ? 'bg-gold text-pitch-black shadow-md'
              : 'text-chalk-dim hover:text-chalk hover:bg-surface-raised'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Qiimeynta Kulamada</span>
        </button>
      </div>

      {viewMode === 'monthly' ? (
        <>
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
                      <strong className="text-sm text-chalk">
                        {player.goals}
                      </strong>
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
        </>
      ) : (
        /* Ratings Leaderboard View */
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <SectionTitle eyebrow="QIIMEYNTA GUUD EE KULAMADA" as="h2">
                Qiimeynta Ciyaartooyda ee Kulamada
              </SectionTitle>
              <p className="text-xs text-chalk-dim">
                Kala sarreynta ciyaartoyda marka loo eego 10-ka qeybood ee
                qiimeynta ciyaar kasta
              </p>
            </div>
            <Button
              variant="secondary"
              className="text-xs h-8 px-2.5 gap-1.5 self-start sm:self-auto"
              onClick={loadRatings}
              disabled={isLoadingRatings}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoadingRatings ? 'animate-spin' : ''}`}
              />
              <span>Cusbooneysii</span>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="rounded-xl border border-gold/40 bg-surface-raised p-3 text-center">
              <span className="block text-[0.625rem] sm:text-xs font-bold uppercase text-gold">
                Celceliska Kooxda
              </span>
              <strong className="font-display text-xl sm:text-2xl font-bold text-chalk">
                ⭐ {teamOverallAvg}
              </strong>
            </div>
            <div className="rounded-xl border border-gold/30 bg-surface-raised p-3 text-center">
              <span className="block text-[0.625rem] sm:text-xs font-bold uppercase text-gold">
                Ciyaartooy La Qiimeeyay
              </span>
              <strong className="font-display text-xl sm:text-2xl font-bold text-chalk">
                {evaluatedPlayers.length} / {ratingsList.length}
              </strong>
            </div>
            <div className="rounded-xl border border-gold/30 bg-surface-raised p-3 text-center">
              <span className="block text-[0.625rem] sm:text-xs font-bold uppercase text-gold">
                Heerka Guud
              </span>
              <span className="inline-block mt-1 font-display text-xs sm:text-sm font-bold text-gold">
                {getRatingBadgeInfo(parseFloat(teamOverallAvg)).badge}
              </span>
            </div>
          </div>

          {isLoadingRatings ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-club-border bg-surface text-gold">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              <span>Soo dejinaya qiimeynta ciyaartooyda...</span>
            </div>
          ) : ratingsError ? (
            <div className="rounded-xl border border-danger/40 bg-surface p-6 text-center space-y-3">
              <AlertCircle className="h-6 w-6 text-danger mx-auto" />
              <p className="text-sm text-danger m-0">{ratingsError}</p>
              <Button
                type="button"
                variant="secondary"
                className="text-xs"
                onClick={loadRatings}
              >
                Dib u tijaabi
              </Button>
            </div>
          ) : sortedRatings.length === 0 ? (
            <div className="rounded-xl border border-club-border bg-surface p-6 text-center text-sm text-chalk-dim">
              Weli ma jiraan ciyaartoy la diiwaangeliyay.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedRatings.map((player, index) => {
                const rank = index + 1
                const avgNum = parseFloat(player.averageRating) || 0
                const badgeInfo = getRatingBadgeInfo(avgNum)
                const isEvaluated = player.totalMatchesEvaluated > 0

                return (
                  <TicketCard
                    key={player.playerId}
                    className={`p-3.5 sm:p-4 space-y-3 ${
                      rank === 1 && isEvaluated
                        ? 'border-gold shadow-md shadow-gold/5'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-xl font-display text-base font-bold border ${
                              rank === 1 && isEvaluated
                                ? 'bg-gold/20 text-gold border-gold'
                                : rank === 2 && isEvaluated
                                  ? 'bg-chalk/10 text-chalk border-chalk/40'
                                  : rank === 3 && isEvaluated
                                    ? 'bg-amber-900/30 text-amber-500 border-amber-600/40'
                                    : 'bg-pitch-deep text-chalk-dim border-club-border'
                            }`}
                          >
                            {player.jerseyNumber ?? '#'}
                          </span>
                          {isEvaluated && rank <= 3 ? (
                            <span
                              className={`absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[0.625rem] font-bold ${
                                rank === 1
                                  ? 'bg-gold text-pitch-black'
                                  : rank === 2
                                    ? 'bg-slate-300 text-pitch-black'
                                    : 'bg-amber-600 text-chalk'
                              }`}
                            >
                              {rank}
                            </span>
                          ) : null}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-sm sm:text-base font-bold text-chalk">
                              {player.name}
                            </strong>
                            {player.nickname ? (
                              <span className="text-xs text-gold">
                                ({player.nickname})
                              </span>
                            ) : null}
                          </div>
                          <span className="text-xs text-chalk-dim">
                            {player.position ?? 'Ciyaartoy'} •{' '}
                            {player.totalMatchesEvaluated} kulan la qiimeeyay
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 font-display text-base sm:text-lg font-bold text-gold justify-end">
                          <Star className="h-4 w-4 fill-gold text-gold" />
                          <span>
                            {isEvaluated ? player.averageRating : '-'}
                          </span>
                          <span className="text-xs text-chalk-dim font-normal">
                            / 5.0
                          </span>
                        </div>
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider ${
                            isEvaluated
                              ? 'bg-gold/20 text-gold border border-gold/30'
                              : 'bg-surface text-chalk-dim border border-club-border'
                          }`}
                        >
                          {isEvaluated ? badgeInfo.badge : 'Aan la Qiimeyn'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-club-border/60 text-xs text-chalk-dim">
                      <span>
                        {player.latestRatingDate ? (
                          <>
                            Kulan dambe:{' '}
                            <strong className="text-chalk">
                              {formatSomaliDate(player.latestRatingDate)}
                            </strong>{' '}
                            (⭐ {player.latestOverallRating})
                          </>
                        ) : (
                          'Weli ma jiro kulan la qiimeeyay'
                        )}
                      </span>

                      <span className="text-[0.6875rem] text-gold font-medium">
                        Qiimeynta waxaa laga sameeyaa tab-ka Ciyaartoy
                      </span>
                    </div>
                  </TicketCard>
                )
              })}
            </div>
          )}
        </>
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
