import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  Edit,
  Eye,
  KeyRound,
  Phone,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import {
  createPlayerAdminFn,
  generatePlayerPinFn,
  getAdminPlayersFn,
  getPlayerDetailAdminFn,
  togglePlayerActiveAdminFn,
  updatePlayerAdminFn,
} from '../../server/api'
import {
  Button,
  Dialog,
  SectionTitle,
  StatusBadge,
  TextField,
  TicketCard,
} from '../ui'
import { useToast } from '../ui/toast-context'

type Player = {
  id: string
  name: string
  nickname: string | null
  jerseyNumber: number | null
  position: string | null
  whatsapp: string | null
  legacyPin?: string | null
  isActive: boolean
}

export function AdminPlayersTab() {
  const { token } = useAuth()
  const { notify } = useToast()

  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActiveOnly, setFilterActiveOnly] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [jerseyNumber, setJerseyNumber] = useState('')
  const [position, setPosition] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [pin, setPin] = useState('')
  const [isGeneratingPin, setIsGeneratingPin] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [viewingPlayer, setViewingPlayer] = useState<any>(null)

  const loadPlayers = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    try {
      const list = await getAdminPlayersFn({ data: { sessionToken: token } })
      setPlayers(list || [])
    } catch (err: any) {
      setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta ciyaartooyda')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadPlayers()
  }, [loadPlayers])

  const handleRegeneratePin = async () => {
    if (!token) return
    setIsGeneratingPin(true)
    try {
      const newPin = await generatePlayerPinFn({
        data: { sessionToken: token },
      })
      if (newPin) setPin(newPin)
    } catch {
      setPin(String(Math.floor(1000 + Math.random() * 9000)))
    } finally {
      setIsGeneratingPin(false)
    }
  }

  const openAddModal = async () => {
    setEditingPlayer(null)
    setName('')
    setNickname('')
    setJerseyNumber('')
    setPosition('')
    setWhatsapp('')
    setIsActive(true)
    const fallbackPin = String(Math.floor(1000 + Math.random() * 9000))
    setPin(fallbackPin)
    setIsModalOpen(true)
    if (token) {
      try {
        const generated = await generatePlayerPinFn({
          data: { sessionToken: token },
        })
        if (generated) setPin(generated)
      } catch {
        // Fallback already set
      }
    }
  }

  const openEditModal = (player: Player) => {
    setEditingPlayer(player)
    setName(player.name)
    setNickname(player.nickname || '')
    setJerseyNumber(player.jerseyNumber ? String(player.jerseyNumber) : '')
    setPosition(player.position || '')
    setWhatsapp(player.whatsapp || '')
    setPin(player.legacyPin || '')
    setIsActive(player.isActive)
    setIsModalOpen(true)
  }

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !token) return

    const cleanPin = pin.trim()
    if (cleanPin && (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin))) {
      notify('PIN-ku waa inuu noqdaa 4 lambar (e.g. 1234)', 'danger')
      return
    }

    setIsSaving(true)

    const num = jerseyNumber ? parseInt(jerseyNumber, 10) : null

    try {
      if (editingPlayer) {
        const updated = await updatePlayerAdminFn({
          data: {
            sessionToken: token,
            id: editingPlayer.id,
            name: name.trim(),
            nickname: nickname.trim() || null,
            jerseyNumber: num,
            position: position.trim() || null,
            whatsapp: whatsapp.trim() || null,
            legacyPin: cleanPin || null,
            isActive,
          },
        })
        setPlayers((current) =>
          current.map((p) => (p.id === editingPlayer.id ? updated : p)),
        )
        notify('Ciyaartoyga waa la cusbooneysiiyay!', 'success')
      } else {
        const created = await createPlayerAdminFn({
          data: {
            sessionToken: token,
            name: name.trim(),
            nickname: nickname.trim() || null,
            jerseyNumber: num,
            position: position.trim() || null,
            whatsapp: whatsapp.trim() || null,
            legacyPin: cleanPin || null,
            isActive,
          },
        })
        setPlayers((current) => [created, ...current])
        notify('Ciyaartoy cusub ayaa lagu daray roster-ka!', 'success')
      }
      setIsModalOpen(false)
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay keydinta ciyaartoyga', 'danger')
    } finally {
      setIsSaving(false)
    }
  }

  const togglePlayerActive = async (id: string, currentActive: boolean) => {
    if (!token) return
    try {
      const updated = await togglePlayerActiveAdminFn({
        data: { sessionToken: token, id, isActive: !currentActive },
      })
      setPlayers((current) => current.map((p) => (p.id === id ? updated : p)))
      notify(
        !currentActive
          ? 'Ciyaartoygii dib ayaa loo howlgeliyay'
          : 'Ciyaartoygii waa la xiray',
        'success',
      )
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay beddelidda xaaladda', 'danger')
    }
  }

  const handleViewDetail = async (player: Player) => {
    setViewingPlayer({ player, loading: true })
    if (!token) return

    try {
      const detail = await getPlayerDetailAdminFn({
        data: { sessionToken: token, id: player.id },
      })
      setViewingPlayer(detail)
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay soo dejinta xogta', 'danger')
      setViewingPlayer(null)
    }
  }

  const filteredPlayers = players.filter((p) => {
    if (filterActiveOnly && !p.isActive) return false
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nickname &&
        p.nickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.jerseyNumber && String(p.jerseyNumber).includes(searchQuery)) ||
      (p.position &&
        p.position.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionTitle eyebrow="MAAMULKA ROSTER-KA" as="h2">
            Liiska Ciyaartooyda ({players.length})
          </SectionTitle>
          <p className="text-xs text-chalk-dim">
            Kudar, wax ka beddel ama xir xubnaha kooxda
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openAddModal}
          className="gap-1.5 self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Kudar Ciyaartoy</span>
        </Button>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Raadi magac, lambarka direyska ama booska..."
            className="ui-input pl-9 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-chalk-dim">
          <input
            type="checkbox"
            checked={filterActiveOnly}
            onChange={(e) => setFilterActiveOnly(e.target.checked)}
            className="rounded border-club-border text-gold focus:ring-gold"
          />
          <span>
            Ciyaartooyda Firfircoon Kaliya (
            {players.filter((p) => p.isActive).length})
          </span>
        </label>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-club-border bg-surface text-gold">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          <span>Soo dejinaya liiska ciyaartooyda...</span>
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-danger/40 bg-surface p-6 text-center space-y-3">
          <AlertCircle className="h-6 w-6 text-danger mx-auto" />
          <p className="text-sm text-danger m-0">{loadError}</p>
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={loadPlayers}
          >
            Dib u tijaabi
          </Button>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="rounded-xl border border-club-border bg-surface p-6 text-center text-sm text-chalk-dim">
          {searchQuery
            ? 'Ciyaartoy u dhigma raadintaada lama helin.'
            : 'Weli ma jiraan ciyaartooy ku qoran kooxda.'}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredPlayers.map((player) => (
            <TicketCard
              key={player.id}
              className="flex flex-col justify-between p-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pitch-deep font-display text-lg font-bold text-gold border border-gold/30">
                      {player.jerseyNumber ?? '#'}
                    </span>
                    <div>
                      <strong className="block text-base font-bold text-chalk">
                        {player.name}
                      </strong>
                      {player.nickname ? (
                        <span className="text-xs font-medium text-gold">
                          "{player.nickname}"
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <StatusBadge tone={player.isActive ? 'success' : 'danger'}>
                    {player.isActive ? 'Firfircoon' : 'Aan Shaqeyn'}
                  </StatusBadge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-chalk-dim">
                  <span className="rounded bg-pitch-deep px-2 py-0.5 border border-gold/40 flex items-center gap-1 font-mono font-bold text-gold">
                    <KeyRound className="h-3 w-3 text-gold" />
                    <span>PIN: {player.legacyPin || '---'}</span>
                  </span>
                  {player.position ? (
                    <span className="rounded bg-surface-raised px-2 py-0.5 border border-club-border">
                      Booska: {player.position}
                    </span>
                  ) : null}
                  {player.whatsapp ? (
                    <span className="rounded bg-surface-raised px-2 py-0.5 border border-club-border flex items-center gap-1">
                      <Phone className="h-3 w-3 text-gold" />
                      {player.whatsapp}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-club-border pt-3">
                <Button
                  variant="ghost"
                  className="text-xs py-1 px-2.5 h-8"
                  onClick={() => handleViewDetail(player)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Faahfaahin</span>
                </Button>
                <Button
                  variant="secondary"
                  className="text-xs py-1 px-2.5 h-8"
                  onClick={() => openEditModal(player)}
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Wax Ka Beddel</span>
                </Button>
                <Button
                  variant={player.isActive ? 'danger' : 'secondary'}
                  className="text-xs py-1 px-2 h-8"
                  onClick={() => togglePlayerActive(player.id, player.isActive)}
                  title={
                    player.isActive ? 'Jooji ciyaartoygan' : 'Dib u howlgeli'
                  }
                >
                  {player.isActive ? (
                    <UserX className="h-3.5 w-3.5" />
                  ) : (
                    <UserCheck className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </TicketCard>
          ))}
        </div>
      )}

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingPlayer ? 'Wax Ka Beddel Ciyaartoy' : 'Kudar Ciyaartoy Cusub'
        }
      >
        <form onSubmit={handleSavePlayer} className="space-y-3.5">
          <TextField
            label="Magaca Ciyaartoyga"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Liibaan Axmed"
            required
          />

          <div className="grid grid-cols-2 gap-2.5">
            <TextField
              label="Naanays (Nickname)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Messi"
            />
            <TextField
              label="Lambarka Direyska (Jersey #)"
              type="number"
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              placeholder="e.g. 10"
              min={1}
              max={99}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <TextField
              label="Booska (Position)"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Weerar"
            />
            <TextField
              label="Lambarka WhatsApp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="e.g. +252615551234"
            />
          </div>

          <div className="rounded-lg border border-gold/30 bg-pitch-deep/70 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold">
                <KeyRound className="h-3.5 w-3.5 text-gold" />
                <span>Furaha Sirta ah (4-Digit PIN) *</span>
              </label>
              <span className="text-[10px] text-chalk-dim">
                Ciyaartoyga wuxuu ku galayaa PIN-kan
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
                placeholder="e.g. 1234"
                className="ui-input font-mono text-center text-lg font-bold tracking-[0.3em] text-gold"
                required
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 gap-1.5 py-2 px-3 text-xs"
                onClick={handleRegeneratePin}
                disabled={isGeneratingPin}
                title="Dhal PIN Cusub oo gaar ah"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    isGeneratingPin ? 'animate-spin' : ''
                  }`}
                />
                <span>Dib u dhal</span>
              </Button>
            </div>
            <p className="text-[11px] text-chalk-dim m-0">
              PIN-kani wuxuu u gaar yahay ciyaartoygan. Admin-ku mar kasta wuu
              arki karaa ama beddeli karaa.
            </p>
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-club-border text-gold focus:ring-gold"
            />
            <span className="text-xs font-semibold text-chalk">
              Waa Ciyaartoy Firfircoon (Active)
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Ka Noqo
            </Button>
            <Button variant="primary" type="submit" busy={isSaving}>
              Keydi Ciyaartoyga
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(viewingPlayer)}
        onClose={() => setViewingPlayer(null)}
        title={
          viewingPlayer?.player ? `Xogta: ${viewingPlayer.player.name}` : ''
        }
      >
        {viewingPlayer?.player ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-club-border bg-surface-raised p-3">
              <div>
                <strong className="block text-base font-bold text-chalk">
                  {viewingPlayer.player.name}{' '}
                  {viewingPlayer.player.nickname
                    ? `(${viewingPlayer.player.nickname})`
                    : ''}
                </strong>
                <span className="text-xs text-gold font-medium">
                  Direys #{viewingPlayer.player.jerseyNumber ?? 'N/A'} • Booska:{' '}
                  {viewingPlayer.player.position ?? 'N/A'}
                </span>
                <div className="mt-1.5 flex items-center gap-1.5 rounded border border-gold/40 bg-pitch-deep px-2 py-0.5 w-fit font-mono text-xs font-bold text-gold">
                  <KeyRound className="h-3 w-3 text-gold" />
                  <span>PIN: {viewingPlayer.player.legacyPin || '---'}</span>
                </div>
              </div>
              <StatusBadge
                tone={viewingPlayer.player.isActive ? 'success' : 'danger'}
              >
                {viewingPlayer.player.isActive ? 'Firfircoon' : 'Aan Shaqeyn'}
              </StatusBadge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded border border-club-border bg-pitch-deep p-2">
                <span className="block text-[0.6875rem] text-gold uppercase font-bold">
                  Goolal
                </span>
                <strong className="text-lg text-chalk">
                  {viewingPlayer.currentMonthStats?.goals ?? 0}
                </strong>
              </div>
              <div className="rounded border border-club-border bg-pitch-deep p-2">
                <span className="block text-[0.6875rem] text-gold uppercase font-bold">
                  Assists
                </span>
                <strong className="text-lg text-chalk">
                  {viewingPlayer.currentMonthStats?.assists ?? 0}
                </strong>
              </div>
              <div className="rounded border border-club-border bg-pitch-deep p-2">
                <span className="block text-[0.6875rem] text-gold uppercase font-bold">
                  Qaladaad
                </span>
                <strong className="text-lg text-chalk">
                  {viewingPlayer.currentMonthStats?.errors ?? 0}
                </strong>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                onClick={() => setViewingPlayer(null)}
              >
                Xir
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}
