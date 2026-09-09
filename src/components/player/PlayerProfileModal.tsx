import { useEffect, useState } from 'react'
import {
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  Image,
  KeyRound,
  MessageSquare,
  Phone,
  RefreshCw,
  Shield,
  Shirt,
  User,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { formatSomaliDate } from '../../lib/dates'
import { getMyPlayerProfileFn } from '../../server/api'
import { Button, Dialog, SectionTitle } from '../ui'

type PlayerProfile = {
  id: string
  name: string
  nickname: string | null
  jerseyNumber: number | null
  position: string | null
  whatsapp: string | null
  pin: string | null
  isActive: boolean
  createdAt: Date | string
}

type PlayerProfileModalProps = {
  open: boolean
  onClose: () => void
  onNavigateToTab: (tab: any) => void
}

export function PlayerProfileModal({
  open,
  onClose,
  onNavigateToTab,
}: PlayerProfileModalProps) {
  const { token, user } = useAuth()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPin, setShowPin] = useState(false)

  useEffect(() => {
    if (open && token) {
      setIsLoading(true)
      getMyPlayerProfileFn({ data: { sessionToken: token } })
        .then((res) => {
          if (res) setProfile(res as any)
        })
        .catch((err) => {
          console.warn('Profile load notice:', err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [open, token])

  const handleNavigate = (tab: string) => {
    onClose()
    onNavigateToTab(tab)
  }

  const displayName = profile?.name || user?.name || 'Ciyaartoy'
  const displayJersey = profile?.jerseyNumber ?? '-'
  const displayPosition = profile?.position || 'Lama cayimin'
  const displayPhone = profile?.whatsapp || 'Lama diiwaangelin'
  const displayPin = profile?.pin || '1234'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Profile-ka & Settings-ka Ciyaartoyga"
    >
      <div className="space-y-5">
        {/* Profile Card Header */}
        <div className="flex items-center gap-3.5 rounded-xl border border-gold/40 bg-surface-raised p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold border border-gold/30 font-display text-xl font-bold">
            #{displayJersey}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg font-bold text-chalk">
              {displayName}
            </h3>
            <p className="truncate text-xs text-chalk-dim">
              {profile?.nickname ? `"${profile.nickname}" • ` : ''}
              {displayPosition}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[0.6875rem]">
              <span className="inline-flex items-center gap-1 text-success font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                Firfircoon (Active)
              </span>
            </div>
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="space-y-3">
          <SectionTitle eyebrow="XOGTAADA AASAASIGA AH" as="h3">
            Faahfaahinta Ciyaartoyga
          </SectionTitle>

          {isLoading ? (
            <div className="flex h-24 items-center justify-center text-xs text-gold">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span>Soo dejinaya xogta profile-ka...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-club-border bg-pitch-deep p-2.5">
                <div className="flex items-center gap-1.5 text-chalk-dim mb-1">
                  <Shirt className="h-3.5 w-3.5 text-gold" />
                  <span className="text-[0.6875rem] font-bold uppercase">
                    Lambarka Direyska
                  </span>
                </div>
                <strong className="text-chalk font-display text-base">
                  #{displayJersey}
                </strong>
              </div>

              <div className="rounded-lg border border-club-border bg-pitch-deep p-2.5">
                <div className="flex items-center gap-1.5 text-chalk-dim mb-1">
                  <User className="h-3.5 w-3.5 text-gold" />
                  <span className="text-[0.6875rem] font-bold uppercase">
                    Booska Ciyaarta
                  </span>
                </div>
                <strong className="text-chalk font-medium truncate block">
                  {displayPosition}
                </strong>
              </div>

              <div className="rounded-lg border border-club-border bg-pitch-deep p-2.5">
                <div className="flex items-center gap-1.5 text-chalk-dim mb-1">
                  <Phone className="h-3.5 w-3.5 text-gold" />
                  <span className="text-[0.6875rem] font-bold uppercase">
                    WhatsApp / Telefoon
                  </span>
                </div>
                <strong className="text-chalk font-medium truncate block">
                  {displayPhone}
                </strong>
              </div>

              <div className="rounded-lg border border-club-border bg-pitch-deep p-2.5">
                <div className="flex items-center justify-between text-chalk-dim mb-1">
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-gold" />
                    <span className="text-[0.6875rem] font-bold uppercase">
                      PIN-ka Sirta ah
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-gold hover:text-gold-light cursor-pointer"
                    title={showPin ? 'Qari PIN-ka' : 'Muuji PIN-ka'}
                  >
                    {showPin ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <strong className="text-gold font-mono text-base tracking-wider">
                  {showPin ? displayPin : '••••'}
                </strong>
              </div>
            </div>
          )}

          {profile?.createdAt ? (
            <p className="text-[0.6875rem] text-chalk-dim italic text-right m-0">
              Ku biiray kooxda:{' '}
              {formatSomaliDate(new Date(profile.createdAt).toISOString())}
            </p>
          ) : null}
        </div>

        {/* Secondary Navigation Hub */}
        <div className="space-y-3 pt-2 border-t border-club-border">
          <div>
            <SectionTitle eyebrow="QAYBAHA KALE EE APP-KA" as="h3">
              Adeegyada & Xogta Dheeraadka ah
            </SectionTitle>
            <p className="text-[0.6875rem] text-chalk-dim">
              Si degdeg ah ugu gudub qaybaha kale ee kooxda adigoon ka bixin
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleNavigate('chat')}
              className="flex items-center gap-2.5 rounded-xl border border-club-border bg-surface-raised p-3 text-left hover:border-gold hover:bg-gold/10 transition-all cursor-pointer group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold group-hover:bg-gold group-hover:text-pitch transition-colors">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <strong className="block text-xs font-bold text-chalk">
                  Wadahadal
                </strong>
                <span className="text-[0.6875rem] text-chalk-dim">
                  Sheekada kooxda
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('gallery')}
              className="flex items-center gap-2.5 rounded-xl border border-club-border bg-surface-raised p-3 text-left hover:border-gold hover:bg-gold/10 transition-all cursor-pointer group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold group-hover:bg-gold group-hover:text-pitch transition-colors">
                <Image className="h-4 w-4" />
              </div>
              <div>
                <strong className="block text-xs font-bold text-chalk">
                  Sawirrada
                </strong>
                <span className="text-[0.6875rem] text-chalk-dim">
                  Albamka kooxda
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('tips')}
              className="flex items-center gap-2.5 rounded-xl border border-club-border bg-surface-raised p-3 text-left hover:border-gold hover:bg-gold/10 transition-all cursor-pointer group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold group-hover:bg-gold group-hover:text-pitch transition-colors">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div>
                <strong className="block text-xs font-bold text-chalk">
                  Waanada & Talooyinka
                </strong>
                <span className="text-[0.6875rem] text-chalk-dim">
                  Talooyinka macallinka
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('rules')}
              className="flex items-center gap-2.5 rounded-xl border border-club-border bg-surface-raised p-3 text-left hover:border-gold hover:bg-gold/10 transition-all cursor-pointer group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold group-hover:bg-gold group-hover:text-pitch transition-colors">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <strong className="block text-xs font-bold text-chalk">
                  Shuruucda Kooxda
                </strong>
                <span className="text-[0.6875rem] text-chalk-dim">
                  Sharciyada rasmiga ah
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('suggestions')}
              className="flex items-center gap-2.5 rounded-xl border border-club-border bg-surface-raised p-3 text-left hover:border-gold hover:bg-gold/10 transition-all cursor-pointer group col-span-2"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold group-hover:bg-gold group-hover:text-pitch transition-colors">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <strong className="block text-xs font-bold text-chalk">
                  Fikradaha & Talo-bixinta
                </strong>
                <span className="text-[0.6875rem] text-chalk-dim">
                  U gudbi fikradahaaga maamulka kooxda
                </span>
              </div>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose} className="text-xs">
            Xir (Close)
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
