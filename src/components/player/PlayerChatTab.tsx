import { useEffect, useState } from 'react'
import {
  AlertCircle,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  Shield,
  User,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { formatSomaliDate } from '../../lib/dates'
import {
  getChatMessagesFn,
  getTeamDirectoryFn,
  postChatMessageFn,
} from '../../server/api'
import { Button, SectionTitle, TicketCard } from '../ui'
import { useToast } from '../ui/toast-context'

type ChatMessageItem = {
  id: string
  authorRole: 'admin' | 'player'
  authorName: string
  text: string
  time: string
}

type DirectoryPlayer = {
  id: string
  name: string
  nickname: string | null
  jerseyNumber: number | null
  position: string | null
  whatsapp: string | null
  whatsappUrl: string | null
}

export function PlayerChatTab() {
  const { user, token } = useAuth()
  const { notify } = useToast()
  const [activeView, setActiveView] = useState<'chat' | 'directory'>('chat')

  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [directory, setDirectory] = useState<DirectoryPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)

  const loadData = async (isSilent = false) => {
    if (!token) return
    if (!isSilent) {
      setIsLoading(true)
      setLoadError('')
    }
    try {
      const [chatList, dirList] = await Promise.all([
        getChatMessagesFn({ data: { sessionToken: token } }),
        getTeamDirectoryFn({ data: { sessionToken: token } }),
      ])

      if (chatList) {
        setMessages(
          chatList.map((m: any) => ({
            id: m.id,
            authorRole: m.authorRole,
            authorName: m.authorNameSnapshot,
            text: m.text,
            time: formatSomaliDate(m.createdAt),
          })),
        )
      }

      if (dirList) {
        setDirectory(dirList as any)
      }
    } catch (err: any) {
      if (!isSilent) {
        setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta fariimaha')
      }
    } finally {
      if (!isSilent) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    loadData()
    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      loadData(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [token])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isSending || !token) return

    const messageText = inputText.trim()
    setIsSending(true)

    try {
      const sent = await postChatMessageFn({
        data: {
          sessionToken: token,
          text: messageText,
        },
      })
      if (sent) {
        setMessages((current) => [
          ...current,
          {
            id: sent.id,
            authorRole: sent.authorRole,
            authorName: sent.authorNameSnapshot,
            text: sent.text,
            time: formatSomaliDate(sent.createdAt),
          },
        ])
        setInputText('')
      }
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay dirista fariinta', 'danger')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionTitle eyebrow="WADAHADALKA & XIRIIRKA" as="h2">
            Wadahadalka Kooxda (Team Chat)
          </SectionTitle>
          <p className="text-xs text-chalk-dim">
            Kala hadal tababaraha iyo asxaabtaada wixii ku saabsan kooxda
          </p>
        </div>

        <div className="flex rounded-lg border border-club-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setActiveView('chat')}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeView === 'chat'
                ? 'bg-gold text-pitch-deep shadow'
                : 'text-chalk-dim hover:text-chalk'
            }`}
          >
            Fariimaha ({messages.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView('directory')}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeView === 'directory'
                ? 'bg-gold text-pitch-deep shadow'
                : 'text-chalk-dim hover:text-chalk'
            }`}
          >
            Taleefannada ({directory.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-club-border bg-surface text-gold">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          <span>Soo dejinaya wada-sheekeysiga...</span>
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-danger/40 bg-surface p-6 text-center space-y-3">
          <AlertCircle className="h-6 w-6 text-danger mx-auto" />
          <p className="text-sm text-danger m-0">{loadError}</p>
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={() => loadData(false)}
          >
            Dib u tijaabi
          </Button>
        </div>
      ) : activeView === 'chat' ? (
        <div className="space-y-4">
          <div className="flex flex-col h-[55vh] rounded-xl border border-club-border bg-surface shadow-md overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-chalk-dim text-xs space-y-1">
                  <MessageSquare className="h-6 w-6 text-gold/50" />
                  <p>Weli ma jiraan fariimo kooxda la wadaagay.</p>
                  <span>Noqo qofka ugu horreeya ee fariin dira!</span>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.authorName === user?.name
                  const isAdmin = msg.authorRole === 'admin'

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMe ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        {isAdmin ? (
                          <>
                            <span className="text-[0.6875rem] font-bold text-gold">
                              {msg.authorName}
                            </span>
                            <Shield className="h-3 w-3 text-gold" />
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 text-chalk-dim" />
                            <span className="text-[0.6875rem] font-bold text-chalk">
                              {msg.authorName}
                            </span>
                          </>
                        )}
                        <span className="text-[0.625rem] text-chalk-dim ml-1">
                          {msg.time}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                          isMe
                            ? 'bg-gold/20 text-chalk border border-gold/40 rounded-tr-none'
                            : isAdmin
                              ? 'bg-surface-raised text-chalk border border-gold/30 rounded-tl-none'
                              : 'bg-surface-raised text-chalk border border-club-border rounded-tl-none'
                        }`}
                      >
                        <p className="m-0 leading-relaxed break-words">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 border-t border-club-border bg-pitch-deep p-3"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Qor fariin aad u dirayso kooxda..."
                className="ui-input flex-1 text-sm h-10"
                disabled={isSending}
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!inputText.trim() || isSending}
                busy={isSending}
                className="h-10 px-4 gap-1.5 shrink-0"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Dir</span>
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {directory.length === 0 ? (
            <div className="rounded-xl border border-club-border bg-surface p-6 text-center text-sm text-chalk-dim">
              Weli ma jiraan xiriirro ciyaartoy oo diiwaangashan.
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {directory.map((p) => (
                <TicketCard
                  key={p.id}
                  className="flex items-center justify-between p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pitch-deep font-display text-sm font-bold text-gold border border-gold/30">
                      {p.jerseyNumber ?? '#'}
                    </span>
                    <div>
                      <strong className="block text-sm font-bold text-chalk">
                        {p.name} {p.nickname ? `(${p.nickname})` : ''}
                      </strong>
                      <span className="text-xs text-chalk-dim">
                        {p.position ?? 'Ciyaartoy'}
                      </span>
                    </div>
                  </div>

                  {p.whatsappUrl ? (
                    <a
                      href={p.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-success/40 bg-success/20 px-3 py-1.5 text-xs font-bold text-success transition-all hover:bg-success/30"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <span className="text-xs text-chalk-dim">No WhatsApp</span>
                  )}
                </TicketCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
