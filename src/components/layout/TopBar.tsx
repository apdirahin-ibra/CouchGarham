import { LogOut, Shield, User } from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { StatusBadge } from '../ui'

export function TopBar() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-club-border bg-pitch/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 sm:h-16 max-w-container-app items-center justify-between px-3 sm:px-app-gutter">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-gold/40 bg-surface-raised font-display text-base sm:text-lg font-bold text-gold shadow-md">
            BO
          </div>
          <div className="min-w-0">
            <h1 className="m-0 font-display text-base sm:text-lg font-bold uppercase tracking-wider text-chalk leading-tight truncate">
              Best Official
            </h1>
            <span className="block text-[0.625rem] sm:text-[0.6875rem] font-semibold uppercase tracking-widest text-gold leading-none truncate">
              Youth Football Club
            </span>
          </div>
        </div>

        {/* User Identity & Logout */}
        {user ? (
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {user.role === 'admin' ? (
              <StatusBadge
                tone="warning"
                className="gap-1 px-2 sm:px-2.5 py-0.5 text-[0.6875rem] sm:text-xs font-bold"
              >
                <Shield className="h-3 w-3 text-gold" />
                <span>Maamule</span>
              </StatusBadge>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full border border-club-border bg-surface px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs text-chalk">
                <User className="h-3.5 w-3.5 text-gold shrink-0" />
                <span className="max-w-[85px] sm:max-w-[120px] truncate font-medium">
                  {user.name}
                </span>
              </div>
            )}

            <button
              onClick={() => logout()}
              title="Ka Bax (Logout)"
              className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-club-border bg-surface text-chalk-dim hover:border-danger hover:text-danger active:scale-95 transition-colors cursor-pointer"
              type="button"
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
