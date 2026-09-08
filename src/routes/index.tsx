import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { AdminAttendanceTab } from '../components/admin/AdminAttendanceTab'
import { AdminChatTab } from '../components/admin/AdminChatTab'
import { AdminDashboardTab } from '../components/admin/AdminDashboardTab'
import { AdminFinanceTab } from '../components/admin/AdminFinanceTab'
import { AdminGalleryTab } from '../components/admin/AdminGalleryTab'
import { AdminPlayersTab } from '../components/admin/AdminPlayersTab'
import { AdminRequestsTab } from '../components/admin/AdminRequestsTab'
import { AdminRulesTab } from '../components/admin/AdminRulesTab'
import { AdminScheduleTab } from '../components/admin/AdminScheduleTab'
import { AdminStatsTab } from '../components/admin/AdminStatsTab'
import { AdminWaanoTab } from '../components/admin/AdminWaanoTab'
import { LoginView } from '../components/auth/LoginView'
import { BottomNav } from '../components/layout/BottomNav'
import { ADMIN_TABS, PLAYER_TABS } from '../components/layout/nav-tabs'
import { TopBar } from '../components/layout/TopBar'
import { PlayerAttendanceTab } from '../components/player/PlayerAttendanceTab'
import { PlayerChatTab } from '../components/player/PlayerChatTab'
import { PlayerDashboardTab } from '../components/player/PlayerDashboardTab'
import { PlayerFinanceTab } from '../components/player/PlayerFinanceTab'
import { PlayerGalleryTab } from '../components/player/PlayerGalleryTab'
import { PlayerLeaveTab } from '../components/player/PlayerLeaveTab'
import { PlayerRulesTab } from '../components/player/PlayerRulesTab'
import { PlayerScheduleTab } from '../components/player/PlayerScheduleTab'
import { PlayerSuggestionsTab } from '../components/player/PlayerSuggestionsTab'
import { PlayerWaanoTab } from '../components/player/PlayerWaanoTab'
import { useAuth } from '../lib/auth-client'
import { getAdminDashboardFn } from '../server/api'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { user, token, isLoading } = useAuth()
  const [adminTab, setAdminTab] = useState('dashboard')
  const [playerTab, setPlayerTab] = useState('dashboard')
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  useEffect(() => {
    if (user?.role === 'admin' && token && adminTab !== 'dashboard') {
      getAdminDashboardFn({ data: { sessionToken: token } })
        .then((data) => {
          if (data?.pendingRequests?.total !== undefined) {
            setPendingRequestsCount(data.pendingRequests.total)
          }
        })
        .catch(() => {
          // Keep count as 0 if load fails
        })
    }
  }, [user?.role, token, adminTab])

  const [visitedAdminTabs, setVisitedAdminTabs] = useState<Set<string>>(
    () => new Set(['dashboard']),
  )
  const [visitedPlayerTabs, setVisitedPlayerTabs] = useState<Set<string>>(
    () => new Set(['dashboard']),
  )

  useEffect(() => {
    setVisitedAdminTabs((prev) => {
      if (prev.has(adminTab)) return prev
      const next = new Set(prev)
      next.add(adminTab)
      return next
    })
  }, [adminTab])

  useEffect(() => {
    setVisitedPlayerTabs((prev) => {
      if (prev.has(playerTab)) return prev
      const next = new Set(prev)
      next.add(playerTab)
      return next
    })
  }, [playerTab])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pitch-deep text-chalk flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          <span className="text-sm font-semibold text-gold">
            Soo dejinaya xogta kooxda...
          </span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginView />
  }

  return (
    <div className="min-h-screen bg-pitch-deep text-chalk flex flex-col">
      <TopBar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {user.role === 'admin' ? (
          <>
            {visitedAdminTabs.has('dashboard') && (
              <div className={adminTab === 'dashboard' ? 'block' : 'hidden'}>
                <AdminDashboardTab
                  onNavigateToTab={setAdminTab}
                  onPendingRequestsCountChange={setPendingRequestsCount}
                />
              </div>
            )}
            {visitedAdminTabs.has('players') && (
              <div className={adminTab === 'players' ? 'block' : 'hidden'}>
                <AdminPlayersTab />
              </div>
            )}
            {visitedAdminTabs.has('attendance') && (
              <div className={adminTab === 'attendance' ? 'block' : 'hidden'}>
                <AdminAttendanceTab />
              </div>
            )}
            {visitedAdminTabs.has('stats') && (
              <div className={adminTab === 'stats' ? 'block' : 'hidden'}>
                <AdminStatsTab />
              </div>
            )}
            {visitedAdminTabs.has('requests') && (
              <div className={adminTab === 'requests' ? 'block' : 'hidden'}>
                <AdminRequestsTab />
              </div>
            )}
            {visitedAdminTabs.has('schedule') && (
              <div className={adminTab === 'schedule' ? 'block' : 'hidden'}>
                <AdminScheduleTab />
              </div>
            )}
            {visitedAdminTabs.has('chat') && (
              <div className={adminTab === 'chat' ? 'block' : 'hidden'}>
                <AdminChatTab />
              </div>
            )}
            {visitedAdminTabs.has('gallery') && (
              <div className={adminTab === 'gallery' ? 'block' : 'hidden'}>
                <AdminGalleryTab />
              </div>
            )}
            {visitedAdminTabs.has('finance') && (
              <div className={adminTab === 'finance' ? 'block' : 'hidden'}>
                <AdminFinanceTab />
              </div>
            )}
            {visitedAdminTabs.has('tips') && (
              <div className={adminTab === 'tips' ? 'block' : 'hidden'}>
                <AdminWaanoTab />
              </div>
            )}
            {visitedAdminTabs.has('rules') && (
              <div className={adminTab === 'rules' ? 'block' : 'hidden'}>
                <AdminRulesTab />
              </div>
            )}

            <BottomNav
              tabs={ADMIN_TABS}
              activeTab={adminTab}
              onSelectTab={setAdminTab}
              pendingRequestsCount={pendingRequestsCount}
            />
          </>
        ) : (
          <>
            {visitedPlayerTabs.has('dashboard') && (
              <div className={playerTab === 'dashboard' ? 'block' : 'hidden'}>
                <PlayerDashboardTab onNavigateToTab={setPlayerTab} />
              </div>
            )}
            {visitedPlayerTabs.has('attendance') && (
              <div className={playerTab === 'attendance' ? 'block' : 'hidden'}>
                <PlayerAttendanceTab />
              </div>
            )}
            {visitedPlayerTabs.has('schedule') && (
              <div className={playerTab === 'schedule' ? 'block' : 'hidden'}>
                <PlayerScheduleTab />
              </div>
            )}
            {visitedPlayerTabs.has('leaves') && (
              <div className={playerTab === 'leaves' ? 'block' : 'hidden'}>
                <PlayerLeaveTab />
              </div>
            )}
            {visitedPlayerTabs.has('suggestions') && (
              <div className={playerTab === 'suggestions' ? 'block' : 'hidden'}>
                <PlayerSuggestionsTab />
              </div>
            )}
            {visitedPlayerTabs.has('chat') && (
              <div className={playerTab === 'chat' ? 'block' : 'hidden'}>
                <PlayerChatTab />
              </div>
            )}
            {visitedPlayerTabs.has('gallery') && (
              <div className={playerTab === 'gallery' ? 'block' : 'hidden'}>
                <PlayerGalleryTab />
              </div>
            )}
            {visitedPlayerTabs.has('finance') && (
              <div className={playerTab === 'finance' ? 'block' : 'hidden'}>
                <PlayerFinanceTab />
              </div>
            )}
            {visitedPlayerTabs.has('tips') && (
              <div className={playerTab === 'tips' ? 'block' : 'hidden'}>
                <PlayerWaanoTab />
              </div>
            )}
            {visitedPlayerTabs.has('rules') && (
              <div className={playerTab === 'rules' ? 'block' : 'hidden'}>
                <PlayerRulesTab />
              </div>
            )}

            <BottomNav
              tabs={PLAYER_TABS}
              activeTab={playerTab}
              onSelectTab={setPlayerTab}
            />
          </>
        )}
      </main>
    </div>
  )
}
