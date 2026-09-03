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
            {adminTab === 'dashboard' && (
              <AdminDashboardTab
                onNavigateToTab={setAdminTab}
                onPendingRequestsCountChange={setPendingRequestsCount}
              />
            )}
            {adminTab === 'players' && <AdminPlayersTab />}
            {adminTab === 'attendance' && <AdminAttendanceTab />}
            {adminTab === 'stats' && <AdminStatsTab />}
            {adminTab === 'requests' && <AdminRequestsTab />}
            {adminTab === 'schedule' && <AdminScheduleTab />}
            {adminTab === 'chat' && <AdminChatTab />}
            {adminTab === 'gallery' && <AdminGalleryTab />}
            {adminTab === 'finance' && <AdminFinanceTab />}
            {adminTab === 'tips' && <AdminWaanoTab />}
            {adminTab === 'rules' && <AdminRulesTab />}

            <BottomNav
              tabs={ADMIN_TABS}
              activeTab={adminTab}
              onSelectTab={setAdminTab}
              pendingRequestsCount={pendingRequestsCount}
            />
          </>
        ) : (
          <>
            {playerTab === 'dashboard' && (
              <PlayerDashboardTab onNavigateToTab={setPlayerTab} />
            )}
            {playerTab === 'attendance' && <PlayerAttendanceTab />}
            {playerTab === 'schedule' && <PlayerScheduleTab />}
            {playerTab === 'leaves' && <PlayerLeaveTab />}
            {playerTab === 'suggestions' && <PlayerSuggestionsTab />}
            {playerTab === 'chat' && <PlayerChatTab />}
            {playerTab === 'gallery' && <PlayerGalleryTab />}
            {playerTab === 'finance' && <PlayerFinanceTab />}
            {playerTab === 'tips' && <PlayerWaanoTab />}
            {playerTab === 'rules' && <PlayerRulesTab />}

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
