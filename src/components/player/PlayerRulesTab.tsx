import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, BookOpen, RefreshCw } from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { getClubSettingsFn } from '../../server/api'
import { Button, SectionTitle, TicketCard } from '../ui'

export function PlayerRulesTab() {
  const { token } = useAuth()
  const [rulesText, setRulesText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadRules = useCallback(() => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    getClubSettingsFn({ data: { sessionToken: token } })
      .then((settings) => {
        if (settings?.rulesText) {
          setRulesText(settings.rulesText)
        }
      })
      .catch((err: any) => {
        setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta shuruucda')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [token])

  useEffect(() => {
    loadRules()
  }, [loadRules])

  return (
    <div className="space-y-6 pb-12">
      <div>
        <SectionTitle eyebrow="XEERARKA & ANSHAXA KOOXDA" as="h2">
          Shuruucda Rasmiga ah ee Kooxda
        </SectionTitle>
        <p className="text-xs text-chalk-dim">
          Xeerarka ay tahay in ciyaartoy kasta uu ilaaliyo si loo sugo nidaamka
          kooxda
        </p>
      </div>

      <TicketCard className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-gold">
          <BookOpen className="h-5 w-5" />
          <SectionTitle eyebrow="SHURUUDDA KOOXDA" as="h3">
            Qodobbada Shuruucda
          </SectionTitle>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-xs text-gold">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span>Soo dejinaya shuruucda kooxda...</span>
          </div>
        ) : loadError ? (
          <div className="rounded-lg border border-danger/40 bg-pitch-deep p-4 text-center space-y-2">
            <AlertCircle className="h-5 w-5 text-danger mx-auto" />
            <p className="text-xs text-danger m-0">{loadError}</p>
            <Button
              type="button"
              variant="secondary"
              className="text-xs py-1 px-3"
              onClick={loadRules}
            >
              Dib u tijaabi
            </Button>
          </div>
        ) : !rulesText ? (
          <p className="text-xs text-chalk-dim text-center py-4">
            Weli ma jiraan shuruuc la galiyay.
          </p>
        ) : (
          <div className="rounded-xl border border-club-border bg-pitch-deep p-4 text-sm font-medium leading-relaxed text-chalk whitespace-pre-wrap">
            {rulesText}
          </div>
        )}
      </TicketCard>
    </div>
  )
}
