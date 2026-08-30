import { useEffect, useState } from 'react'
import {
  AlertCircle,
  LogIn,
  RefreshCw,
  Shield,
  User,
  UserPlus,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { getRosterForLoginFn, submitJoinRequestFn } from '../../server/api'
import { Button, Dialog, StatusBadge, TextField, TicketCard } from '../ui'

type PlayerOption = {
  id: string
  name: string
  nickname: string | null
  jerseyNumber: number | null
  position: string | null
}

export function LoginView() {
  const { loginAdmin, loginPlayer } = useAuth()
  const [activeTab, setActiveTab] = useState<'player' | 'admin'>('player')

  const [players, setPlayers] = useState<PlayerOption[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingRoster, setIsLoadingRoster] = useState(true)
  const [rosterError, setRosterError] = useState('')
  const [playerLoginBusy, setPlayerLoginBusy] = useState(false)
  const [playerError, setPlayerError] = useState('')

  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [adminLoginBusy, setAdminLoginBusy] = useState(false)
  const [adminError, setAdminError] = useState('')

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [joinName, setJoinName] = useState('')
  const [joinPhone, setJoinPhone] = useState('')
  const [joinMessage, setJoinMessage] = useState('')
  const [joinBusy, setJoinBusy] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState(false)
  const [joinError, setJoinError] = useState('')

  const loadRoster = async () => {
    setIsLoadingRoster(true)
    setRosterError('')
    try {
      const roster = await getRosterForLoginFn()
      setPlayers(roster || [])
      if (roster && roster.length > 0) {
        setSelectedPlayerId(roster[0]?.id ?? '')
      }
    } catch (err: any) {
      setRosterError(
        err?.message || 'Qalad ayaa dhacay soo dejinta liiska ciyaartooyda',
      )
    } finally {
      setIsLoadingRoster(false)
    }
  }

  useEffect(() => {
    loadRoster()
  }, [])

  const handlePlayerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlayerId) return
    setPlayerError('')
    setPlayerLoginBusy(true)

    try {
      await loginPlayer(selectedPlayerId)
    } catch (err: any) {
      setPlayerError(
        err?.message || 'Qalad ayaa dhacay intii lagu jiray soo galitaanka',
      )
    } finally {
      setPlayerLoginBusy(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdminError('')
    setAdminLoginBusy(true)
    try {
      await loginAdmin(username, password)
    } catch (err: any) {
      setAdminError(
        err?.message || 'Magaca maamulaha ama furaha sirta ah waa qalad',
      )
    } finally {
      setAdminLoginBusy(false)
    }
  }

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinName.trim() || !joinPhone.trim()) return
    setJoinBusy(true)
    setJoinError('')

    try {
      await submitJoinRequestFn({
        data: {
          name: joinName.trim(),
          phone: joinPhone.trim(),
          message: joinMessage.trim() || null,
        },
      })
      setJoinSuccess(true)
      setTimeout(() => {
        setIsJoinModalOpen(false)
        setJoinSuccess(false)
        setJoinName('')
        setJoinPhone('')
        setJoinMessage('')
      }, 2000)
    } catch (err: any) {
      setJoinError(err?.message || 'Qalad ayaa dhacay dirista codsiga')
    } finally {
      setJoinBusy(false)
    }
  }

  const filteredPlayers = players.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nickname &&
        p.nickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.jerseyNumber && String(p.jerseyNumber).includes(searchQuery)),
  )

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center py-6 px-app-gutter">
      <TicketCard className="w-full max-w-md border-gold/40 shadow-2xl p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-gold bg-surface-raised font-display text-2xl font-bold text-gold shadow-lg">
            BO
          </div>
          <h1 className="m-0 font-display text-2xl font-bold uppercase tracking-wider text-chalk">
            Best Official App
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-gold">
            Youth Football Club Management
          </p>
        </div>

        <div className="mb-6 flex rounded-lg border border-club-border bg-pitch-deep p-1">
          <button
            onClick={() => setActiveTab('player')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-bold transition-all ${
              activeTab === 'player'
                ? 'bg-gold text-pitch font-bold shadow'
                : 'text-chalk-dim hover:text-chalk'
            }`}
            type="button"
          >
            <User className="h-4 w-4" />
            <span>Ciyaartoy</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-bold transition-all ${
              activeTab === 'admin'
                ? 'bg-gold text-pitch font-bold shadow'
                : 'text-chalk-dim hover:text-chalk'
            }`}
            type="button"
          >
            <Shield className="h-4 w-4" />
            <span>Maamule</span>
          </button>
        </div>

        {activeTab === 'player' ? (
          <form onSubmit={handlePlayerLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gold">
                Dooro Magacaaga Ciyaartoyga
              </label>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Raadi magac ama lambar..."
                className="ui-input mb-2 text-sm"
                disabled={isLoadingRoster || players.length === 0}
              />

              {isLoadingRoster ? (
                <div className="flex h-32 items-center justify-center rounded-lg border border-club-border bg-pitch-deep text-xs text-gold">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  <span>Soo dejinaya liiska ciyaartooyda...</span>
                </div>
              ) : rosterError ? (
                <div className="rounded-lg border border-danger/40 bg-pitch-deep p-3 text-center space-y-2">
                  <AlertCircle className="h-5 w-5 text-danger mx-auto" />
                  <p className="text-xs text-danger m-0">{rosterError}</p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs py-1 px-3"
                    onClick={loadRoster}
                  >
                    Dib u tijaabi
                  </Button>
                </div>
              ) : players.length === 0 ? (
                <div className="rounded-lg border border-club-border bg-pitch-deep p-4 text-center text-xs text-chalk-dim">
                  Weli ma jiraan ciyaartooy ku qoran kooxda.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-club-border bg-pitch-deep p-1 space-y-1">
                  {filteredPlayers.map((player) => {
                    const isSelected = selectedPlayerId === player.id
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => setSelectedPlayerId(player.id)}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-gold/20 border border-gold text-chalk'
                            : 'text-chalk-dim hover:bg-surface-raised hover:text-chalk'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-xs font-bold text-gold">
                            {player.jerseyNumber ?? '#'}
                          </span>
                          <div>
                            <strong className="block text-sm leading-tight text-chalk">
                              {player.name}
                            </strong>
                            {player.nickname ? (
                              <span className="text-[0.6875rem] text-gold/90">
                                ({player.nickname})
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {player.position ? (
                          <StatusBadge
                            tone="neutral"
                            className="text-[0.6875rem] py-0 px-2"
                          >
                            {player.position}
                          </StatusBadge>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {playerError ? (
              <p className="text-xs font-bold text-danger">{playerError}</p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              busy={playerLoginBusy}
              disabled={!selectedPlayerId || playerLoginBusy || isLoadingRoster}
              className="w-full justify-center py-3 text-base shadow-lg"
            >
              <LogIn className="h-4 w-4" />
              <span>Geli Kooxda (Enter App)</span>
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gold hover:underline cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Ma tihid xubin? Codso Ku Biirid</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <TextField
              label="Magaca Maamulaha (Username)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              required
            />
            <TextField
              label="Furaha Sirta ah (Password)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Geli furahaaga sirta ah"
              required
            />

            {adminError ? (
              <p className="text-xs font-bold text-danger">{adminError}</p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              busy={adminLoginBusy}
              className="w-full justify-center py-3 text-base shadow-lg"
            >
              <LogIn className="h-4 w-4" />
              <span>Gal Maamulka (Admin Login)</span>
            </Button>
          </form>
        )}
      </TicketCard>

      <Dialog
        open={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title="Codsi Ku Biirid Kooxda (Join Club)"
      >
        {joinSuccess ? (
          <div className="py-4 text-center">
            <StatusBadge
              tone="success"
              className="mx-auto mb-2 text-sm py-1 px-3"
            >
              Codsigaaga si guul leh ayaa loo diray!
            </StatusBadge>
            <p className="text-xs text-chalk-dim">
              Maamulaha kooxda ayaa dib u eegi doona codsigaaga dhawaan.
            </p>
          </div>
        ) : (
          <form onSubmit={handleJoinSubmit} className="space-y-3.5">
            <TextField
              label="Magacaaga oo Buuxa *"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="e.g. Liibaan Axmed"
              required
            />
            <TextField
              label="Lambarka WhatsApp *"
              value={joinPhone}
              onChange={(e) => setJoinPhone(e.target.value)}
              placeholder="e.g. +252 61 555 1234"
              required
            />
            <div>
              <label className="mb-1 block text-xs font-bold text-chalk">
                Fariin ama Khibradaada Kubadda
              </label>
              <textarea
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder="Ila wadaag booska aad jeceshahay inaad ka ciyaarto..."
                rows={3}
                className="ui-input text-sm"
              />
            </div>

            {joinError ? (
              <p className="text-xs font-bold text-danger">{joinError}</p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsJoinModalOpen(false)}
              >
                Ka Noqo
              </Button>
              <Button variant="primary" type="submit" busy={joinBusy}>
                Dir Codsiga
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
