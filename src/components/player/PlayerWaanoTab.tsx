import { useEffect, useState } from 'react'
import { AlertCircle, Lightbulb, RefreshCw } from 'lucide-react'

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

  const loadTips = () => {
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
  }

  useEffect(() => {
    loadTips()
  }, [token])

  return (
    <div className="space-y-6 pb-12">
      <div>
        <SectionTitle eyebrow="TALOOYINKA & HORUMARINTA" as="h2">
          Waano & Talooyin Ciyaareed
        </SectionTitle>
        <p className="text-xs text-chalk-dim">
          Talooyin muhiim ah oo ku saabsan caafimaadka, anshaxa, iyo horumarka
          ciyaartaada
        </p>
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
            <TicketCard key={tip.id} className="flex items-start gap-3 p-4">
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
            </TicketCard>
          ))}
        </div>
      )}
    </div>
  )
}
