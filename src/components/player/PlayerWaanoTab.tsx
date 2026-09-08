import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Lightbulb, RefreshCw, Search } from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { getTipsFn } from '../../server/api'
import { Button, SectionTitle, TicketCard } from '../ui'

type TipItem = {
  id: string
  text: string
  sortOrder: number
}

export function PlayerWaanoTab() {
  const { token } = useAuth()
  const [tipsList, setTipsList] = useState<TipItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const loadTips = useCallback(() => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    getTipsFn({ data: { sessionToken: token } })
      .then((list) => {
        setTipsList(list || [])
      })
      .catch((err: any) => {
        setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta waanada')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [token])

  useEffect(() => {
    loadTips()
  }, [loadTips])

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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <SectionTitle eyebrow="TALOOYINKA & HORUMARINTA" as="h2">
              Waano & Talooyin Ciyaareed
            </SectionTitle>
            {tipsList.length > 0 && (
              <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[0.6875rem] font-bold text-gold">
                {tipsList.length} Waano
              </span>
            )}
          </div>
          <p className="text-xs text-chalk-dim">
            Talooyin muhiim ah oo ku saabsan caafimaadka, anshaxa, iyo horumarka
            ciyaartaada
          </p>
        </div>
      </div>

      {/* Search Bar */}
      {tipsList.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-chalk-dim pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Raadi waano (tusaale: biyo, hurdo, tababar, cunto)..."
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
        <div className="rounded-xl border border-club-border bg-surface p-6 text-center text-sm text-chalk-dim">
          Weli ma jiraan waano ama talooyin la galiyay.
        </div>
      ) : filteredTips.length === 0 ? (
        <div className="rounded-xl border border-club-border bg-surface p-6 text-center text-sm text-chalk-dim">
          Ma jirto waano ku habboon "{searchQuery}".
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTips.map((tip, idx) => (
            <TicketCard key={tip.id} className="flex items-start gap-3 p-4">
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
            </TicketCard>
          ))}
        </div>
      )}
    </div>
  )
}
