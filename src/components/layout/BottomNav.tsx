import { ADMIN_TABS, PLAYER_TABS, type TabItem } from './nav-tabs'

export { ADMIN_TABS, PLAYER_TABS, type TabItem }

export function BottomNav({
  tabs,
  activeTab,
  onSelectTab,
  pendingRequestsCount,
}: {
  tabs: TabItem[]
  activeTab: string
  onSelectTab: (tabId: string) => void
  pendingRequestsCount?: number
}) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-club-border bg-pitch/95 backdrop-blur-md"
      aria-label="Navigation Tabs"
    >
      <div className="mx-auto flex max-w-lg items-center overflow-x-auto no-scrollbar py-1.5 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const hasBadge =
            tab.id === 'requests' &&
            Boolean(pendingRequestsCount && pendingRequestsCount > 0)

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex min-w-[4.25rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 px-1.5 transition-colors ${
                isActive
                  ? 'text-gold font-bold bg-pitch-deep'
                  : 'text-chalk-dim hover:text-chalk'
              }`}
            >
              <div className="relative">
                <Icon className={`h-4 w-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {hasBadge ? (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.625rem] font-bold text-white">
                    {pendingRequestsCount}
                  </span>
                ) : null}
              </div>
              <span className="text-[0.625rem] tracking-tight truncate max-w-[4.5rem]">
                {tab.somaliLabel}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
