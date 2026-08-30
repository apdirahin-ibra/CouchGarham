import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Lightbulb, Plus, RefreshCw, Trash2 } from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { addTipFn, deleteTipFn, getTipsFn } from '../../server/api'
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTipText, setNewTipText] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionTitle eyebrow="TALOOYINKA IYO WAANADA" as="h2">
            Waano & Talooyin Ciyaareed
          </SectionTitle>
          <p className="text-xs text-chalk-dim">
            Talooyin caafimaad, dhiirrigelin, iyo anshax oo loo bandhigo
            ciyaartooyda
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5 self-start text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Kudar Waano Cusub</span>
        </Button>
      </div>

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
        <div className="rounded-xl border border-club-border bg-surface p-6 text-center text-sm text-chalk-dim">
          Weli ma jiraan waano ama talooyin la galiyay.
        </div>
      ) : (
        <div className="space-y-3">
          {tipsList.map((tip, idx) => (
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
                    Talo #{idx + 1}
                  </span>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-chalk m-0">
                    {tip.text}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                className="h-8 w-8 p-0 shrink-0 text-chalk-dim hover:text-danger"
                onClick={() => handleDeleteTip(tip.id)}
                title="Tirtir waanada"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TicketCard>
          ))}
        </div>
      )}

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
    </div>
  )
}
