import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Edit2,
  Lightbulb,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import {
  addTipFn,
  bulkImport100TipsFn,
  deleteTipFn,
  getTipsFn,
  updateTipFn,
} from '../../server/api'
import { Button, Dialog, SectionTitle, TicketCard } from '../ui'
import { useToast } from '../ui/toast-context'

type TipItem = {
  id: string
  text: string
  sortOrder: number
}

export function AdminWaanoTab() {
  const { token } = useAuth()
  const { notify } = useToast()

  const [tipsList, setTipsList] = useState<TipItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // Single Add Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTipText, setNewTipText] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Edit Modal
  const [editingTip, setEditingTip] = useState<TipItem | null>(null)
  const [editTipText, setEditTipText] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Bulk Import Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const loadTips = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    try {
      const list = await getTipsFn({ data: { sessionToken: token } })
      setTipsList(list || [])
    } catch (err: any) {
      setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta waanada')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadTips()
  }, [loadTips])

  const handleAddTip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTipText.trim() || !token) return
    setIsSaving(true)

    try {
      const created = await addTipFn({
        data: {
          sessionToken: token,
          text: newTipText.trim(),
        },
      })
      setTipsList((current) => [...current, created as any])
      setIsModalOpen(false)
      setNewTipText('')
      notify('Waano cusub ayaa lagu daray!', 'success')
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay keydinta waanada', 'danger')
    } finally {
      setIsSaving(false)
    }
  }

  const handleStartEdit = (tip: TipItem) => {
    setEditingTip(tip)
    setEditTipText(tip.text)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTip || !editTipText.trim() || !token) return
    setIsUpdating(true)

    try {
      const updated = await updateTipFn({
        data: {
          sessionToken: token,
          id: editingTip.id,
          text: editTipText.trim(),
        },
      })
      setTipsList((current) =>
        current.map((t) => (t.id === editingTip.id ? (updated as any) : t)),
      )
      setEditingTip(null)
      setEditTipText('')
      notify('Waanada si guul leh ayaa wax looga beddelay!', 'success')
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay beddelka waanada', 'danger')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteTip = async (id: string) => {
    if (!token) return
    try {
      await deleteTipFn({ data: { sessionToken: token, id } })
      setTipsList((current) => current.filter((t) => t.id !== id))
      notify('Waanadii waa la tirtiray', 'neutral')
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay tirtirista', 'danger')
    }
  }

  const handleBulkImport = async (mode: 'replace' | 'append') => {
    if (!token) return
    setIsImporting(true)
    try {
      const res = await bulkImport100TipsFn({
        data: { sessionToken: token, mode },
      })
      notify(
        res.message || '100-ka waano si guul leh ayaa loo soo geliyay!',
        'success',
      )
      setIsBulkModalOpen(false)
      await loadTips()
    } catch (err: any) {
      notify(
        err?.message || 'Qalad ayaa dhacay soo gelinta 100-ka waano',
        'danger',
      )
    } finally {
      setIsImporting(false)
    }
  }

  const filteredTips = useMemo(() => {
    if (!searchQuery.trim()) return tipsList
    const q = searchQuery.toLowerCase()
    return tipsList.filter(
      (t) =>
        t.text.toLowerCase().includes(q) ||
        `talo #${t.sortOrder}`.includes(q) ||
        String(t.sortOrder).includes(q),
    )
  }, [tipsList, searchQuery])

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <SectionTitle eyebrow="TALOOYINKA IYO WAANADA" as="h2">
              Waano & Talooyin Ciyaareed
            </SectionTitle>
            {tipsList.length > 0 && (
              <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[0.6875rem] font-bold text-gold">
                {tipsList.length} Waano
              </span>
            )}
          </div>
          <p className="text-xs text-chalk-dim">
            Talooyin caafimaad, dhiirrigelin, iyo anshax oo loo bandhigo
            ciyaartooyda
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setIsBulkModalOpen(true)}
            className="gap-1.5 text-xs border-gold/40 text-gold hover:bg-gold/10"
            title="Soo geli dhammaan 100-ka waano ee rasmiga ah"
          >
            <Sparkles className="h-4 w-4 text-gold" />
            <span>Soo Geli 100-ka Waano</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Kudar Waano Cusub</span>
          </Button>
        </div>
      </div>

      {/* Quick Search */}
      {tipsList.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-chalk-dim pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Raadi waano (tusaale: biyo, hurdo, tababar, garoonka)..."
            className="ui-input pl-9 text-xs"
          />
          {searchQuery && (
            <div className="mt-1 text-[0.6875rem] text-chalk-dim">
              Waxaa la helay: {filteredTips.length} waano
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-club-border bg-surface text-gold">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          <span>Soo dejinaya waanada kooxda...</span>
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-danger/40 bg-surface p-6 text-center space-y-3">
          <AlertCircle className="h-6 w-6 text-danger mx-auto" />
          <p className="text-sm text-danger m-0">{loadError}</p>
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={loadTips}
          >
            Dib u tijaabi
          </Button>
        </div>
      ) : tipsList.length === 0 ? (
        <div className="rounded-xl border border-club-border bg-surface p-8 text-center space-y-3">
          <Sparkles className="h-8 w-8 text-gold mx-auto" />
          <h3 className="text-sm font-bold text-chalk">
            Weli ma jiraan waano la galiyay
          </h3>
          <p className="text-xs text-chalk-dim max-w-md mx-auto">
            Waxaad hal gujin ku soo geli kartaa dhammaan 100-ka waano ee
            ciyaartoyda ama waxaad ku dari kartaa waano gaar ah.
          </p>
          <Button
            variant="primary"
            onClick={() => setIsBulkModalOpen(true)}
            className="gap-1.5 text-xs mx-auto"
          >
            <Sparkles className="h-4 w-4" />
            <span>Hada Soo Geli 100-ka Waano</span>
          </Button>
        </div>
      ) : filteredTips.length === 0 ? (
        <div className="rounded-xl border border-club-border bg-surface p-6 text-center text-sm text-chalk-dim">
          Ma jirto waano ku habboon "{searchQuery}".
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTips.map((tip, idx) => (
            <TicketCard
              key={tip.id}
              className="flex items-start justify-between gap-3 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/40">
                  <Lightbulb className="h-4 w-4" />
                </span>
                <div>
                  <span className="block text-[0.6875rem] font-bold uppercase tracking-wider text-gold">
                    Talo #{tip.sortOrder || idx + 1}
                  </span>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-chalk m-0">
                    {tip.text}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold transition-colors cursor-pointer"
                  onClick={() => handleStartEdit(tip)}
                  title="Wax ka bedel waanada"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20 hover:border-danger transition-colors cursor-pointer"
                  onClick={() => handleDeleteTip(tip.id)}
                  title="Tirtir waanada"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </TicketCard>
          ))}
        </div>
      )}

      {/* Single Add Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Kudar Waano Cusub (Add Tip)"
      >
        <form onSubmit={handleAddTip} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-bold text-chalk">
              Qoraalka Waanada ama Talada *
            </label>
            <textarea
              value={newTipText}
              onChange={(e) => setNewTipText(e.target.value)}
              placeholder="Qor talada ama dhiirrigelinta aad u gudbinayso ciyaartooyda..."
              rows={4}
              className="ui-input text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Ka Noqo
            </Button>
            <Button variant="primary" type="submit" busy={isSaving}>
              Keydi Waanada
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={Boolean(editingTip)}
        onClose={() => setEditingTip(null)}
        title={`Wax ka bedel Waanada #${editingTip?.sortOrder || ''}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-bold text-chalk">
              Qoraalka Waanada *
            </label>
            <textarea
              value={editTipText}
              onChange={(e) => setEditTipText(e.target.value)}
              rows={4}
              className="ui-input text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setEditingTip(null)}
            >
              Ka Noqo
            </Button>
            <Button variant="primary" type="submit" busy={isUpdating}>
              Keydi Isbedelka
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Bulk Import 100 Tips Modal */}
      <Dialog
        open={isBulkModalOpen}
        onClose={() => !isImporting && setIsBulkModalOpen(false)}
        title="Soo Gelinta 100-ka Waano (Bulk Import)"
      >
        <div className="space-y-4 text-xs text-chalk-dim">
          <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-gold font-bold text-sm">
              <Sparkles className="h-4 w-4" />
              <span>BEST OFFICIAL APP — 100 Waano Ciyaartoyda</span>
            </div>
            <p className="text-xs text-chalk leading-relaxed">
              Waxaad hal mar keydka ku shubi kartaa dhammaan 100-ka waano iyo
              talooyin ciyaareed oo dhammaystiran (hurdo, biyo, cunto, anshax,
              tababar, xushmad, iwm).
            </p>
          </div>

          <p className="text-xs text-chalk">
            Fadlan dooro sida aad rabto inaad u soo geliso:
          </p>

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={isImporting}
              onClick={() => handleBulkImport('replace')}
              className="w-full text-left p-3.5 rounded-xl border border-gold/40 bg-gold/10 hover:bg-gold/20 transition-colors cursor-pointer group"
            >
              <div className="font-bold text-gold text-xs flex items-center justify-between">
                <span>
                  1. Bedel Dhammaan oo Geli 100-ka Waano (Lagu Talinayo)
                </span>
                <span className="text-[0.625rem] uppercase px-1.5 py-0.5 rounded bg-gold/20 text-gold border border-gold/30">
                  Fresh 100
                </span>
              </div>
              <p className="mt-1 text-[0.6875rem] text-chalk-dim group-hover:text-chalk transition-colors">
                Waxay tirtireysaa waanadii hore oo waxay soo gelinaysaa 100-ka
                waano oo nidaamsan min 1 ilaa 100.
              </p>
            </button>

            <button
              type="button"
              disabled={isImporting}
              onClick={() => handleBulkImport('append')}
              className="w-full text-left p-3.5 rounded-xl border border-club-border bg-surface hover:bg-surface-elevated transition-colors cursor-pointer group"
            >
              <div className="font-bold text-chalk text-xs">
                2. Ku dar kuwa ka dhiman kaliya (Append)
              </div>
              <p className="mt-1 text-[0.6875rem] text-chalk-dim group-hover:text-chalk transition-colors">
                Kaliya waanooyinka aan weli ku jirin liiska ayaa lagu dari
                doonaa, kuwa horena waa la deynayaa.
              </p>
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-club-border">
            <Button
              variant="ghost"
              type="button"
              disabled={isImporting}
              onClick={() => setIsBulkModalOpen(false)}
            >
              Ka Noqo
            </Button>
            {isImporting && (
              <div className="flex items-center gap-2 text-xs text-gold">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Waa la shubayaa 100-ka waano...</span>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  )
}
