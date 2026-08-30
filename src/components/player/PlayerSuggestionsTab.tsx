import { useEffect, useState } from 'react'
import { AlertCircle, MessageCircle, Plus, RefreshCw, Send } from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { formatSomaliDate } from '../../lib/dates'
import { getPlayerSuggestionsFn, submitSuggestionFn } from '../../server/api'
import { Button, Dialog, SectionTitle, TicketCard } from '../ui'
import { useToast } from '../ui/toast-context'

type SuggestionItem = {
  id: string
  text: string
  createdAt: Date | string
}

export function PlayerSuggestionsTab() {
  const { token } = useAuth()
  const { notify } = useToast()

  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [suggestionText, setSuggestionText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadSuggestions = () => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    getPlayerSuggestionsFn({ data: { sessionToken: token } })
      .then((data) => {
        setSuggestions(data || [])
      })
      .catch((err: any) => {
        setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta fikradaha')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    loadSuggestions()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!suggestionText.trim() || !token) return
    setIsSubmitting(true)

    try {
      const created = await submitSuggestionFn({
        data: {
          sessionToken: token,
          text: suggestionText.trim(),
        },
      })
      setSuggestions((current) => [created as any, ...current])
      setIsModalOpen(false)
      setSuggestionText('')
      notify(
        'Fikraddaada si toos ah ayaa loogu gudbiyay macallinka!',
        'success',
      )
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay dirista fikradda', 'danger')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionTitle eyebrow="TALO & FIKRAD KU SOCOTA MACALLINKA" as="h2">
            Fikradahaaga & Talooyinkaaga
          </SectionTitle>
          <p className="text-xs text-chalk-dim">
            La wadaag macallinka fikrad kasta oo kooxda horumarin karta
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5 self-start text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Gudbi Fikrad Cusub</span>
        </Button>
      </div>

      <TicketCard className="p-4 space-y-3">
        <SectionTitle eyebrow="FIKRADAHAAGII HORE" as="h3">
          Fikradihii Aad Dirtay
        </SectionTitle>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-xs text-gold">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span>Soo dejinaya fikradihii aad dirtay...</span>
          </div>
        ) : loadError ? (
          <div className="rounded-lg border border-danger/40 bg-pitch-deep p-4 text-center space-y-2">
            <AlertCircle className="h-5 w-5 text-danger mx-auto" />
            <p className="text-xs text-danger m-0">{loadError}</p>
            <Button
              type="button"
              variant="secondary"
              className="text-xs py-1 px-3"
              onClick={loadSuggestions}
            >
              Dib u tijaabi
            </Button>
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-xs text-chalk-dim text-center py-4">
            Weli ma aadan soo gudbin wax fikrad ah.
          </p>
        ) : (
          <div className="divide-y divide-club-border">
            {suggestions.map((item) => (
              <div key={item.id} className="py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gold">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Fikrad
                    </span>
                  </div>
                  <span className="text-xs text-chalk-dim">
                    {formatSomaliDate(item.createdAt)}
                  </span>
                </div>

                <p className="text-sm font-medium leading-relaxed text-chalk m-0">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </TicketCard>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Gudbi Fikrad Cusub (Share Feedback)"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-bold text-chalk">
              Qoraalka Fikradda ama Talada *
            </label>
            <textarea
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              placeholder="Qor fikradda aad doonayso inaad la wadaagto maamulka kooxda..."
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
            <Button variant="primary" type="submit" busy={isSubmitting}>
              <Send className="h-3.5 w-3.5" />
              <span>Dir Fikradda</span>
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
