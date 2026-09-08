import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
  const navRef = useRef<HTMLDivElement | null>(null)
  const buttonsRef = useRef<Record<string, HTMLButtonElement | null>>({})
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = navRef.current
    if (!el) return
    const hasOverflow = el.scrollWidth > el.clientWidth + 4
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(
      hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 10,
    )
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = navRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState, tabs.length])

  // Automatically scroll active tab into view when it changes
  useEffect(() => {
    const activeEl = buttonsRef.current[activeTab]
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
    // Update scroll indicators after animation
    const timer = setTimeout(updateScrollState, 350)
    return () => clearTimeout(timer)
  }, [activeTab, updateScrollState])

  const scrollNav = (delta: number) => {
    if (navRef.current && typeof navRef.current.scrollBy === 'function') {
      navRef.current.scrollBy({ left: delta, behavior: 'smooth' })
    }
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-club-border bg-pitch/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0.25rem)]"
      aria-label="Navigation Tabs"
    >
      <div className="relative mx-auto max-w-2xl">
        {/* Left scroll hint */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollNav(-160)}
            aria-label="Dib u eeg tab-yada hore"
            className="absolute left-0 top-0 bottom-0 z-20 flex w-7 items-center justify-center bg-gradient-to-r from-pitch via-pitch/90 to-transparent text-gold hover:text-chalk active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Scrollable Tabs */}
        <div
          ref={navRef}
          className="flex items-center overflow-x-auto no-scrollbar scroll-smooth py-1.5 px-2"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const hasBadge =
              tab.id === 'requests' &&
              Boolean(pendingRequestsCount && pendingRequestsCount > 0)

            return (
              <button
                key={tab.id}
                ref={(el) => {
                  buttonsRef.current[tab.id] = el
                }}
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex min-w-[3.75rem] sm:min-w-[4.25rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg py-1 px-1 sm:px-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'text-gold font-bold bg-pitch-deep shadow-inner'
                    : 'text-chalk-dim hover:text-chalk hover:bg-surface/50'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`h-4 w-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`}
                  />
                  {hasBadge ? (
                    <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.625rem] font-bold text-white">
                      {pendingRequestsCount}
                    </span>
                  ) : null}
                </div>
                <span className="text-[0.625rem] sm:text-[0.6875rem] tracking-tight truncate max-w-[4.25rem]">
                  {tab.somaliLabel}
                </span>
                {isActive ? (
                  <span className="h-0.5 w-3 rounded-full bg-gold transition-all" />
                ) : (
                  <span className="h-0.5 w-3 opacity-0" />
                )}
              </button>
            )
          })}
        </div>

        {/* Right scroll hint */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollNav(160)}
            aria-label="Eeg tab-yada kale"
            className="absolute right-0 top-0 bottom-0 z-20 flex w-7 items-center justify-center bg-gradient-to-l from-pitch via-pitch/90 to-transparent text-gold hover:text-chalk active:scale-95 transition-all cursor-pointer"
          >
            <ChevronRight className="h-4 w-4 animate-pulse" />
          </button>
        )}
      </div>
    </nav>
  )
}
