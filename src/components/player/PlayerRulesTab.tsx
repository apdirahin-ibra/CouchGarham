import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  Calendar,
  FileText,
  Heart,
  LayoutGrid,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { getClubSettingsFn } from '../../server/api'
import { Button, SectionTitle, TicketCard } from '../ui'

interface ParsedRule {
  num: string
  text: string
}

export function PlayerRulesTab() {
  const { token } = useAuth()
  const [rulesText, setRulesText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured')

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

  // Parse structured rules if available
  const parsedData = useMemo(() => {
    if (!rulesText) return { headerLines: [], rules: [], closing: '' }

    const ruleRegex =
      /(?:^|\n)(\d{1,2}):\s*([\s\S]*?)(?=(?:\n\d{1,2}:)|(?:\n\s*\{NASIIB)|$)/g
    const rules: ParsedRule[] = []
    let match: RegExpExecArray | null

    while ((match = ruleRegex.exec(rulesText)) !== null) {
      rules.push({
        num: match[1],
        text: match[2].trim(),
      })
    }

    // Extract header (everything before first "1:")
    const firstRuleIdx = rulesText.search(/(?:^|\n)1:\s*/)
    let headerLines: string[] = []
    if (firstRuleIdx > 0) {
      headerLines = rulesText
        .substring(0, firstRuleIdx)
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    }

    // Extract closing (e.g. {NASIIB WACAN...})
    const closingMatch = rulesText.match(/\{NASIIB WACAN[\s\S]*?\}/)
    const closing = closingMatch ? closingMatch[0].trim() : ''

    return { headerLines, rules, closing }
  }, [rulesText])

  const filteredRules = useMemo(() => {
    if (!searchQuery.trim()) return parsedData.rules
    const q = searchQuery.toLowerCase()
    return parsedData.rules.filter(
      (r) =>
        r.text.toLowerCase().includes(q) ||
        r.num.includes(q) ||
        `qodobka ${r.num}`.includes(q),
    )
  }, [parsedData.rules, searchQuery])

  const isStructuredAvailable = parsedData.rules.length > 0

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <SectionTitle eyebrow="XEERARKA & ANSHAXA KOOXDA" as="h2">
              Shuruucda Rasmiga ah ee Kooxda
            </SectionTitle>
            {parsedData.rules.length > 0 && (
              <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[0.6875rem] font-bold text-gold">
                {parsedData.rules.length} Qodob
              </span>
            )}
          </div>
          <p className="text-xs text-chalk-dim">
            Hanaanka, awaamiirta, iyo anshaxa laga rabo xidiga kasta ee Best Academy
          </p>
        </div>

        {isStructuredAvailable && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-club-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setViewMode('structured')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'structured'
                  ? 'bg-gold/20 text-gold border border-gold/40'
                  : 'text-chalk-dim hover:text-chalk'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Habaysan</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'raw'
                  ? 'bg-gold/20 text-gold border border-gold/40'
                  : 'text-chalk-dim hover:text-chalk'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Qoraal Dhan</span>
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-club-border bg-surface text-gold">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          <span>Soo dejinaya shuruucda kooxda...</span>
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-danger/40 bg-surface p-6 text-center space-y-3">
          <AlertCircle className="h-6 w-6 text-danger mx-auto" />
          <p className="text-sm text-danger m-0">{loadError}</p>
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={loadRules}
          >
            Dib u tijaabi
          </Button>
        </div>
      ) : !rulesText ? (
        <div className="rounded-xl border border-club-border bg-surface p-8 text-center text-sm text-chalk-dim">
          Weli ma jiraan shuruuc la galiyay.
        </div>
      ) : viewMode === 'raw' || !isStructuredAvailable ? (
        <TicketCard className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-gold">
            <BookOpen className="h-5 w-5" />
            <SectionTitle eyebrow="SHURUUDDA KOOXDA" as="h3">
              Qoraalka Shuruucda
            </SectionTitle>
          </div>
          <div className="rounded-xl border border-club-border bg-pitch-deep p-4 text-xs sm:text-sm font-medium leading-relaxed text-chalk whitespace-pre-wrap font-sans">
            {rulesText}
          </div>
        </TicketCard>
      ) : (
        <div className="space-y-4">
          {/* Header Card with Academy Branding & Metadata */}
          <div className="rounded-xl border border-gold/40 bg-gradient-to-br from-gold/15 via-pitch-deep to-surface p-5 space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/40">
                <BookOpen className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-chalk leading-tight">
                  HANAANKA IYO AWAAMIIRTA BEST ACADEMY
                </h3>
                <p className="mt-1 text-xs text-gold font-medium">
                  Shuruudaha iyo anshaxa ay akademiyadu ugu baahantahay ciyaaryahankeeda ❤️
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-gold/20">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-club-border bg-pitch-deep/80 px-2.5 py-1 text-[0.6875rem] font-semibold text-chalk">
                <Calendar className="h-3 w-3 text-gold" />
                <span>Dhaqan-galka: 20/10/2024</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-club-border bg-pitch-deep/80 px-2.5 py-1 text-[0.6875rem] font-semibold text-chalk">
                <Calendar className="h-3 w-3 text-gold" />
                <span>Xariiqidda: 1/6/2026</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-club-border bg-pitch-deep/80 px-2.5 py-1 text-[0.6875rem] font-semibold text-chalk">
                <Users className="h-3 w-3 text-gold" />
                <span>Cida Laga Rabo: Ciyaartoyda</span>
              </span>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-chalk-dim pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Raadi sharci (tusaale: salaad, bacaad, aalamiito, ganaax, waqti, agab)..."
              className="ui-input pl-9 text-xs"
            />
            {searchQuery && (
              <div className="mt-1 text-[0.6875rem] text-chalk-dim">
                Waxaa la helay: {filteredRules.length} qodob
              </div>
            )}
          </div>

          {filteredRules.length === 0 ? (
            <div className="rounded-xl border border-club-border bg-surface p-6 text-center text-sm text-chalk-dim">
              Ma jiro sharci ku habboon "{searchQuery}".
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRules.map((rule, idx) => {
                const isWarningRule =
                  rule.text.includes('🚫') ||
                  rule.text.includes('❌') ||
                  rule.num === '14' ||
                  rule.text.toLowerCase().includes('bacaad') ||
                  rule.text.toLowerCase().includes('salaad')

                return (
                  <TicketCard
                    key={`${rule.num}-${idx}`}
                    className={`flex items-start gap-3.5 p-4 transition-colors ${
                      isWarningRule ? 'border-danger/30 bg-surface/90' : ''
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                        isWarningRule
                          ? 'bg-danger/20 text-danger border border-danger/40'
                          : 'bg-gold/20 text-gold border border-gold/40'
                      }`}
                    >
                      {rule.num}
                    </span>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-gold">
                          Qodobka {rule.num}-aad
                        </span>
                        {isWarningRule && (
                          <span className="inline-flex items-center gap-1 text-[0.625rem] font-bold text-danger px-1.5 py-0.2 rounded bg-danger/10 border border-danger/20">
                            <ShieldAlert className="h-3 w-3" />
                            <span>Muhiim / Feejignow</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-chalk whitespace-pre-wrap m-0">
                        {rule.text}
                      </p>
                    </div>
                  </TicketCard>
                )
              })}
            </div>
          )}

          {/* Closing Benediction */}
          {parsedData.closing && (
            <div className="rounded-xl border border-gold/40 bg-gold/10 p-5 text-center space-y-2">
              <Heart className="h-6 w-6 text-gold mx-auto fill-gold/20" />
              <p className="text-xs sm:text-sm font-bold text-gold tracking-wide m-0">
                {parsedData.closing}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
